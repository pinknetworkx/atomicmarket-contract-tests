const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);
const atomicassets = blockchain.createAccount(`atomicassets`);

const user1 = blockchain.createAccount(`user1`);
const user2 = blockchain.createAccount(`user2`);

beforeAll(async () => {
    atomicmarket.setContract(blockchain.contractTemplates[`atomicmarket`]);
    atomicmarket.updateAuth(`active`, `owner`, {
        accounts: [
            {
                permission: {
                    actor: atomicmarket.accountName,
                    permission: `eosio.code`
                },
                weight: 1
            }
        ]
    });

    atomicassets.setContract(blockchain.contractTemplates[`atomicassets`]);
    atomicassets.updateAuth(`active`, `owner`, {
        accounts: [
            {
                permission: {
                    actor: atomicassets.accountName,
                    permission: `eosio.code`
                },
                weight: 1
            }
        ]
    });
});

beforeEach(async () => {
    atomicmarket.resetTables();
    atomicassets.resetTables();

    await atomicmarket.loadFixtures();
    await atomicassets.loadFixtures();

    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcol",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("schemas", {
        "testcol": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });
});

test("cancel sale with active offer", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user1.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: ""
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.cancelsale({
        sale_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const offers = atomicassets.getTableRowsScoped("offers")["atomicassets"];
    expect(offers).toBeUndefined();
});

test("cancel sale without offer", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });
    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "-1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.cancelsale({
        sale_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();
});

test("cancel sale with cancelled offer", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.cancelsale({
        sale_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();
});

test("cancel invalid sale without auth (offer cancelled)", async () => {await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.cancelsale({
        sale_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();
});

test("cancel invalid sale without auth - seller does not own asset", async () => {
    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user1.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: ""
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.cancelsale({
        sale_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();
});

test("throw when sale with this id does not exist", async () => {
    await expect(atomicmarket.contract.cancelsale({
        sale_id: 1
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No sale with this sale_id exists");
});

test("throw when cancelling active sale without auth", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user1.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: ""
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.cancelsale({
        sale_id: 1
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The sale is not invalid, therefore the authorization of the seller is needed to cancel it");
});