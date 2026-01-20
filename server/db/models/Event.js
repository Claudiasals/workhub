import { Schema, model } from 'mongoose';

const EventSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
}, { strict: true, timestamps: true, versionKey: false });

const EventModel = model('Event', EventSchema);

export default EventModel;