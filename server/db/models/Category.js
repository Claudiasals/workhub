import { Schema, model } from 'mongoose';

const CategorySchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
}, { strict: true, timestamps: true, versionKey: false });

const CategoryModel = model('Category', CategorySchema);

export default CategoryModel;