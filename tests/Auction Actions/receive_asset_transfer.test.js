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
            collection_name: "testcollect1",
            author: user1.accountName,
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

test("transfer single asset for auction", async () => {
    await atomicassets.loadFixtures("assets", {
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
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

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        asset_ids: ["1099511627776"],
        memo: "auction"
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
            end_time: 946685400,
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
    ]);
});

test("transfer multiple assets for auction", async () => {
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776", "1099511627777", "1099511627778"],
                end_time: 946685400,
                assets_transferred: false,
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

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        asset_ids: ["1099511627778", "1099511627776", "1099511627777"],
        memo: "auction"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toEqual([
        {
            auction_id: "1",
            seller: user1.accountName,
            asset_ids: ["1099511627776", "1099511627777", "1099511627778"],
            end_time: 946685400,
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
    ]);
});

test("transfer assets for an auction for which an equal auction by another seller exists", async () => {
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user2.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: false,
                current_bid: "100.00000000 WAX",
                current_bidder: "",
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            },
            {
                auction_id: "2",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: false,
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

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        asset_ids: ["1099511627776"],
        memo: "auction"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toEqual([
        {
            auction_id: "1",
            seller: user2.accountName,
            asset_ids: ["1099511627776"],
            end_time: 946685400,
            assets_transferred: false,
            current_bid: "100.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        },
        {
            auction_id: "2",
            seller: user1.accountName,
            asset_ids: ["1099511627776"],
            end_time: 946685400,
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
    ]);
});

test("transfer asset when other unrelated auction exist", async () => {
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
        ],
        "user2": [
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user2.accountName,
                asset_ids: ["1099511627777"],
                end_time: 946685400,
                assets_transferred: false,
                current_bid: "100.00000000 WAX",
                current_bidder: "",
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            },
            {
                auction_id: "2",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: false,
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

    await atomicassets.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        asset_ids: ["1099511627776"],
        memo: "auction"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toEqual([
        {
            auction_id: "1",
            seller: user2.accountName,
            asset_ids: ["1099511627777"],
            end_time: 946685400,
            assets_transferred: false,
            current_bid: "100.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcollect1",
            collection_fee: 0.05
        },
        {
            auction_id: "2",
            seller: user1.accountName,
            asset_ids: ["1099511627776"],
            end_time: 946685400,
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
    ]);
});

test("throw when no auction was announced", async () => {
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        asset_ids: ["1099511627776"],
        memo: "auction"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No announced, non-finished auction by the sender for these assets exists");
});

test("throw when only announced auction is from a different seller", async () => {
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user2.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: false,
                current_bid: "100.00000000 WAX",
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        asset_ids: ["1099511627776"],
        memo: "auction"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("No announced, non-finished auction by the sender for these assets exists");
});

test("throw when memo is invalid", async () => {
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

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: false,
                current_bid: "100.00000000 WAX",
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

    await expect(atomicassets.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        asset_ids: ["1099511627776"],
        memo: "wrong memo!"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Invalid memo");
});

test("throw on notifications from fake atomicassets contract", async () => {
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
                    {"contract": "eosio.token", "sym": "8,WAX"}
                ]
            }
        ]
    });

    await atomicfake.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "testcollect1",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicfake.loadFixtures("schemas", {
        "testcollect1": [{
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
            collection_name: "testcollect1",
            schema_name: "testschema",
            template_id: -1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: false,
                current_bid: "100.00000000 WAX",
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

    await expect(atomicfake.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        asset_ids: ["1099511627776"],
        memo: "auction"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("@apply_context.cpp");
});