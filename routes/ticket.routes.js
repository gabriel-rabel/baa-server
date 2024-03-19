import express from "express";
import Ticket from "../model/ticket.model.js";
import isAuth from "../middlewares/isAuth.js"; // Middleware de autenticação
import UnifiedUser from "../model/unifiedUser.model.js"; // Supondo que você tenha um modelo unificado para usuários

const router = express.Router();

// Criação de um novo ticket por um usuário
router.post("/create", isAuth, async (req, res) => {
    const { title, description, priority } = req.body;
    try {
        const newTicket = new Ticket({
            createdBy: req.auth._id,
            title,
            description,
            priority,
        });
        await newTicket.save();
        res.status(201).json(newTicket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao criar o ticket." });
    }
});

// Listar todos os tickets para admin
router.get("/all", isAuth, async (req, res) => {
    try {
        const currentUser = await UnifiedUser.findById(req.auth._id);
        if (currentUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado." });
        }
        const tickets = await Ticket.find().populate("createdBy", "name");
        res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao listar os tickets." });
    }
});

// Listar tickets específicos do usuário
router.get("/my-tickets", isAuth, async (req, res) => {
    try {
        const tickets = await Ticket.find({ createdBy: req.auth._id }).populate("responses.createdBy", "name");
        res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar os tickets do usuário." });
    }
});

// Responder a um ticket (Admin pode responder qualquer ticket, usuário só o próprio)
router.post("/respond/:ticketId", isAuth, async (req, res) => {
    const { text } = req.body;
    const { ticketId } = req.params;
    try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket não encontrado." });
        }
        // Verificar se é o usuário criador do ticket ou um admin
        if (ticket.createdBy.toString() !== req.auth._id.toString()) {
            const currentUser = await UnifiedUser.findById(req.auth._id);
            if (currentUser.role !== "ADMIN") {
                return res.status(403).json({ error: "Acesso negado." });
            }
        }
        ticket.responses.push({ text, createdBy: req.auth._id });
        await ticket.save();
        res.status(200).json(ticket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao responder o ticket." });
    }
});

// Mudar o status ou atribuir um ticket (Admin)
router.patch("/update/:ticketId", isAuth, async (req, res) => {
    const { status, assignedTo } = req.body;
    const { ticketId } = req.params;
    try {
        const currentUser = await UnifiedUser.findById(req.auth._id);
        if (currentUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Acesso negado." });
        }
        const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, { $set: { status, assignedTo } }, { new: true }).populate("createdBy", "name");
        if (!updatedTicket) {
            return res.status(404).json({ error: "Ticket não encontrado." });
        }
        res.status(200).json(updatedTicket);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao atualizar o ticket." });
    }
});

export default router;
