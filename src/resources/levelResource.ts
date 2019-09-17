import Level from "../models/Level";

export default async function levelResource(level: any) {
    const levelExtras = (await Level.findOne({ _id: level._id || level.id })
        .select("reviews created_by")
        .populate("created_by")) as any;
    const createdBy =
        typeof levelExtras.created_by === "string"
            ? levelExtras.created_by
            : (levelExtras || {}).created_by.username;
    const reviews = levelExtras.reviews;
    let scoreSum = 0;
    reviews.forEach((r: any) => {
        scoreSum += r.score;
    });
    const stars = scoreSum > 0 ? scoreSum / reviews.length : 0;
    return {
        created_at: level.created_at,
        created_by: createdBy,
        data: level.data,
        id: level._id,
        stars,
        times_played: level.times_played,
        title: level.title,
        updated_at: level.updated_at,
    };
}
