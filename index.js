import cors from "cors"; // esconder e acessar nossas variaveis de ambiente
import * as dotenv from "dotenv"; // biblioteca para variaveis de ambiente
import express from "express";
import connectToDB from "./config/db.config.js";
import uploadRoute from "./routes/upload.routes.js";
import unifiedRoute from "./routes/unifiedUser.routes.js";
import ticketRouter from "./routes/ticket.routes.js";

dotenv.config();

connectToDB(); //conecta ao DB

const app = express();

app.use(cors()); // quando não tem parametros, aceita requisição de qualquer "url".
app.use(express.json()); // configuraçã o do servidor para aceitar e enviar .json

//CRIAR ROTA DOS USUARIOS
app.use("/user", unifiedRoute);

//CRIAR ROTA DO TICKET
app.use("/ticket", ticketRouter);

//ex: localhost:4000/upload/file
app.use("/upload", uploadRoute);

app.listen(process.env.PORT, () => {
    console.log(`Server up and running at port: ${process.env.PORT}`);
});
