const mongoose              = require('mongoose');
const loader                = require('../loaders/_common/fileLoader');
const config                = require('../config/index.config.js');

class Seeder {
    constructor() {
        this.seeds = loader('./scripts/**/*.seed.js');
    }

    async run() {
        try {
            // connect to mongo
           await this._connect();

            for (const seed in this.seeds) {
                const seedInstance = new this.seeds[seed];
                await seedInstance.run();
            }

            // disconnect from mongo
            await this._disconnect();

            process.exit(0);
        } catch (error) {
            console.error("Error seeding", error);
            process.exit(1);
        }

    }

    async _connect() {
        return config.dotEnv.MONGO_URI? require('../connect/mongo')({
            uri: config.dotEnv.MONGO_URI
        }) : null;
    }

    async _disconnect() {
        await mongoose.connection.close();
    }
}

const seeder = new Seeder();
seeder.run();