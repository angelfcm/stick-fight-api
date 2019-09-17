/* tslint:disable no-console */
import mongoose from "mongoose";
import { getParameterValue, hasParameter, loadEnvOrFail } from "../../core/cli-utils";
import connect2DB from "../../core/db";
import seeders from "./map";

// Default seeding configuration.
const config = {
    refresh: false, // request seeders to refresh collections if true before start seeding.
    reset: false, // delete database before seeding.
    seeder: null, // if null then run all seeders, if set a seeder name then run just this seeder.
};

async function seed() {
    console.log("seed:start\n");
    // Delete database if reset is true.
    if (config.reset && !config.seeder) {
        await mongoose.connection.db.dropDatabase();
        console.log("database reset -> success\n");
    }
    // If config.seeder was set then select one seeder otherwise select all seeders.
    let seedersFixed = [];
    if (config.seeder) {
        const seederContainer = seeders.find(s => s[config.seeder] !== undefined);
        seedersFixed = [seederContainer];
    } else {
        seedersFixed = seeders;
    }
    // Run seeders in order were set.
    // eslint-disable-next-line no-restricted-syntax
    for (const seederContainer of seedersFixed) {
        const seederName = Object.keys(seederContainer)[0];
        const seeder = seederContainer[seederName];
        try {
            if (typeof seeder !== "function") {
                throw new TypeError("Seeder must be an async function.");
            }
            const promise = seeder(config.refresh);
            if (!(promise instanceof Promise)) {
                throw new TypeError("Seeder must return a Promise.");
            }
            // eslint-disable-next-line no-await-in-loop
            await promise;
            console.log(`${seederName} -> success`);
        } catch (err) {
            console.log(
                `${seederName} -> fail: ${err.stack ? `${err}, stack: ${err.stack}` : err}`,
            );
        }
    }
}

function run() {
    console.log("\n\n========= SEEDING PROGRAM =========");

    // Load env file
    loadEnvOrFail();

    // Read commands to set custom configuration.
    if (hasParameter("--seeder")) {
        const seederName = getParameterValue("--seeder");
        if (!seeders.find(s => s[seederName])) {
            throw new ReferenceError(`Seeder "${seederName}" does not exist.`);
        }
        config.seeder = seederName;
    }
    config.refresh = hasParameter("--refresh");
    config.reset = hasParameter("--reset");

    // Wait to connect to db before run seeders.
    connect2DB()
        .then(async () => {
            // Execute seeders
            seed()
                .catch(err => {
                    console.log(err);
                })
                .finally(() => {
                    console.log("\nseed:end\n");
                    process.exit();
                });
        })
        .catch(err => {
            console.log(`Connection error: ${err.message}`);
            process.exit();
        });
}

// Start seeding.
run();
