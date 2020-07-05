const {loadConfig, Blockchain} = require("@klevoya/hydra");

const config = loadConfig("hydra.yml");

const blockchain = new Blockchain(config);
const atomicmarket = blockchain.createAccount(`atomicmarket`);

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
});

beforeEach(async () => {
    atomicmarket.resetTables();
    await atomicmarket.loadFixtures();
});

test("register market", async () => {
    await atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: "mymarket1111"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const marketplaces = atomicmarket.getTableRowsScoped("marketplaces")["atomicmarket"];
    expect(marketplaces).toEqual([
        {
            marketplace_name: "",
            creator: "fees.atomic"
        },
        {
            marketplace_name: "mymarket1111",
            creator: user1.accountName
        }
    ]);
});

test("register second market of same creator", async () => {
    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [{
            marketplace_name: "mymarket1111",
            creator: user1.accountName
        }]
    });

    await atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: "mymarket2222"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const marketplaces = atomicmarket.getTableRowsScoped("marketplaces")["atomicmarket"];
    expect(marketplaces).toEqual([
        {
            marketplace_name: "",
            creator: "fees.atomic"
        },
        {
            marketplace_name: "mymarket1111",
            creator: user1.accountName
        },
        {
            marketplace_name: "mymarket2222",
            creator: user1.accountName
        }
    ]);
});

test("register market with name equal to creator name", async () => {
    await atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: user1.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const marketplaces = atomicmarket.getTableRowsScoped("marketplaces")["atomicmarket"];
    expect(marketplaces).toEqual([
        {
            marketplace_name: "",
            creator: "fees.atomic"
        },
        {
            marketplace_name: user1.accountName,
            creator: user1.accountName
        }
    ]);
});

test("throw when market name is equal to another existing account", async () => {
    await expect(atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: user2.accountName
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("When the marketplace has the name of an existing account, its authorization is required");
});

test("throw when market with this name already exists", async () => {
    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [{
            marketplace_name: "mymarket1111",
            creator: user1.accountName
        }]
    });

    await expect(atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: "mymarket1111"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("A marketplace with this name already exists");
});

test("throw without authorization", async () => {
    await expect(atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: "mymarket1111"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});