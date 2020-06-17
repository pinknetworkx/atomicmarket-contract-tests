const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);
const atomicassets = blockchain.createAccount(`atomicassets`);
const delphioracle = blockchain.createAccount('delphioracle');

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

    delphioracle.setContract(blockchain.contractTemplates[`delphioracle`]);
    await delphioracle.loadFixtures();

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                "active": true,
                "bounty_awarded": true,
                "bounty_edited_by_custodians": false,
                "proposer": "nate",
                "name": "usdwaxp",
                "bounty_amount": "0.00000000 WAX",
                "approving_custodians": ["alohaeosprod"],
                "approving_oracles": [],
                "base_symbol": "2,USD",
                "base_type": 4,
                "base_contract": "",
                "quote_symbol": "8,WAXP",
                "quote_type": 1,
                "quote_contract": "",
                "quoted_precision": 4
            }
        ]
    });
    await delphioracle.loadFixtures("datapoints", {
        "usdwaxp": [
            {
                "id": "0",
                "owner": "pink.gg",
                "value": "200000",
                "median": "200000",
                "timestamp": 0
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
            collection_name: "testcollect1",
            author: "colauthor",
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
});

test("purchase direct sale of single asset", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: "colauthor",
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "pink.network",
            quantities: ["2.00000000 WAX"]
        },
        {
            owner: user1.accountName,
            quantities: ["93.00000000 WAX"]
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
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
});

test("purchase sale when buyer has more balance than sale price", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["200.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: "colauthor",
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "pink.network",
            quantities: ["2.00000000 WAX"]
        },
        {
            owner: user1.accountName,
            quantities: ["93.00000000 WAX"]
        },
        {
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
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
});

test("purchase direct sale of multiple assets", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
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
            }
        ]
    });

    await atomicassets.loadFixtures("offers", {
        "atomicassets": [
            {
                offer_id: "1",
                sender: user1.accountName,
                recipient: atomicmarket.accountName,
                sender_asset_ids: ["1099511627776", "1099511627777", "1099511627778"],
                recipient_asset_ids: [],
                memo: ""
            }
        ]
    });

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776", "1099511627777", "1099511627778"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: "colauthor",
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "pink.network",
            quantities: ["2.00000000 WAX"]
        },
        {
            owner: user1.accountName,
            quantities: ["93.00000000 WAX"]
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
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
        }
    ]);
});

test("purchase sale with minimal price", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["0.00000001 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "0.00000001 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["0.00000001 WAX"]
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
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
});

test("purchase sale with very small price", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["0.00000050 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "0.00000050 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: "colauthor",
            quantities: ["0.00000002 WAX"]
        },
        {
            owner: user1.accountName,
            quantities: ["0.00000048 WAX"]
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
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
});

test("purchase delphi sale", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "5.00 USD",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 500,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: "colauthor",
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "pink.network",
            quantities: ["2.00000000 WAX"]
        },
        {
            owner: user1.accountName,
            quantities: ["93.00000000 WAX"]
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
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
});

test("purchase sale with inverted delphi price", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.contract.adddelphi({
        delphi_pair_name: "usdwaxp",
        invert_delphi_pair: true,
        listing_symbol: "2,RUSD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "5.00 RUSD",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 200000,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: "colauthor",
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "pink.network",
            quantities: ["2.00000000 WAX"]
        },
        {
            owner: user1.accountName,
            quantities: ["93.00000000 WAX"]
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
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
});

test("purchase sale with custom marketplaces", async () => {
    expect.assertions(3);

    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [
            {
                marketplace_name: "mymarket1111",
                creator: "marketowner1"
            },
            {
                marketplace_name: "mymarket2222",
                creator: "marketowner2"
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
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "mymarket1111",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: "mymarket2222"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const sales = atomicmarket.getTableRowsScoped("sales")["atomicmarket"];
    expect(sales).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: "colauthor",
            quantities: ["5.00000000 WAX"]
        },
        {
            owner: "marketowner1",
            quantities: ["1.00000000 WAX"]
        },
        {
            owner: "marketowner2",
            quantities: ["1.00000000 WAX"]
        },
        {
            owner: user1.accountName,
            quantities: ["93.00000000 WAX"]
        }
    ]);

    const user2_assets = atomicassets.getTableRowsScoped("assets")[user2.accountName];
    expect(user2_assets).toEqual([
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
});

test("throw when sale with this id does not exist", async () => {
    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("No sale with this sale_id exists");
});

test("throw when trying to purchase own sale", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user1.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You can't purchase your own sale");
});

test("throw when sale is not active yet", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "-1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("This sale is not active yet.");
});

test("throw when seller cancelled atomicassets offer", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The seller cancelled the atomicassets offer related to this sale");
});

test("throw when purchasing direct sale and delphi median is not 0", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 54321,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("intended delphi median needs to be 0 for non delphi sales");
});

test("throw when marketplace is invalid", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: "fakemarket"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The taker marketplace is not a valid marketplace");
});

test("throw when delphi median is not found", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "5.00 USD",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 550,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("No datapoint with the intended median was found.");
});

test("throw when buyer does not have a balance row", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance table row");
});

test("throw when buyer's balance is not sufficient", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["50.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account's balance is lower than the specified quantity");
});

test("throw when buyer only has a balance for another token", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["500.0000 KARMA"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance for the symbol specified in the quantity");
});

test("throw without authorization from buyer", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("sales", {
        "atomicmarket": [
            {
                sale_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                offer_id: "1",
                listing_price: "100.00000000 WAX",
                settlement_symbol: "8,WAX",
                maker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.purchasesale({
        buyer: user2.accountName,
        sale_id: 1,
        intended_delphi_median: 0,
        taker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});