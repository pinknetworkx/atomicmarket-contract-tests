const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);
const atomicassets = blockchain.createAccount(`atomicassets`);

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
});

beforeEach(async () => {
    atomicmarket.resetTables();
    atomicassets.resetTables();

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
});

test("create buyoffer for a single asset", async () => {
    expect.assertions(3);

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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toEqual([
        {
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);

    const counters = atomicmarket.getTableRowsScoped("counters")["atomicmarket"];
    expect(counters).toEqual([
        {counter_name: "buyoffer", counter_value: "2"}
    ]);
});

test("create second buyoffer", async () => {
    expect.assertions(3);

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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627777"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toEqual([
        {
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        },
        {
            buyoffer_id: "2",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627777"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toBeUndefined();

    const counters = atomicmarket.getTableRowsScoped("counters")["atomicmarket"];
    expect(counters).toEqual([
        {counter_name: "buyoffer", counter_value: "3"}
    ]);
});

test("create two buyoffers for the same asset", async () => {
    expect.assertions(3);

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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "30.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My second memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toEqual([
        {
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "30.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        },
        {
            buyoffer_id: "2",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My second memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["20.00000000 WAX"]
        }
    ]);

    const counters = atomicmarket.getTableRowsScoped("counters")["atomicmarket"];
    expect(counters).toEqual([
        {counter_name: "buyoffer", counter_value: "3"}
    ]);
});

test("create buyoffer for multiple assets", async () => {
    expect.assertions(2);

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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776", "1099511627777"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toEqual([
        {
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776", "1099511627777"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);
});

test("create buyoffer with a different token", async () => {
    expect.assertions(2);

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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.0000 KARMA"]
        }]
    });

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.0000 KARMA",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toEqual([
        {
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.0000 KARMA",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["50.0000 KARMA"]
        }
    ]);
});

test("create buyoffer with a different marketplace", async () => {
    expect.assertions(3);

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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: "mymarket1111"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toEqual([
        {
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "mymarket1111",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);

    const counters = atomicmarket.getTableRowsScoped("counters")["atomicmarket"];
    expect(counters).toEqual([
        {counter_name: "buyoffer", counter_value: "2"}
    ]);
});

test("create buyoffer with a different collection fee", async () => {
    expect.assertions(3);

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
    await atomicassets.contract.setmarketfee({
        collection_name: "testcollect1",
        market_fee: 0.0
    }, [{
        actor: colauthor.accountName,
        permission: "active"
    }]);

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toEqual([
        {
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.0
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);

    const counters = atomicmarket.getTableRowsScoped("counters")["atomicmarket"];
    expect(counters).toEqual([
        {counter_name: "buyoffer", counter_value: "2"}
    ]);
});

test("create buyoffer for an asset with a template", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: true,
            burnable: true,
            max_supply: 0,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("assets", {
        "user2": [
            {
                asset_id: "1099511627776",
                collection_name: "testcollect1",
                schema_name: "testschema",
                template_id: 1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toEqual([
        {
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);
});

test("throw when buyer is equal to recipient", async () => {
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
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user1.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("buyer and recipient can't be the same account");
});

test("throw when asset_ids is empty", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: [],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("asset_ids needs to contain at least one id");
});

test("throw when asset_ids contain duplicates", async () => {
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776", "1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The asset_ids must not contain duplicates");
});

test("throw when recipient does not own one of the assets", async () => {
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776", "1099511627777"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not own at least one of the assets");
});

test("throw when one of the assets is not transferable", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcollect1": [{
            template_id: 1,
            schema_name: "testschema",
            transferable: false,
            burnable: true,
            max_supply: 0,
            issued_supply: 5,
            immutable_serialized_data: []
        }]
    });
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
                template_id: 1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776", "1099511627777"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("At least one of the assets is not transferable");
});

test("throw when the assets are of different collections", async () => {
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
                collection_name: "othercollect",
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
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776", "1099511627777"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified asset ids must all belong to the same collection");
});

test("throw when the price symbol is not supported", async () => {
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.0000 FAKE",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The symbol of the specified price is not supported");
});

test("throw when the price is zero", async () => {
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "0.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The price must be greater than zero");
});

test("throw when the price is negative", async () => {
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "-10.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The price must be greater than zero");
});

test("throw when the specified market does not exist", async () => {
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: "fakemarket"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The maker marketplace is not a valid marketplace");
});

test("throw when the memo is over 256 bytes", async () => {
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor " +
            "invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam " +
            "et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata s",
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("A buyoffer memo can only be 256 characters max");
});

test("throw without authorization from the seller", async () => {
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

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.createbuyo({
        buyer: user1.accountName,
        recipient: user2.accountName,
        price: "50.00000000 WAX",
        asset_ids: ["1099511627776"],
        memo: "My memo",
        maker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});