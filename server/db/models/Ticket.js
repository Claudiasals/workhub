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
    aiClassification: {
        priority: {
            type: String,
            enum: ['bassa', 'media', 'alta'],
        },
        category: {
            type: String,
            enum: ['tecnico', 'magazzino', 'ordine', 'cliente', 'personale', 'altro'],
        },
        summary: { type: String },
        adminSuggestion: { type: String },
        source: { type: String, enum: ['ai', 'heuristic'], default: 'heuristic' },
        generatedAt: { type: Date },
    },
    assignedDepartment: {
        type: String,
        enum: ['tecnico', 'magazzino', 'ordine', 'cliente', 'personale', 'altro'],
        default: null,
        required: false,
    },
}, { strict: true, timestamps: true, versionKey: false });

const TicketModel = model('Ticket', TicketSchema);

export default TicketModel;