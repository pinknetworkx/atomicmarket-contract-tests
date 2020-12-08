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

test("decline buyoffer", async () => {
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
            quantities: ["50.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("buyoffers", {
        "atomicmarket": [{
            buyoffer_id: "1",
            buyer: user1.accountName,
            recipient: user2.accountName,
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await atomicmarket.contract.declinebuyo({
        buyoffer_id: "1",
        decline_memo: "My decline memo"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }]);

    const buyoffers = atomicmarket.getTableRowsScoped("buyoffers")["atomicmarket"];
    expect(buyoffers).toBeUndefined();

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }
    ]);
});

test("throw when no buyoffer with the id exists", async () => {
    await expect(atomicmarket.contract.declinebuyo({
        buyoffer_id: "1",
        decline_memo: "My decline memo"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("No buyoffer with this id exists");
});

test("throw when the decline memo is over 256 bytes", async () => {
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
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await expect(atomicmarket.contract.declinebuyo({
        buyoffer_id: "1",
        decline_memo:"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor " +
            "invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam " +
            "et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata s",
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("A decline memo can only be 256 characters max");
});

test("throw without authorization of the recipient", async () => {
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
            price: "50.00000000 WAX",
            asset_ids: ["1099511627776"],
            memo: "My memo",
            maker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }]
    });

    await expect(atomicmarket.contract.declinebuyo({
        buyoffer_id: "1",
        decline_memo: "My decline memo"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});