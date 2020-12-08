const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);

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
});

beforeEach(async () => {
    atomicmarket.resetTables();
});

test("add first token", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await atomicmarket.contract.addconftoken({
        token_contract: "eosio.token",
        token_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
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
    });
});

test("add second token of same contract", async () => {
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

    await atomicmarket.contract.addconftoken({
        token_contract: "eosio.token",
        token_symbol: "0,SYS"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
        version: "0.0.0",
        sale_counter: "0",
        auction_counter: "0",
        minimum_bid_increase: 0.1,
        minimum_auction_duration: 120,
        maximum_auction_duration: 2592000,
        auction_reset_duration: 120,
        supported_tokens: [
            {token_contract: "eosio.token", token_symbol: "8,WAX"},
            {token_contract: "eosio.token", token_symbol: "0,SYS"}
        ],
        supported_symbol_pairs: [],
        maker_market_fee: 0.01,
        taker_market_fee: 0.01,
        atomicassets_account: "atomicassets",
        delphioracle_account: "delphioracle"
    });
});

test("add second token of different contract", async () => {
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

    await atomicmarket.contract.addconftoken({
        token_contract: "karmatoken",
        token_symbol: "4,KARMA"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
        version: "0.0.0",
        sale_counter: "0",
        auction_counter: "0",
        minimum_bid_increase: 0.1,
        minimum_auction_duration: 120,
        maximum_auction_duration: 2592000,
        auction_reset_duration: 120,
        supported_tokens: [
            {token_contract: "eosio.token", token_symbol: "8,WAX"},
            {token_contract: "karmatoken", token_symbol: "4,KARMA"}
        ],
        supported_symbol_pairs: [],
        maker_market_fee: 0.01,
        taker_market_fee: 0.01,
        atomicassets_account: "atomicassets",
        delphioracle_account: "delphioracle"
    });
});

test("throw when adding token with existing symbol", async () => {
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

    await expect(atomicmarket.contract.addconftoken({
        token_contract: "fakewax",
        token_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("A token with this symbol is already supported");
});

test("throw without authorization", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "0",
            auction_counter: "0",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [],
            supported_symbol_pairs: [],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });
    await expect(atomicmarket.contract.addconftoken({
        token_contract: "eosio.token",
        token_symbol: "8,WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});