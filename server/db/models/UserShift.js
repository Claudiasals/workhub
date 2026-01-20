import { Schema, model } from "mongoose";

const DayShiftSchema = new Schema(
  {
    morning: { type: Boolean, default: false },
    afternoon: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserShiftSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },

    shifts: {
      monday:    { type: DayShiftSchema, default: () => ({}) },
      tuesday:   { type: DayShiftSchema, default: () => ({}) },
      wednesday: { type: DayShiftSchema, default: () => ({}) },
      thursday:  { type: DayShiftSchema, default: () => ({}) },
      friday:    { type: DayShiftSchema, default: () => ({}) },
      saturday:  { type: DayShiftSchema, default: () => ({}) },
    },
  },
  { strict: true, timestamps: true, versionKey: false }
);

const UserShiftModel = model("UserShift", UserShiftSchema);
export default UserShiftModel;
