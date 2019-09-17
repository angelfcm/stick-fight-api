import validator from "validator";
import app, { IAppContext } from "../../core/app";
import { paginationSizes, rankingModeCodes, winnerCredits } from "../../core/constants";
import ResponseBuilder from "../../core/ResponseBuilder";
import Level from "../../models/Level";
import Review from "../../models/Review";
import User from "../../models/User";
import levelResource from "../../resources/levelResource";

function validateRankingMode(
    __: (text: string, ...params: string[]) => string,
    response: ResponseBuilder,
    mode: string,
) {
    if (!Object.values(rankingModeCodes).includes(mode)) {
        if (response) {
            response.error(
                "ranking",
                __(
                    "% must be within: %.",
                    __("Ranking mode"),
                    Object.values(rankingModeCodes).join(", "),
                ),
            );
        }
        return false;
    }
    return true;
}

export const createLevel = app(async (appContext: IAppContext) => {
    const { __, response, fields } = appContext;
    const { title, created_by, data: levelData } = fields;
    if (!title) {
        response.error("title", __("% is required.", __("Title")));
    } else if (await Level.exists({ title })) {
        response.error("title", __("% already exists with given %.", __("Level"), __("title")));
    }
    if (!levelData) {
        response.error("data", __("% are required.", __("Data")));
    }
    if (!created_by) {
        response.error("created_by", __("% is required.", __("created_by")));
    }
    if (response.hasError()) {
        return response.statusCode(422);
    }
    let user = await User.findOne({ username: created_by });
    if (!user) {
        user = await User.create({ username: created_by });
    }
    const level = await Level.create({
        created_by: user,
        data: levelData,
        title,
    });
    const data = await levelResource(level);
    return response.data(data).statusCode(201);
});

export const showLevel = app(async (appContext: IAppContext) => {
    const { __, response, pathParameters } = appContext;
    const { id: levelId } = pathParameters;
    if (!validator.isMongoId(levelId) || !(await Level.exists({ _id: levelId }))) {
        response.error("id", __("% was not found.", __("Level")));
    }
    if (response.hasError()) {
        return response.statusCode(404);
    }
    const level = await Level.findOne({ _id: levelId });
    const data = await levelResource(level);
    return response.data(data).statusCode(200);
});

export const updateLevel = app(async (appContext: IAppContext) => {
    const { __, response, fields, pathParameters } = appContext;
    const { title, data: levelData } = fields;
    const { id: levelId } = pathParameters;
    const level = validator.isMongoId(levelId)
        ? ((await Level.findById(levelId)) as any)
        : undefined;
    if (!level) {
        return response.error("id", __("% was not found.", __("Level"))).statusCode(404);
    }
    if (title !== undefined) {
        const existingLevel = await Level.findOne({ title }).select("title");
        if (existingLevel && existingLevel._id.toString() !== level._id.toString()) {
            response.error("title", __("% already exists with given %.", __("Level"), __("title")));
        }
    }
    if (levelData !== undefined && !levelData) {
        response.error("data", __("% are required.", __("Data")));
    }
    if (response.hasError()) {
        return response.statusCode(422);
    }
    if (title !== undefined) {
        level.title = title;
    }
    if (levelData !== undefined) {
        level.data = levelData;
    }
    await level.save();
    const data = await levelResource(level);
    return response.data(data).statusCode(200);
});

