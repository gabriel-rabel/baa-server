import { Schema, model } from "mongoose";

const unifiedUserSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/,
            lowercase: true,
        },
        phone: { type: String, required: true, trim: true },
        passwordHash: { type: String, required: true },
        role: { type: String, enum: ["USER", "ADMIN"], required: true },
        active: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        // Campos específicos do usuário
        profilePicture: {
            type: String,
            default: "https://cdn.wallpapersafari.com/92/63/wUq2AY.jpg",
        },
        tickets: [{ type: Schema.Types.ObjectId, ref: "Ticket" }], // Ligação com tickets, opcional dependendo do tipo de usuário
        // Você pode adicionar outros campos específicos para administradores se necessário
    },
    { timestamps: true }
);

export default model("UnifiedUser", unifiedUserSchema);
