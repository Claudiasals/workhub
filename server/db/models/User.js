import { Schema, model } from "mongoose";

const UserSchema = new Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		username: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		password: {
			type: String,
			required: true,
		},
		isGeneratedPassword: {
			type: Boolean,
			default: false,
		},
		firstName: {
			type: String,
			required: true,
		},
		lastName: {
			type: String,
			required: true,
		},
		role: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
		department: {
			type: String,
			required: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		personnelNumber: {
			type: Number,
			required: true,
		},
		phone: {
			type: Number,
			required: false,
		},
		workplace: {
			type: Schema.Types.ObjectId,
			ref: "PointOfSales",
			required: true,
		},
		contractType: {
			type: String,
			enum: ["indeterminato", "determinato", "part-time"],
			required: false,
		},
		hireDate: {
			type: Date,
			required: false,
		},
		twofaSecret: {
			type: String,
			default: null,
		},
		twofaEnabled: {
			type: Boolean,
			default: false,
		},
	},
	{ strict: true, timestamps: true, versionKey: false }
);

UserSchema.virtual("fullName").get(function () {
	return `${this.firstName} ${this.lastName}`;
});

const UserModel = model("User", UserSchema);

export default UserModel;
