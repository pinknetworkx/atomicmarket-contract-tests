const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);

const eosio_token = blockchain.createAccount('eosio.token');
const karma_token = blockchain.createAccount('karmatoken');

const user1 = blockchain.createAccount(`user1`);

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

    eosio_token.setContract(blockchain.contractTemplates['eosio.token']);
    karma_token.setContract(blockchain.contractTemplates['eosio.token']);
});

beforeEach(async () => {
    await atomicmarket.resetTables();
    await eosio_token.resetTables();
    await karma_token.resetTables();
});

test("send first deposit without balance table", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
            balance: "100.00000000 WAX"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            maximum_auction_duration: 2592000,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"}
            ],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["10.00000000 WAX"]
    }]);
});

test("send first deposit of second token", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
            balance: "100.00000000 WAX"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            maximum_auction_duration: 2592000,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"}
            ],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["25.0000 KARMA"]
        }]
    });

    await eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["25.0000 KARMA", "10.00000000 WAX"]
    }]);
});

test("send deposit when balance table already has a balance for that token", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
            balance: "100.00000000 WAX"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            maximum_auction_duration: 2592000,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"}
            ],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });
    await atomicmarket.loadFixtures("balances", {
        "atomicmarket": [{
            owner: user1.accountName,
            quantities: ["10.00000000 WAX"]
        }]
    });

    await eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["20.00000000 WAX"]
    }]);
});

test("send deposit from non eosio.token token contract", async () => {
    await karma_token.loadFixtures("stat", {
        "KARMA": [{
            supply: "100.0000 KARMA",
            max_supply: "1000.0000 KARMA",
            issuer: "eosio"
        }]
    });
    await karma_token.loadFixtures("accounts", {
        "user1": [{
            balance: "100.0000 KARMA"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            maximum_auction_duration: 2592000,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"}
            ],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await karma_token.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        quantity: "10.0000 KARMA",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["10.0000 KARMA"]
    }]);
});

test("throw when token is not supported (same symbol as supported token)", async () => {
    await karma_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await karma_token.loadFixtures("accounts", {
        "user1": [{
            balance: "100.00000000 WAX"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            maximum_auction_duration: 2592000,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"}
            ],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await expect(karma_token.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        quantity: "10.00000000 WAX",
        memo: "deposit"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The transferred token is not supported");
});

test("throw when memo is invalid", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "100.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "user1": [{
            balance: "100.00000000 WAX"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            maximum_auction_duration: 2592000,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"}
            ],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await expect(eosio_token.contract.transfer({
        from: user1.accountName,
        to: atomicmarket.accountName,
        quantity: "10.00000000 WAX",
        memo: "this memo is probably invalid"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("invalid memo");
});