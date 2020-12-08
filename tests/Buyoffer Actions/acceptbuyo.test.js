const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);
const atomicassets = blockchain.createAccount(`atomicassets`);
const eosio_token = blockchain.createAccount('eosio.token');

const user1 = blockchain.createAccount(`user1`);
const user2 = blockchain.createAccount(`user2`);
const colauthor = blockchain.createAccount(`colauthor`);

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

    eosio_token.setContract(blockchain.contractTemplates['eosio.token']);
});

beforeEach(async () => {
    atomicmarket.resetTables();
    atomicassets.resetTables();
    eosio_token.resetTables();

    await atomicmarket.loadFixtures();
    await atomicassets.loadFixtures();

    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: colauthor.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("schemas", {
        "testcollect1": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });

    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "atomicmarket": [{
            balance: "100.00000000 WAX"
        }]
    });
});

test("accept buyoffer for single asset", async () => {
    expect.assertions(4);

    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.contract.createoffer({
        sender: user2.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "buyoffer"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    await atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toBeUndefined();

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: colauthor.accountName,
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "fees.atomic",
            quantities: ["2.00000000 WAX"]
        }
    ]);

    const user2_tokens = eosio_token.getTableRowsScoped("accounts")[user2.accountName];
    expect(user2_tokens).toEqual([
        {
            balance: "93.00000000 WAX"
        }
    ]);
});

test("accept buyoffer for multiple assets", async () => {
    expect.assertions(4);

    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776", "1099511627777"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.contract.createoffer({
        sender: user2.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: [],
        memo: "buyoffer"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    await atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776", "1099511627777"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toBeUndefined();

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: colauthor.accountName,
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "fees.atomic",
            quantities: ["2.00000000 WAX"]
        }
    ]);

    const user2_tokens = eosio_token.getTableRowsScoped("accounts")[user2.accountName];
    expect(user2_tokens).toEqual([
        {
            balance: "93.00000000 WAX"
        }
    ]);
});

test("accept buyoffer with permutation of asset ids in AA offer", async () => {
    expect.assertions(4);

    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776", "1099511627777"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.contract.createoffer({
        sender: user2.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627777", "1099511627776"],
        recipient_asset_ids: [],
        memo: "buyoffer"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    await atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776", "1099511627777"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toBeUndefined();

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: colauthor.accountName,
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "fees.atomic",
            quantities: ["2.00000000 WAX"]
        }
    ]);

    const user2_tokens = eosio_token.getTableRowsScoped("accounts")[user2.accountName];
    expect(user2_tokens).toEqual([
        {
            balance: "93.00000000 WAX"
        }
    ]);
});

test("accept buyoffer with permutation of asset ids in expected asset ids", async () => {
    expect.assertions(4);

    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776", "1099511627777"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.contract.createoffer({
        sender: user2.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776", "1099511627777"],
        recipient_asset_ids: [],
        memo: "buyoffer"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    await atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627777", "1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toBeUndefined();

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        },
        {
            asset_id: "1099511627777",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: colauthor.accountName,
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "fees.atomic",
            quantities: ["2.00000000 WAX"]
        }
    ]);

    const user2_tokens = eosio_token.getTableRowsScoped("accounts")[user2.accountName];
    expect(user2_tokens).toEqual([
        {
            balance: "93.00000000 WAX"
        }
    ]);
});

test("accept buyoffer with different taker marketplace", async () => {
    expect.assertions(4);

    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [{
            marketplace_name: "mymarket1111",
            creator: "marketowner"
        }]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.contract.createoffer({
        sender: user2.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "buyoffer"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    await atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: "mymarket1111"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toBeUndefined();

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: colauthor.accountName,
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "fees.atomic",
            quantities: ["1.00000000 WAX"]
        },
        {
            owner: "marketowner",
            quantities: ["1.00000000 WAX"]
        }
    ]);

    const user2_tokens = eosio_token.getTableRowsScoped("accounts")[user2.accountName];
    expect(user2_tokens).toEqual([
        {
            balance: "93.00000000 WAX"
        }
    ]);
});

test("accept buyoffer using fixture offers", async () => {
    expect.assertions(4);

    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toBeUndefined();

    const user1_assets = atomicassets.getTableRowsScoped("assets")[user1.accountName];
    expect(user1_assets).toEqual([
        {
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: colauthor.accountName,
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "fees.atomic",
            quantities: ["2.00000000 WAX"]
        }
    ]);

    const user2_tokens = eosio_token.getTableRowsScoped("accounts")[user2.accountName];
    expect(user2_tokens).toEqual([
        {
            balance: "93.00000000 WAX"
        }
    ]);
});

test("throw when the expected asset ids differ from the buyoffer", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776", "1099511627777"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776", "1099511627777"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776", "1099511627778"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("The asset ids of this buyoffer differ from the expected asset ids");
});

test("throw when no buyoffer with the specified id exists", async () => {
    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("No buyoffer with this id exists");
});

test("throw when the expected price differs from the buyoffer", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "50.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("The price of this buyoffer differ from the expected price");
});

test("throw when no AtomicAssets offer exists", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("cannot decrement end iterator when the table is empty");
});

test("throw when the most recent offer is not from the buyoffer recipient", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: "otheraccount",
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["100"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("The last created AtomicAssets offer must be from the buyoffer recipient to the AtomicMarket contract");
});

test("throw when the most recent offer is not for the atomicmarket account", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: "otheraccount",
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("The last created AtomicAssets offer must be from the buyoffer recipient to the AtomicMarket contract");
});

test("throw when the most recent offer contains wrong assets ", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627778",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627778", "1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627778", "1099511627777"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627778", "1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("The last created AtomicAssets offer must contain the assets of the buyoffer");
});

test("throw when the most recent offer asks for NFTs back", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ],
        "atomicmarket": [
            {
                asset_id: "1099511627777",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: ["1099511627777"],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("The last created AtomicAssets offer must not ask for any assets in return");
});

test("throw when offer memo is invalid", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: "this memo is invalid",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("The last created AtomicAssets offer must have the memo \"buyoffer\"");
});

test("throw when the most recent offer is invalid", async () => {
    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("Offer sender doesn't own at least one of the provided assets");
});

test("throw when the taker marketplace is invalid", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: "fakemarket"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrowError("The taker marketplace is not a valid marketplace");
});

test("throw without authorization from the recipient", async () => {
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "100.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user2.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776"],
                recipient_asset_ids: [],
                memo: "buyoffer",
                ram_payer: "eosio"
            }
        ]
    });

    await expect(atomicmarket.contract.acceptbuyo({
        buyoffer_id: "1",
        expected_asset_ids: ["1099511627776"],
        expected_price: "100.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrowError("Missing required authority");
});