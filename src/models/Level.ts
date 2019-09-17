import { model, models, Schema } from "mongoose";
import Review from "./Review";

if (!models.Level) {
    const schema = new Schema(
        {
            created_by: { type: Schema.Types.ObjectId, ref: "User" },
            data: { type: String, required: true },
            reviews: { type: [Review.schema] },
            times_played: { type: Number, required: true, default: 0 },
            title: { type: String, required: true, index: "text" },
        },
        {
            collation: { locale: "en_US", strength: 1 },
            timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        },
    );
    schema.index({ title: "text" }, { sparse: true });

    model("Level", schema);
}

export default model("Level");
