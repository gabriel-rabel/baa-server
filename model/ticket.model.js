import mongoose from "mongoose";

const { Schema } = mongoose;

const ticketSchema = new Schema(
    {
        createdBy: { type: Schema.Types.ObjectId, ref: "UnifiedUser", required: true },
        assignedTo: { type: Schema.Types.ObjectId, ref: "UnifiedUser" }, // Pode ser nulo se ainda não for atribuído
        title: { type: String, required: true, trim: true, maxlength: 100 },
        description: { type: String, required: true, trim: true },
        status: { type: String, enum: ["OPEN", "IN_PROGRESS", "CLOSED"], default: "OPEN" },
        priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
        responses: [
            {
                text: { type: String, required: true },
                createdBy: { type: Schema.Types.ObjectId, ref: "UnifiedUser", required: true },
                createdAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketSchema);

export default Ticket;
