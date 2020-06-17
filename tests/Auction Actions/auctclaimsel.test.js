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

test("claim auction", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946684500,
                assets_transferred: true,
                current_bid: "100.00000000 WAX",
                current_bidder: user2.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toEqual([
        {
            auction_id: "1",
            seller: user1.accountName,
            asset_ids: ["1099511627776"],
            end_time: 946684500,
            assets_transferred: true,
            current_bid: "100.00000000 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: true,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

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
});

test("claim auction when buyer has already claimed", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946684500,
                assets_transferred: true,
                current_bid: "100.00000000 WAX",
                current_bidder: user2.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: true,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toBeUndefined();

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
});

test("claim auction with custom marketplaces", async () => {
    expect.assertions(2);

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

    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946684500,
                assets_transferred: true,
                current_bid: "100.00000000 WAX",
                current_bidder: user2.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "mymarket1111",
                taker_marketplace: "mymarket2222",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toEqual([
        {
            auction_id: "1",
            seller: user1.accountName,
            asset_ids: ["1099511627776"],
            end_time: 946684500,
            assets_transferred: true,
            current_bid: "100.00000000 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: true,
            claimed_by_buyer: false,
            maker_marketplace: "mymarket1111",
            taker_marketplace: "mymarket2222",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

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
});

test("claim auction with minimal bid", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946684500,
                assets_transferred: true,
                current_bid: "0.00000001 WAX",
                current_bidder: user2.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toEqual([
        {
            auction_id: "1",
            seller: user1.accountName,
            asset_ids: ["1099511627776"],
            end_time: 946684500,
            assets_transferred: true,
            current_bid: "0.00000001 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: true,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user1.accountName,
            quantities: ["0.00000001 WAX"]
        }
    ]);
});

test("claim auction with very small bid", async () => {
    expect.assertions(2);

    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946684500,
                assets_transferred: true,
                current_bid: "0.00000050 WAX",
                current_bidder: user2.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toEqual([
        {
            auction_id: "1",
            seller: user1.accountName,
            asset_ids: ["1099511627776"],
            end_time: 946684500,
            assets_transferred: true,
            current_bid: "0.00000050 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: true,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

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
});

test("throw when no auction with this id exists", async () => {
    await expect(atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No auction with this auction_id exists");
});

test("throw when the auction is not active", async () => {
    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: false,
                current_bid: "10.00000000 WAX",
                current_bidder: user2.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The auction is not active");
});

test("throw when the auction is not finished yet", async () => {
    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "10.00000000 WAX",
                current_bidder: user2.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The auction is not finished yet");
});

test("throw when the auction does not have any bids", async () => {
    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946684500,
                assets_transferred: true,
                current_bid: "10.00000000 WAX",
                current_bidder: "",
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The auction does not have any bids");
});

test("throw without authorization from the auctions seller", async () => {
    await atomicassets.loadFixtures("assets", {
        "atomicmarket": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946684500,
                assets_transferred: true,
                current_bid: "10.00000000 WAX",
                current_bidder: user2.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctclaimsel({
        auction_id: "1"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});