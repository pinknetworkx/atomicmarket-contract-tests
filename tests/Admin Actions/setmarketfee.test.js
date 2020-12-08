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
    await atomicmarket.loadFixtures();
});

test("set market fee", async () => {
    await atomicmarket.contract.setmarketfee({
        maker_market_fee: 0.05,
        taker_market_fee: 0.03
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
            {
                token_contract: "eosio.token",
                token_symbol: "8,WAX"
            },
            {
                token_contract: "karmatoken",
                token_symbol: "4,KARMA"
            }
        ],
        supported_symbol_pairs: [
            {
                delphi_pair_name: "waxpusd",
                invert_delphi_pair: false,
                listing_symbol: "2,USD",
                settlement_symbol: "8,WAX"
            }
        ],
        maker_market_fee: 0.05,
        taker_market_fee: 0.03,
        atomicassets_account: "atomicassets",
        delphioracle_account: "delphioracle"
    });
});

test("throw when maker fee is negative", async () => {
    await expect(atomicmarket.contract.setmarketfee({
        maker_market_fee: -0.05,
        taker_market_fee: 0.03
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("Market fees need to be at least 0");
});

test("throw when taker fee is negative", async () => {
    await expect(atomicmarket.contract.setmarketfee({
        maker_market_fee: 0.05,
        taker_market_fee: -0.03
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("Market fees need to be at least 0");
});

test("throw without authorization", async () => {
    await expect(atomicmarket.contract.setmarketfee({
        maker_market_fee: 0.05,
        taker_market_fee: 0.03
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});