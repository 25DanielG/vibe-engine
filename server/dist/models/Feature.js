import mongoose, { Schema } from 'mongoose';
const FeatureSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    featureName: {
        type: String,
        required: true,
    },
    userSummary: {
        type: String,
        required: true,
    },
    aiSummary: {
        type: String,
        required: true,
    },
    filenames: {
        type: [String],
        default: [],
    },
    neighbors: {
        type: [Schema.Types.ObjectId],
        ref: 'Feature',
        default: [],
    },
}, {
    timestamps: true,
});
export const Feature = mongoose.model('Feature', FeatureSchema);
