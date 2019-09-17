import faker from "faker";
import { Document, Types } from "mongoose";
import Review from "../../models/Review";
import LevelFactory from "./LevelFactory";
import UserFactory from "./UserFactory";

export default async function(level?: Document, user?: Document | Types.ObjectId) {
    const levelFixed = level || (await LevelFactory());
    const userFixed = user || (await UserFactory());
    const review = new Review({
        score: faker.random.number({ min: 1, max: 5 }),
        user: userFixed,
    });
    if (level) {
        await levelFixed
            .updateOne({
                $push: { reviews: review },
            })
            .exec();
    }
    return review;
}
