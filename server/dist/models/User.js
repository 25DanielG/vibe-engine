import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    githubUsername: {
        type: String,
        default: null,
    },
    githubId: {
        type: String,
        default: null,
    },
    githubToken: {
        type: String,
        default: null,
    },
    featureMap: {
        type: String,
        default: ""
    },
}, {
    timestamps: true,
});
export const User = mongoose.model('User', UserSchema);
