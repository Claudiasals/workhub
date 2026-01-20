import { Schema, model } from "mongoose";

const UserLeaveSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User", 
      required: true,
    },
    vacationHours: {
      type: Number,
      required: true,
      default: 160,
    },
    leaveHours: {
      type: Number,
      required: true,
      default: 20,
    },
    requestedHours: [
      {
        year: { type: Number, required: true },
        hours: { type: Number, required: true },
        from: { type: Date },
        to: { type: Date },
        timeFrom: { type: String },
        timeTo: { type: String },
        mode: {
          type: String,
          enum: ["vacation", "leave"],
          required: true,
        },
        status: {
          type: String,
          enum: ["approved", "pending", "denied"],
          default: "pending",
        },
      },
    ],
  },
  { strict: true, timestamps: true, versionKey: false }
);

const UserLeaveModel = model("UserLeave", UserLeaveSchema);

export default UserLeaveModel;
