const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);
const delphioracle = blockchain.createAccount(`delphioracle`);

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

    delphioracle.setContract(blockchain.contractTemplates[`delphioracle`]);
    delphioracle.updateAuth(`active`, `owner`, {
        accounts: [
            {
                permission: {
                    actor: delphioracle.accountName,
                    permission: `eosio.code`
                },
                weight: 1
            }
        ]
    });
});

beforeEach(async () => {
    atomicmarket.resetTables();
    delphioracle.resetTables();
});

test("add first delphi", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await atomicmarket.contract.adddelphi({
        delphi_pair_name: "waxpusd",
        invert_delphi_pair: false,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
        version: "0.0.0",
        sale_counter: "1",
        auction_counter: "1",
        minimum_bid_increase: 0.1,
        minimum_auction_duration: 120,
        maximum_auction_duration: 2592000,
        auction_reset_duration: 120,
        supported_tokens: [
            {token_contract: "eosio.token", token_symbol: "8,WAX"}
        ],
        supported_symbol_pairs: [
            {
                delphi_pair_name: "waxpusd",
                invert_delphi_pair: false,
                listing_symbol: "2,USD",
                settlement_symbol: "8,WAX"
            }
        ],
        maker_market_fee: 0.01,
        taker_market_fee: 0.01,
        atomicassets_account: "atomicassets",
        delphioracle_account: "delphioracle"
    });
});

test("add second delphi", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"}
            ],
            supported_symbol_pairs: [
                {
                    delphi_pair_name: "waxpusd",
                    invert_delphi_pair: false,
                    listing_symbol: "2,USD",
                    settlement_symbol: "8,WAX"
                }
            ],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            },
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpbtc",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "8,BTC",
                quote_type: 2,
                quote_contract: "",
                quoted_precision: 8
            }
        ]
    });

    await atomicmarket.contract.adddelphi({
        delphi_pair_name: "waxpbtc",
        invert_delphi_pair: false,
        listing_symbol: "8,BTC",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
        version: "0.0.0",
        sale_counter: "1",
        auction_counter: "1",
        minimum_bid_increase: 0.1,
        minimum_auction_duration: 120,
        maximum_auction_duration: 2592000,
        auction_reset_duration: 120,
        supported_tokens: [
            {token_contract: "eosio.token", token_symbol: "8,WAX"}
        ],
        supported_symbol_pairs: [
            {
                delphi_pair_name: "waxpusd",
                invert_delphi_pair: false,
                listing_symbol: "2,USD",
                settlement_symbol: "8,WAX"
            },
            {
                delphi_pair_name: "waxpbtc",
                invert_delphi_pair: false,
                listing_symbol: "8,BTC",
                settlement_symbol: "8,WAX"
            }
        ],
        maker_market_fee: 0.01,
        taker_market_fee: 0.01,
        atomicassets_account: "atomicassets",
        delphioracle_account: "delphioracle"
    });
});

test("add second delphi with same delphi pair", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"}
            ],
            supported_symbol_pairs: [
                {
                    delphi_pair_name: "waxpusd",
                    invert_delphi_pair: false,
                    listing_symbol: "2,USD",
                    settlement_symbol: "8,WAX"
                }
            ],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await atomicmarket.contract.adddelphi({
        delphi_pair_name: "waxpusd",
        invert_delphi_pair: false,
        listing_symbol: "2,USDT",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
        version: "0.0.0",
        sale_counter: "1",
        auction_counter: "1",
        minimum_bid_increase: 0.1,
        minimum_auction_duration: 120,
        maximum_auction_duration: 2592000,
        auction_reset_duration: 120,
        supported_tokens: [
            {token_contract: "eosio.token", token_symbol: "8,WAX"}
        ],
        supported_symbol_pairs: [
            {
                delphi_pair_name: "waxpusd",
                invert_delphi_pair: false,
                listing_symbol: "2,USD",
                settlement_symbol: "8,WAX"
            },
            {
                delphi_pair_name: "waxpusd",
                invert_delphi_pair: false,
                listing_symbol: "2,USDT",
                settlement_symbol: "8,WAX"
            }
        ],
        maker_market_fee: 0.01,
        taker_market_fee: 0.01,
        atomicassets_account: "atomicassets",
        delphioracle_account: "delphioracle"
    });
});

