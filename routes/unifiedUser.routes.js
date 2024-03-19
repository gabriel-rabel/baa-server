import express from "express";
import UnifiedUserModel from "../model/unifiedUser.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import isAuth from "../middlewares/isAuth.js";
import nodemailer from "nodemailer";

const router = express.Router();
const SALT_ROUNDS = 10;

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PW,
    },
});

// Função auxiliar para gerar token
const generateToken = (user) => {
    return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" }); // Token válido por 1 dia
};

// SIGNUP
router.post("/signup", async (req, res) => {
    const { name, email, phone, password, role = "USER", profilePicture } = req.body;
    try {
        const existingUser = await UnifiedUserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "E-mail já está em uso." });
        }

        if (!password.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/)) {
            return res.status(400).json({ message: "A senha não atende aos requisitos mínimos." });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = await UnifiedUserModel.create({
            name,
            email,
            phone,
            passwordHash: hashedPassword,
            role,
            profilePicture,
        });

        const token = generateToken(newUser);
        res.status(201).json({ newUser: newUser._id, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao criar usuário." });
    }
});

// LOGIN
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await UnifiedUserModel.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            return res.status(401).json({ message: "E-mail ou senha inválidos." });
        }

        const token = generateToken(user);
        res.status(200).json({ userId: user._id, token });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao realizar login." });
    }
});

// PROFILE
router.get("/profile", isAuth, async (req, res) => {
    try {
        const user = await UnifiedUserModel.findById(req.auth.id).select("-passwordHash");
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar perfil do usuário." });
    }
});

// EDIT
router.put("/edit", isAuth, async (req, res) => {
    try {
        const updatedUser = await UnifiedUserModel.findByIdAndUpdate(req.auth.id, req.body, { new: true, runValidators: true }).select("-passwordHash");
        if (!updatedUser) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao editar perfil do usuário." });
    }
});

// DELETE (Deleção lógica)
router.delete("/delete", isAuth, async (req, res) => {
    try {
        await UnifiedUserModel.findByIdAndUpdate(req.auth.id, { active: false });
        res.status(200).json({ message: "Usuário deletado com sucesso." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao deletar usuário." });
    }
});

// Redefinição de senha
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    try {
        const user = await UnifiedUserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "Usuário não encontrado." });
        }

        const token = jwt.sign({ id: user._id }, process.env.RESET_PASSWORD_KEY, { expiresIn: "20m" });
        const link = `${process.env.CLIENT_URL}/reset-password/${token}`;

        const mailOptions = {
            from: process.env.NODEMAILER_USER,
            to: user.email,
            subject: "Redefinição de Senha",
            html: `<p>Por favor, clique no link abaixo para redefinir sua senha:</p><p><a href="${link}">Redefinir Senha</a></p>`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return res.status(500).json({ message: "Erro ao enviar o e-mail de redefinição de senha." });
            }
            return res.status(200).json({ message: "E-mail de redefinição de senha enviado com sucesso." });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao solicitar a redefinição de senha." });
    }
});

// Atualizar senha após redefinição
router.post("/reset-password", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        if (!newPassword) {
            return res.status(400).json({ message: "Nova senha não fornecida." });
        }

        const decoded = jwt.verify(token, process.env.RESET_PASSWORD_KEY);
        const user = await UnifiedUserModel.findById(decoded.id);

        if (!user) {
            return res.status(400).json({ message: "Usuário inválido ou token expirado." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        user.passwordHash = hashedPassword;
        await user.save();

        res.status(200).json({ message: "Senha atualizada com sucesso." });
    } catch (error) {
        console.error(error);
        if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Token inválido ou expirado." });
        }
        res.status(500).json({ message: "Erro ao atualizar a senha." });
    }
});

export default router;
