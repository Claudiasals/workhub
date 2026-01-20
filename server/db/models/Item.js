import { Schema, model } from 'mongoose';

const ItemSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Products',
        required: true,
    },
    pointOfSales: {
        type: Schema.Types.ObjectId,
        ref: 'PointOfSales',
        required: true,
    },
    stock: {
        type: Number,
        required: true,
        default: 0,
    },
    stockLimit: {
        type: Number,
        required: true,
        default: 0,
    },
    promo: {
        type: {
            isActive: { type: Boolean, default: false },
            mode: { type: String, enum: ['percentage', 'fixed'], default: 'fixed' },
            value: { type: Number, default: 0 },
            startDate: { type: Date },
            expireDate: { type: Date },
        },
        default: null,
    },
    note: {
        type: String,
    }
}, { strict: true, timestamps: true, versionKey: false });

const ItemModel = model('Item', ItemSchema);

export default ItemModel;