test("add inverted delphi", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "usdwaxp",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "2,USD",
                base_type: 4,
                base_contract: "",
                quote_symbol: "8,WAXP",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await atomicmarket.contract.adddelphi({
        delphi_pair_name: "usdwaxp",
        invert_delphi_pair: true,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }]);

    const config_row = atomicmarket.getTableRowsScoped("config")["atomicmarket"][0];
    expect(config_row).toEqual({
        version: "0.0.0",
        sale_counter: "1",
        auction_counter: "1",
        minimum_bid_increase: 0.1,
        minimum_auction_duration: 120,
        maximum_auction_duration: 2592000,
        auction_reset_duration: 120,
        supported_tokens: [
            {token_contract: "eosio.token", token_symbol: "8,WAX"}
        ],
        supported_symbol_pairs: [
            {
                delphi_pair_name: "usdwaxp",
                invert_delphi_pair: true,
                listing_symbol: "2,USD",
                settlement_symbol: "8,WAX"
            }
        ],
        maker_market_fee: 0.01,
        taker_market_fee: 0.01,
        atomicassets_account: "atomicassets",
        delphioracle_account: "delphioracle"
    });
});

test("throw when listing and settlement symbol are the same", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "waxpusd",
        invert_delphi_pair: true,
        listing_symbol: "8,WAX",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("Listing symbol and settlement symbol must be different");
});

test("throw when delphipair name does not exist in delphioracle contract", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "nopair",
        invert_delphi_pair: true,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("The provided delphi_pair_name does not exist in the delphi oracle contract");
});

test("throw when listing - settlement combination already exists", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
            minimum_bid_increase: 0.1,
            minimum_auction_duration: 120,
            maximum_auction_duration: 2592000,
            auction_reset_duration: 120,
            supported_tokens: [
                {token_contract: "eosio.token", token_symbol: "8,WAX"}
            ],
            supported_symbol_pairs: [
                {
                    delphi_pair_name: "waxpusd",
                    invert_delphi_pair: true,
                    listing_symbol: "2,USD",
                    settlement_symbol: "8,WAX"
                }
            ],
            maker_market_fee: 0.01,
            taker_market_fee: 0.01,
            atomicassets_account: "atomicassets",
            delphioracle_account: "delphioracle"
        }]
    });

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            },
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd2",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "waxpusd2",
        invert_delphi_pair: false,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("There already exists a symbol pair with the specified listing - settlement symbol combination");
});

test("throw when settlement symbol is not supported", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "karmausd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "4,KARMA",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "karmausd",
        invert_delphi_pair: false,
        listing_symbol: "2,USD",
        settlement_symbol: "4,KARMA"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("The settlement symbol does not belong to a supported token");
});

test("throw when not inverted and listing precision is not delphi quote precision", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "20,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "waxpusd",
        invert_delphi_pair: false,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("The listing symbol precision needs to be equal to the delphi quote smybol precision for non inverted pairs");
});

test("throw when not inverted and settlement precision is not delphi base precision", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "20,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "waxpusd",
        invert_delphi_pair: false,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("The settlement symbol precision needs to be equal to the delphi base smybol precision for non inverted pairs");
});

test("throw when inverted and listing precision is not delphi base precision", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "usdwaxp",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "20,USD",
                base_type: 4,
                base_contract: "",
                quote_symbol: "8,WAXP",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "usdwaxp",
        invert_delphi_pair: true,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("The listing symbol precision needs to be equal to the delphi base smybol precision for inverted pairs");
});

test("throw when inverted and settlement precision is not delphi quote precision", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "usdwaxp",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "2,USD",
                base_type: 4,
                base_contract: "",
                quote_symbol: "20,WAXP",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "usdwaxp",
        invert_delphi_pair: true,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: atomicmarket.accountName,
        permission: "active"
    }])).rejects.toThrow("The settlement symbol precision needs to be equal to the delphi quote smybol precision for inverted pairs");
});

test("throw without authorization", async () => {
    await atomicmarket.loadFixtures("config", {
        "atomicmarket": [{
            version: "0.0.0",
            sale_counter: "1",
            auction_counter: "1",
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

    await delphioracle.loadFixtures("pairs", {
        "delphioracle": [
            {
                active: true,
                bounty_awarded: true,
                bounty_edited_by_custodians: false,
                proposer: "nate",
                name: "waxpusd",
                bounty_amount: "0.00000000 WAX",
                approving_custodians: ["alohaeosprod"],
                approving_oracles: [],
                base_symbol: "8,WAXP",
                base_type: 4,
                base_contract: "",
                quote_symbol: "2,USD",
                quote_type: 1,
                quote_contract: "",
                quoted_precision: 4
            }
        ]
    });

    await expect(atomicmarket.contract.adddelphi({
        delphi_pair_name: "waxpusd",
        invert_delphi_pair: true,
        listing_symbol: "2,USD",
        settlement_symbol: "8,WAX"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});