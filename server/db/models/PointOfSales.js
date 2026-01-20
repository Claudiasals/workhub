import { Schema, model } from 'mongoose';

const PointOfSalesSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    location: {
        type: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            zipCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        required: true
    },
    
}, { strict: true, timestamps: true, versionKey: false });

const PointOfSalesModel = model('PointOfSales', PointOfSalesSchema);

export default PointOfSalesModel;