const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);
const atomicassets = blockchain.createAccount(`atomicassets`);

const atomicfake = blockchain.createAccount(`atomicfake`);

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

    atomicfake.setContract(blockchain.contractTemplates[`atomicassets`]);
    atomicfake.updateAuth(`active`, `owner`, {
        accounts: [
            {
                permission: {
                    actor: atomicfake.accountName,
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

test("send offer for single asset sale", async () => {
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toEqual([
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
    ]);
});

test("send offer for multiple asset sale", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627778",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627778", "1099511627776", "1099511627777"],
                offer_id: "-1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627777", "1099511627776", "1099511627778"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toEqual([
        {
            sale_id: "1",
            seller: user1.accountName,
            asset_ids: ["1099511627778", "1099511627776", "1099511627777"],
            offer_id: "1",
            listing_price: "10.00000000 WAX",
            settlement_symbol: "8,WAX",
            maker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("send offer for a sale for which an equal sale by another seller exists", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user2.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "10",
                listing_price: "20.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            },
            {
                sale_id: "2",
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toEqual([
        {
            sale_id: "1",
            seller: user2.accountName,
            asset_ids: ["1099511627776"],
            offer_id: "10",
            listing_price: "20.00000000 WAX",
            settlement_symbol: "8,WAX",
            maker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        },
        {
            sale_id: "2",
            seller: user1.accountName,
            asset_ids: ["1099511627776"],
            offer_id: "1",
            listing_price: "10.00000000 WAX",
            settlement_symbol: "8,WAX",
            maker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("send offer when other unrelated sales exist", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ],
        "user2": [
            {
                asset_id: "1099511627777",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627778",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user2.accountName,
                asset_ids: ["1099511627777"],
                offer_id: "5",
                listing_price: "6.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            },
            {
                sale_id: "2",
                seller: user2.accountName,
                asset_ids: ["1099511627777", "1099511627778"],
                offer_id: "-1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            },
            {
                sale_id: "3",
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

    await atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toEqual([
        {
            sale_id: "1",
            seller: user2.accountName,
            asset_ids: ["1099511627777"],
            offer_id: "5",
            listing_price: "6.00000000 WAX",
            settlement_symbol: "8,WAX",
            maker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        },
        {
            sale_id: "2",
            seller: user2.accountName,
            asset_ids: ["1099511627777", "1099511627778"],
            offer_id: "-1",
            listing_price: "10.00000000 WAX",
            settlement_symbol: "8,WAX",
            maker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        },
        {
            sale_id: "3",
            seller: user1.accountName,
            asset_ids: ["1099511627776"],
            offer_id: "1",
            listing_price: "10.00000000 WAX",
            settlement_symbol: "8,WAX",
            maker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("throw when asking for assets back in offer", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
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
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: ["1099511627777"],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You must not ask for any assets in return in a sale offer");
});

test("throw when no sale was announced", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No sale was announced by this sender for the offered assets");
});

test("throw when no sale was announced, but a bigger sale containing the same assets", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            },
            {
                asset_id: "1099511627777",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776", "1099511627777"],
                offer_id: "-1",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No sale was announced by this sender for the offered assets");
});

test("throw when only announced sale is from a different seller", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user2.accountName,
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No sale was announced by this sender for the offered assets");
});

test("throw when an offer for the sale was already created", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "10",
                listing_price: "10.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("An offer for this sale has already been created");
});

test("throw when memo is invalid", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
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

    await expect(atomicassets.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "Wrong memo!"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Invalid memo");
});

test("do nothing on notifications from fake atomicassets contract", async () => {
    await atomicfake.loadFixtures("config", {
        "atomicfake": [
            {
                "asset_counter": "1099511627776",
                "template_counter": 1,
                "offer_counter": "1",
                "collection_format": [
                    {"name": "name", "type": "string"},
                    {"name": "img", "type": "ipfs"},
                    {"name": "description", "type": "string"}
                ],
                "supported_tokens": [
                    {"token_contract": "eosio.token", "token_symbol": "8,WAX"}
                ]
            }
        ]
    });

    await atomicfake.loadFixtures("collections", {
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
    await atomicfake.loadFixtures("schemas", {
        "testcol": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });


    await atomicfake.loadFixtures("assets", {
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

    await atomicfake.contract.createoffer({
        sender: user1.accountName,
        recipient: atomicmarket.accountName,
        sender_asset_ids: ["1099511627776"],
        recipient_asset_ids: [],
        memo: "sale"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toEqual([
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
    ]);
});