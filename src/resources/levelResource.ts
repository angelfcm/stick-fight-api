import Level from "../models/Level";

export default async function levelResource(level: any) {
    const project = "created_by" + (level.stars === undefined ? " reviews" : "");
    const levelExtras = (await Level.findOne({ _id: level._id || level.id })
        .select(project)
        .populate("created_by")) as any;
    const createdBy =
        typeof levelExtras.created_by === "string"
            ? levelExtras.created_by
            : (levelExtras || {}).created_by.username;
    if (level.stars === undefined) {
        const reviews = levelExtras.reviews;
        let scoreSum = 0;
        reviews.forEach((r: any) => {
            scoreSum += r.score;
        });
        level.stars = scoreSum > 0 ? scoreSum / reviews.length : 0;
    }
    return {
        created_at: level.created_at,
        created_by: createdBy,
        data: level.data ? JSON.parse(level.data) : level.data,
        id: level._id,
        stars: level.stars,
        times_played: level.times_played,
        title: level.title,
        updated_at: level.updated_at,
    };
}
