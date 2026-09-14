import { Schema, models, model, Types } from "mongoose";
import { Role, ROLES } from "@/lib/constants";

export interface IEducation {
  school?: string;
  degree?: string;
  field?: string;
  year?: string;
}

export interface IWorkExperience {
  company?: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  description?: string;
}

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  roles: Role[];
  avatarUrl?: string;
  bio?: string;
  headline?: string;
  phone?: string;
  skills: string[];
  education: IEducation[];
  workExperience: IWorkExperience[];
  preferredFunctions: string[];
  preferredIndustries: string[];
  isActive: boolean;
  mustChangePassword: boolean;
  googleId?: string;
  microsoftId?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    roles: { type: [String], enum: ROLES, default: ["student"] },
    avatarUrl: String,
    bio: String,
    headline: String,
    phone: String,
    skills: { type: [String], default: [] },
    education: {
      type: [
        {
          school: String,
          degree: String,
          field: String,
          year: String,
        },
      ],
      default: [],
    },
    workExperience: {
      type: [
        {
          company: String,
          title: String,
          startDate: String,
          endDate: String,
          description: String,
        },
      ],
      default: [],
    },
    preferredFunctions: { type: [String], default: [] },
    preferredIndustries: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    mustChangePassword: { type: Boolean, default: false },
    googleId: { type: String, sparse: true, unique: true },
    microsoftId: { type: String, sparse: true, unique: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export const User = models.User || model<IUser>("User", UserSchema);