export const setMeLevelStars = app(async (appContext: IAppContext) => {
    const { __, response, fields, pathParameters } = appContext;
    const { username, stars } = fields;
    const { id: levelId } = pathParameters;
    const level = validator.isMongoId(levelId)
        ? ((await Level.findById(levelId)) as any)
        : undefined;
    if (!level) {
        return response.error("id", __("% was not found.", __("Level"))).statusCode(404);
    }
    if (!validator.isInt(stars.toString())) {
        response.error("stars", __("% must be an integer.", __("Stars")));
    } else if (stars < 1 || stars > 5) {
        response.error("stars", __("% must be between % and %.", __("Stars"), "1", "5"));
    }
    if (response.hasError()) {
        return response.statusCode(422);
    }
    let user = await User.findOne({ username });
    if (!user) {
        user = await User.create({ username });
    }
    let review = level.reviews.find((r: any) => r.user.equals(user._id));
    if (review) {
        review.score = stars;
        review.updated_at = Date.now();
        await Level.updateOne(
            { _id: level._id, "reviews._id": review._id },
            {
                $set: {
                    "reviews.$.score": stars,
                },
            },
        ).exec();
    } else {
        review = new Review({
            created_at: Date.now(),
            score: stars,
            updated_at: Date.now(),
            user,
        });
        level.reviews.push(review);
        await level.save();
    }
    return response
        .data({
            created_at: review.created_at,
            stars: review.score,
            updated_at: review.updated_at,
        })
        .statusCode(200);
});

export const addLevelPlayed = app(async (appContext: IAppContext) => {
    const { __, response, pathParameters } = appContext;
    const { id: levelId } = pathParameters;
    const level = validator.isMongoId(levelId)
        ? ((await Level.findById(levelId).select("times_played")) as any)
        : undefined;
    if (!level) {
        return response.error("id", __("% was not found.", __("Level"))).statusCode(404);
    }
    if (response.hasError()) {
        return response.statusCode(422);
    }
    level.times_played += 1;
    await level.save();
    return response.data(__("Operation completed successfully.")).statusCode(200);
});

export const indexLevels = app(async ({ __, response, queryParameters, pathParameters }) => {
    const { page = 0, page_size: pageSize = paginationSizes.RANKING } = queryParameters;
    const { search_text: searchText } = pathParameters;

    if (page !== undefined && !validator.isInt(page.toString())) {
        response.error("page", __("% must be an integer.", __("Page")));
    }
    if (pageSize !== undefined && !validator.isInt(pageSize.toString())) {
        response.error("page_size", __("% must be an integer.", __("Page size")));
    }
    if (response.hasError()) {
        return response.statusCode(422);
    }

    const pageFixed = !page || page < 1 ? 1 : Number.parseInt(page, 10);
    const pageSizeFixed = pageSize < 1 ? paginationSizes.LEVELS : parseInt(pageSize, 10);
    const filter = {} as any;
    const sort = {} as any;
    if (searchText) {
        filter.$text = {
            $search: searchText,
        };
        sort.score = {
            $meta: "textScore",
        };
    }
    sort.created_at = -1;
    const query: any = [
        {
            $match: filter,
        },
        {
            $lookup: {
                as: "created_by",
                foreignField: "_id",
                from: User.collection.name,
                localField: "created_by",
            },
        },
        {
            $sort: sort,
        },
        { $unwind: "$created_by" },
        { $skip: pageSizeFixed * (pageFixed - 1) },
        { $limit: pageSizeFixed + 1 }, // + 1 to check if there are more results ;)
        {
            $project: {
                _id: 0,
                created_at: 1,
                created_by: "$created_by.username",
                id: "$_id",
                times_played: 1,
                title: 1,
                updated_at: 1,
            },
        },
    ] as any;

    const results = [];
    try {
        results.push(...(await Level.aggregate(query)));
    } catch (err) {
        // When levels collection is empty an exception occurs that it is going to ignore.
        if (err.message.indexOf("text index required for $text") === -1) {
            throw err;
        }
    }
    const hasMore = results.length > pageSizeFixed;
    if (hasMore) {
        results.splice(-1); // remove resource used to check more results ;)
    }
    const pagination = {
        has_more: hasMore,
        page: pageFixed,
        page_size: results.length,
    };
    const data = await Promise.all(results.map(r => levelResource(r)));
    const meta = pagination;

    return response
        .data(data)
        .meta(meta)
        .statusCode(200);
});
