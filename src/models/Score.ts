import { model, models, Schema } from "mongoose";

if (!models.Score) {
    const schema = new Schema(
        {
            score: { type: Number, required: true, index: true, default: 0 },
            updated_at: { type: Date, required: true, default: Date.now() },
        },
        { timestamps: { updatedAt: "updated_at" }, _id: false, id: false },
    );

    model("Score", schema);
}

export default model("Score");
