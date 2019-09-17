import faker from "faker";
import { rankingModeCodes } from "../../core/constants";
import User from "../../models/User";

async function generateUsername() {
    let username = null;
    do {
        username = faker.internet.userName();
    } while (await User.exists({ username }));
    return username;
}

export default async function() {
    const scores = {};
    const scoreCodesOrder = [
        rankingModeCodes.DAILY,
        rankingModeCodes.WEEKLY,
        rankingModeCodes.MONTHLY,
        rankingModeCodes.ALWAYS,
    ];
    const scoreCodesInterval = [1, 7, 30, 360];
    let prevMode = null;
    scoreCodesOrder.forEach((mode, index) => {
        scores[mode] = {
            score: faker.random.number({
                max: 9999,
                min: prevMode ? scores[prevMode].score : 0,
            }),
            updated_at: prevMode
                ? faker.date.between(
                      faker.date.recent(scoreCodesInterval[index]),
                      scores[prevMode].updated_at,
                  )
                : faker.date.recent(scoreCodesInterval[index]),
        };
        prevMode = mode;
    });
    const user = await User.create({
        scores,
        username: await generateUsername(),
    });

    return user;
}
