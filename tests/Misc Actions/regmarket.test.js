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
        marketplace_name: "mymarket"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const marketplaces = atomicmarket.getTableRowsScoped("marketplaces")["atomicmarket"];
    expect(marketplaces).toEqual([
        {
            marketplace_name: "",
            creator: "pink.network"
        },
        {
            marketplace_name: "mymarket",
            creator: user1.accountName
        }
    ]);
});

test("register second market of same creator", async () => {
    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [{
            marketplace_name: "mymarket",
            creator: user1.accountName
        }]
    });

    await atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: "mymarket2"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }]);

    const marketplaces = atomicmarket.getTableRowsScoped("marketplaces")["atomicmarket"];
    expect(marketplaces).toEqual([
        {
            marketplace_name: "",
            creator: "pink.network"
        },
        {
            marketplace_name: "mymarket",
            creator: user1.accountName
        },
        {
            marketplace_name: "mymarket2",
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
            creator: "pink.network"
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
    }])).rejects.toThrow("Can't create a marketplace with a name of an existing account without its authorization");
});

test("throw when market with this name already exists", async () => {
    await atomicmarket.loadFixtures("marketplaces", {
        "atomicmarket": [{
            marketplace_name: "mymarket",
            creator: user1.accountName
        }]
    });

    await expect(atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: "mymarket"
    }, [{
        actor: user1.accountName,
        permission: "active"
    }])).rejects.toThrow("A marketplace with this name already exists");
});

test("throw without authorization", async () => {
    await expect(atomicmarket.contract.regmarket({
        creator: user1.accountName,
        marketplace_name: "mymarket"
    }, [{
        actor: user2.accountName,
        permission: "active"
    }])).rejects.toThrow("Missing required authority");
});