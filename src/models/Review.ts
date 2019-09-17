import { model, models, Schema } from "mongoose";

if (!models.Review) {
    const schema = new Schema(
        {
            score: {
                max: 5,
                min: 1,
                required: true,
                type: Number,
            },
            user: { type: Schema.Types.ObjectId, ref: "User", required: true },
        },
        { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
    );

    schema.index({ event: 1 });

    model("Review", schema);
}

export default model("Review");
