import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  githubUsername?: string;
  githubToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    githubUsername: {
      type: String,
      default: null,
    },
    githubToken: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

