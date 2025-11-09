import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  repoId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    repoId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ProjectSchema.index({ userId: 1, repoId: 1 }, { unique: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

