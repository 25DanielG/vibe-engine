import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  password: string;
  githubToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
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

UserSchema.index({ email: 1 });

export const User = mongoose.model<IUser>('User', UserSchema);

