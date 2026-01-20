import { Schema, model } from 'mongoose';

const ClientSchema = new Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true,
        index: true,
    },
    firstName: {
        type: String,
        required: true,
        index: true,
    },
    lastName: {
        type: String,
        required: true,
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
    birthDate: {
        type: Date,
        required: true
    },
    fiscalCode: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    phoneNumber: {
        type: String,
        required: true,
        index: true,
    },
    affiliateProgram: {
        type: Schema.Types.ObjectId,
        ref: 'AffiliateProgram',
        required: false
    }
}, { strict: true, timestamps: true, versionKey: false });

ClientSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

const ClientModel = model('Client', ClientSchema);

export default ClientModel;
