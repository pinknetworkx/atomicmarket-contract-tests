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

test("initialize config table", async () => {
    expect.assertions(2);

    await atomicmarket.contract.init({}, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
        version: "1.2.1",
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
    });

    const marketplaces = atomicmarket.getTableRowsScoped("marketplaces")["atomicmarket"];
    expect(marketplaces).toEqual([{
        marketplace_name: "",
        creator: "fees.atomic"
    }]);
});

test("change nothing when config already exists", async () => {
    expect.assertions(2);
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [
            {
                version: "0.0.0",
                sale_counter: "50",
                auction_counter: "35",
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
            }
        ]
    });

    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [{
            marketplace_name: "",
            creator: "fees.atomic"
        }]
    })

    await atomicmarket.contract.init({}, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
        version: "0.0.0",
        sale_counter: "50",
        auction_counter: "35",
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
    });

    const marketplaces = atomicmarket.getTableRowsScoped("marketplaces")["atomicmarket"];
    expect(marketplaces).toEqual([{
        marketplace_name: "",
        creator: "fees.atomic"
    }]);
});

test("throw without authorization", async () => {
    await expect(atomicmarket.contract.init({}, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});