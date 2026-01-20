import { Schema, model } from 'mongoose';

const TicketSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        required: true,
        enum: ['open', 'closed'],
        default: 'open'
    },
}, { strict: true, timestamps: true, versionKey: false });

const TicketModel = model('Ticket', TicketSchema);

export default TicketModel;