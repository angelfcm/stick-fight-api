import faker from "faker";
import { Document, Schema, Types } from "mongoose";
import Level from "../../models/Level";
import UserFactory from "./UserFactory";

async function generateLevelTitle() {
    let title = null;
    do {
        title = faker.lorem.words(3);
    } while (await Level.exists({ title }));
    return title;
}

export default async function(user?: Document | Types.ObjectId, reviews: Document[] = []) {
    faker.locale = "es";
    const userFixed = user || (await UserFactory());
    return await Level.create({
        created_by: userFixed,
        data: JSON.stringify({ terrain: [], enemies: [], objects: [] }),
        reviews,
        times_played: faker.random.number({ min: 0, max: 100 }),
        title: await generateLevelTitle(),
    });
}
