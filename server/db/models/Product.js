import { Schema, model } from "mongoose";

const ProductsSchema = new Schema(
	{
		name: {
			type: String,
			required: true,
			index: true,
		},
		price: {
			type: Number,
			required: true,
		},
		sku: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		category: {
			type: Schema.Types.ObjectId,
			ref: "Category",
			required: true,
		},
		image: {
			type: String,
			required: false,
		},
		description: {
			type: String,
			required: false,
		},
		specs: {
			type: {
				weight: Number,
				height: Number,
				width: Number,
				depth: Number,
			},
            required: false,
            default: null,
		},
	},
	{ strict: true, timestamps: true, versionKey: false }
);

const ProductsModel = model("Products", ProductsSchema);

export default ProductsModel;
