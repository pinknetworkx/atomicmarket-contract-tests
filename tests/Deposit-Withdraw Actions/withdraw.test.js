const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);

const eosio_token = blockchain.createAccount('eosio.token');
const karma_token = blockchain.createAccount('karmatoken');

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

    eosio_token.setContract(blockchain.contractTemplates['eosio.token']);
    karma_token.setContract(blockchain.contractTemplates['eosio.token']);
});

beforeEach(async () => {
    await atomicmarket.resetTables();
    await eosio_token.resetTables();
    await karma_token.resetTables();
});

test("withdraw all of the only deposited token", async () => {
    expect.assertions(2);

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

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
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
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toBeUndefined();

    const user1_tokens = eosio_token.getTableRowsScoped("accounts")["user1"];
    expect(user1_tokens).toEqual([
        {
            balance: "100.00000000 WAX"
        }
    ]);
});

test("withdraw a part of the only deposited token", async () => {
    expect.assertions(2);

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

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
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
            quantities: ["100.00000000 WAX"]
        }]
    });

    await atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "30.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["70.00000000 WAX"]
    }]);

    const user1_tokens = eosio_token.getTableRowsScoped("accounts")["user1"];
    expect(user1_tokens).toEqual([
        {
            balance: "30.00000000 WAX"
        }
    ]);
});

test("withdraw all of one of multiple deposited token", async () => {
    expect.assertions(2);

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

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"},
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
            quantities: ["100.00000000 WAX", "50.0000 KARMA"]
        }]
    });

    await atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toEqual([{
        owner: user1.accountName,
        quantities: ["50.0000 KARMA"]
    }]);

    const user1_tokens = eosio_token.getTableRowsScoped("accounts")["user1"];
    expect(user1_tokens).toEqual([
        {
            balance: "100.00000000 WAX"
        }
    ]);
});

test("withdraw all of a non eosio.token token", async () => {
    expect.assertions(2);

    await karma_token.loadFixtures("stat", {
        "KARMA": [{
            supply: "50.0000 KARMA",
            max_supply: "1000.0000 KARMA",
            issuer: "eosio"
        }]
    });
    await karma_token.loadFixtures("accounts", {
        "atomicmarket": [{
            balance: "50.0000 KARMA"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"},
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
            quantities: ["50.0000 KARMA"]
        }]
    });

    await atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "50.0000 KARMA"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const balances = atomicmarket.getTableRowsScoped("balances")["atomicmarket"];
    expect(balances).toBeUndefined();

    const user1_tokens = karma_token.getTableRowsScoped("accounts")["user1"];
    expect(user1_tokens).toEqual([
        {
            balance: "50.0000 KARMA"
        }
    ]);
});

test("throw when withdrawer does not have a balance row", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"},
            ],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await expect(atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance table row");
});

test("throw when withdrawer does not have a balance for the token to withdraw", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"},
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
            quantities: ["50.0000 KARMA"]
        }]
    });

    await expect(atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account does not have a balance for the symbol specified in the quantity");
});

test("throw when withdrawer has tokens, but less than the withdrawal", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"},
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
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The specified account's balance is lower than the specified quantity");
});

test("throw when the withdrawal amount is negative", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "50.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "atomicmarket": [{
            balance: "50.00000000 WAX"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"},
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
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "-100.00000000 WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("The quantity to withdraw must be positive");
});

test("throw without authorization from owner", async () => {
    await eosio_token.loadFixtures("stat", {
        "WAX": [{
            supply: "50.00000000 WAX",
            max_supply: "1000.00000000 WAX",
            issuer: "eosio"
        }]
    });
    await eosio_token.loadFixtures("accounts", {
        "atomicmarket": [{
            balance: "50.00000000 WAX"
        }]
    });

    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"},
                {token_contract: "karmatoken", token_symbol: "4,KARMA"},
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
            quantities: ["50.00000000 WAX"]
        }]
    });

    await expect(atomicmarket.contract.withdraw({
        owner: user1.accountName,
        token_to_withdraw: "50.00000000 WAX"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});