const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);

const user1 = blockchain.createAccount(`user1`);
const user2 = blockchain.createAccount(`user2`);
const user3 = blockchain.createAccount(`user3`);

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
});

beforeEach(async () => {
    atomicmarket.resetTables();
    await atomicmarket.loadFixtures();
});

test("make initial bid equal to minimum bid", async () => {
    expect.assertions(2);

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
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

    await atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "50.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
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
            current_bid: "50.00000000 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: false,
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
            owner: user2.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);
});

test("make initial bid higher than minimum bid", async () => {
    expect.assertions(2);

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
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

    await atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "70.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
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
            current_bid: "70.00000000 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: false,
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
            owner: user2.accountName,
            quantities: ["30.00000000 WAX"]
        }
    ]);
});

test("throw when initial bid is less than starting bid", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
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

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "10.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The bid must be at least as high as the minimum bid");
});

test("make initial bid with marketplace", async () => {
    expect.assertions(2);

    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [
            {
                marketplace_name: "mymarket1111",
                creator: "marketowner1"
            }
        ]
    });

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
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

    await atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "50.00000000 WAX",
        taker_marketplace: "mymarket1111"
    }, [{
        actor: user2.accountName,
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
            current_bid: "50.00000000 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "mymarket1111",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user2.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);
});

test("outbid someone by exactly 10%", async () => {
    expect.assertions(2);

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "55.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
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
            current_bid: "55.00000000 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: false,
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
            owner: user2.accountName,
            quantities: ["45.00000000 WAX"]
        },
        {
            owner: user3.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);
});

test("outbid someone by more than 10%", async () => {
    expect.assertions(2);

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "75.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
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
            current_bid: "75.00000000 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: false,
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
            owner: user2.accountName,
            quantities: ["25.00000000 WAX"]
        },
        {
            owner: user3.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);
});

test("throw when outbid is less than current bid", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "10.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The relative increase is less than the minimum bid increase specified in the config");
});

test("throw when outbid increase is less than the minimum specified in config", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "54.50000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The relative increase is less than the minimum bid increase specified in the config");
});

test("outbid someone with a marketplace", async () => {
    expect.assertions(2);

    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [
            {
                marketplace_name: "mymarket1111",
                creator: "marketowner1"
            }
        ]
    });

    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "75.00000000 WAX",
        taker_marketplace: "mymarket1111"
    }, [{
        actor: user2.accountName,
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
            current_bid: "75.00000000 WAX",
            current_bidder: user2.accountName,
            claimed_by_seller: false,
            claimed_by_buyer: false,
            maker_marketplace: "",
            taker_marketplace: "mymarket1111",
            collection_name: "testcollect1",
            collection_fee: 0.05
        }
    ]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([
        {
            owner: user2.accountName,
            quantities: ["25.00000000 WAX"]
        },
        {
            owner: user3.accountName,
            quantities: ["50.00000000 WAX"]
        }
    ]);
});

test("throw when auction with this id does not exist", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "75.00000000 WAX",
        taker_marketplace: "mymarket1111"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("No auction with this auction_id exists");
});

test("throw when trying to bid on own auction", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user1.accountName,
        auction_id: "1",
        bid: "75.00000000 WAX",
        taker_marketplace: "mymarket1111"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("You can't bid on your own auction");
});

test("throw the seller has not transferred the assets to the market yet", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
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
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "75.00000000 WAX",
        taker_marketplace: "mymarket1111"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The auction is not yet active.");
});

test("throw when the auction is already finished", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946684500,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "75.00000000 WAX",
        taker_marketplace: "mymarket1111"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The auction is already finished");
});

test("throw when the bid uses a different symbol than the auction", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.0000 KARMA"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "75.0000 KARMA",
        taker_marketplace: "mymarket1111"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The bid uses a different symbol than the current auction bid");
});

test("throw when the specified market does not exist", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "75.00000000 WAX",
        taker_marketplace: "noexist"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("The taker marketplace is not a valid marketplace");
});

test("throw without authorization from buyer", async () => {
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user2.accountName,
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.loadFixtures("auctions", {
        "atomicmarket": [
            {
                auction_id: "1",
                seller: user1.accountName,
                asset_ids: ["1099511627776"],
                end_time: 946685400,
                assets_transferred: true,
                current_bid: "50.00000000 WAX",
                current_bidder: user3.accountName,
                claimed_by_seller: false,
                claimed_by_buyer: false,
                maker_marketplace: "",
                taker_marketplace: "",
                collection_name: "testcollect1",
                collection_fee: 0.05
            }
        ]
    });

    await expect(atomicmarket.contract.auctionbid({
        bidder: user2.accountName,
        auction_id: "1",
        bid: "75.00000000 WAX",
        taker_marketplace: ""
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});