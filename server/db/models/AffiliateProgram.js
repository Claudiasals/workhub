import { Schema, model } from 'mongoose';

const AffiliateProgramSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'Client',
        required: true,
        unique: true,
        index: true,
    },
    name: {
        type: String,
        enum: ["standard", "premium"],
        default: "standard",
        required: true,
        index: true,
    },
    points: {
        type: Number,
        required: true,
        default: 0
    },
    cardNumber: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
}, { strict: true, timestamps: true, versionKey: false });

const AffiliateProgramModel = model('AffiliateProgram', AffiliateProgramSchema);

export default AffiliateProgramModel;