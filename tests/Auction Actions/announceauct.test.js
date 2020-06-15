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

test("announce auction of single asset", async () => {
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

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
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
            assets_transferred: false,
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("announce second auction", async () => {
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

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);
    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627777"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
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
            assets_transferred: false,
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        },
        {
            auction_id: "2",
            seller: user1.accountName,
            asset_ids: ["1099511627777"],
            end_time: 946685400,
            assets_transferred: false,
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("announce auction of multiple assets", async () => {
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

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776", "1099511627777", "1099511627778"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
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
            assets_transferred: false,
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("announce auction for a different token", async () => {
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

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "50.0000 KARMA",
        duration: 600,
        maker_marketplace: ""
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
            assets_transferred: false,
            current_bid: "50.0000 KARMA",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("announce auction with a marketplace", async () => {
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
    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [{
            marketplace_name: "mymarket",
            creator: user1.accountName
        }]
    });

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: "mymarket"
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
            assets_transferred: false,
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "mymarket",
            taker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("announce auction with a different collection fee", async () => {
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

    await atomicassets.contract.setmarketfee({
        collection_name: "testcol",
        market_fee: 0.0
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
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
            assets_transferred: false,
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.0
        }
    ]);
});

test("announce auction with an asset that has a template", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcol": [{
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
        "user1": [{
            asset_id: "1099511627776",
            collection_name: "testcol",
            schema_name: "testschema",
            template_id: 1,
            ram_payer: "eosio",
            backed_tokens: [],
            immutable_serialized_data: [],
            mutable_serialized_data: []
        }]
    });

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
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
            assets_transferred: false,
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("throw when asset_ids is empty", async () => {
    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: [],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("asset_ids needs to contain at least one id");
});

test("throw when seller does not own one of the assets", async () => {
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
    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776", "1099511627777"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You do not own at least one of the assets");
});

test("throw when one of the assets is not transferable", async () => {
    await atomicassets.loadFixtures("templates", {
        "testcol": [{
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
        "user1": [
            {
                asset_id: "1099511627776",
                collection_name: "testcol",
                schema_name: "testschema",
                template_id: 1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("At least one of the assets is not transferable");
});

test("throw when there are assets of different collections", async () => {
    await atomicassets.loadFixtures("collections", {
        "atomicassets": [{
            collection_name: "secondcol",
            author: user1.accountName,
            allow_notify: true,
            authorized_accounts: [],
            notify_accounts: [],
            market_fee: 0.05,
            serialized_data: []
        }]
    });
    await atomicassets.loadFixtures("schemas", {
        "secondcol": [{
            schema_name: "testschema",
            format: [
                {name: "name", type: "string"},
                {name: "level", type: "uint32"},
                {name: "img", type: "ipfs"}
            ]
        }]
    });

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
                collection_name: "secondcol",
                schema_name: "testschema",
                template_id: -1,
                ram_payer: "eosio",
                backed_tokens: [],
                immutable_serialized_data: [],
                mutable_serialized_data: []
            }
        ]
    });

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776", "1099511627777", "1099511627778"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You can only list multiple assets from the same collection");
});

test("throw the seller already announced an auction for the single asset", async () => {
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
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You have already announced an auction for these assets");
});

test("throw the seller already announced an auction for the multiple assets", async () => {
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
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627778", "1099511627776", "1099511627777"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You have already announced an auction for these assets");
});

test("announce auction for asset that has already been announced as part of a bigger auction", async () => {
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

    atomicmarket.resetTables();
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [
            {
                version: "0.0.0",
                sale_counter: "1",
                auction_counter: "2",
                minimum_bid_increase: 0.1,
                maximum_auction_duration: 2592000,
                supported_tokens: [
                    {
                        token_contract: "eosio.token",
                        token_symbol: "8,WAX"
                    }
                ],
                supported_symbol_pairs: [],
                maker_market_fee: 0.01,
                taker_market_fee: 0.01,
                atomicassets_account: "atomicassets",
                delphioracle_account: "delphioracle"
            }
        ]
    });
    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [
            {
                marketplace_name: "",
                creator: "pink.network"
            }
        ]
    });
    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776", "1099511627777"],
                end_time: 946685400,
                assets_transferred: false,
                current_bid: "10.00000000 WAX",
                current_bidder: "",
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const auctions = atomicmarket.getTableRowsScoped("auctions")["atomicmarket"];
    expect(auctions).toEqual([
        {
            auction_id: "1",
            seller: user1.accountName,
            asset_ids: ["1099511627776", "1099511627777"],
            end_time: 946685400,
            assets_transferred: false,
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
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
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("announce auction that another account has announced before", async () => {
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

    atomicmarket.resetTables();
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [
            {
                version: "0.0.0",
                sale_counter: "1",
                auction_counter: "2",
                minimum_bid_increase: 0.1,
                maximum_auction_duration: 2592000,
                supported_tokens: [
                    {
                        token_contract: "eosio.token",
                        token_symbol: "8,WAX"
                    }
                ],
                supported_symbol_pairs: [],
                maker_market_fee: 0.01,
                taker_market_fee: 0.01,
                atomicassets_account: "atomicassets",
                delphioracle_account: "delphioracle"
            }
        ]
    });
    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [
            {
                marketplace_name: "",
                creator: "pink.network"
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
                current_bid: "10.00000000 WAX",
                current_bidder: "",
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcol",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
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
            current_bid: "10.00000000 WAX",
            current_bidder: "",
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "",
            collection_name: "testcol",
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
            collection_name: "testcol",
            collection_fee: 0.05
        }
    ]);
});

test("throw when starting bid token is not supported", async () => {
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

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00 FAKE",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified starting bid token is not supported");
});

test("throw when the starting bid is 0", async () => {
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

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "0.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The starting bid must be greater than zero");
});

test("throw when the starting bid is negative", async () => {
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

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "-10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The starting bid must be greater than zero");
});

test("throw when the specified market does not exist", async () => {
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

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: "fakemarket"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The maker marketplace is not a valid marketplace");
});

test("throw without authorization from seller", async () => {
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

    await expect(atomicmarket.contract.announceauct({
        seller: user1.accountName,
        asset_ids: ["1099511627776"],
        starting_bid: "10.00000000 WAX",
        duration: 600,
        maker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});