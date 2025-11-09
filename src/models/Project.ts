import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  repoId: string; // GitHub repository ID (e.g., "owner/repo")
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repoId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster lookups
ProjectSchema.index({ userId: 1 });
ProjectSchema.index({ repoId: 1 });
ProjectSchema.index({ userId: 1, repoId: 1 }, { unique: true });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);

