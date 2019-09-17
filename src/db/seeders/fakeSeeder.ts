import faker from "faker";
import LevelFactory from "../../test/factories/LevelFactory";
import ReviewFactory from "../../test/factories/ReviewFactory";
import UserFactory from "../../test/factories/UserFactory";

export default async () => {
    if (process.env.debug === "0") {
        return;
    }
    const users = [];
    const levels = [];
    const reviews = [];
    let promises = [];
    // Create users
    for (let i = 0; i < 50; i += 1) {
        promises.push(
            UserFactory().then(r => {
                users.push(r);
            }),
        );
    }
    await Promise.all(promises);
    promises = [];
    // Create levels
    for (let i = 0; i < 30; i += 1) {
        promises.push(
            LevelFactory(faker.random.arrayElement(users)).then(r => {
                levels.push(r);
            }),
        );
    }
    await Promise.all(promises);
    promises = [];
    // Create reviews
    for (let i = 0; i < 50; i += 1) {
        const user = faker.random.arrayElement(users);
        const level = faker.random.arrayElement(levels);
        promises.push(
            ReviewFactory(level, user).then(r => {
                reviews.push(r);
            }),
        );
    }
    await Promise.all(promises);
    promises = [];
};
