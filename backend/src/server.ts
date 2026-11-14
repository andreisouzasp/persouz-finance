import express, { type Request, type Response } from "express";
import { type Transaction } from "./interfaces/Transaction.js";
import cors from "cors";

const app = express();
const transactions: Transaction[] = [];

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
    res.json({ mensagem: "API do Persouz Finance operante!" });
});

app.get("/transactions", (req: Request, res: Response) => {
    res.json(transactions);
});

app.post("/transactions", (req: Request, res: Response) => {
    const { description, value, type, category, date } = req.body;

    if (!validateTransactionPayload(req.body)) {
        res.status(400).json({ erro: "Dados da transação inválidos ou incompletos." });
        return;
    }

    const newTransaction: Transaction = {
        id: Date.now(),
        description,
        value,
        type,
        category,
        date,
    };

    transactions.push(newTransaction);
    res.status(201).json(newTransaction);
});

app.put("/transactions/:id", (req: Request, res: Response) => {
    const { description, value, type, category, date } = req.body;
    const id = Number(req.params.id);

    if (isNaN(id)) {
        res.status(400).json({ erro: "ID da transação inválido." });
        return;
    }

    if (!validateTransactionPayload(req.body)) {
        res.status(400).json({ erro: "Dados da transação inválidos ou incompletos." });
        return;
    }

    const transactionIndex = transactions.findIndex((transaction) => transaction.id === id);

    if (transactionIndex === -1) {
        res.status(404).json({ erro: "Transação não encontrada." });
        return;
    }

    const updatedTransaction: Transaction = {
        id,
        description,
        value,
        type,
        category,
        date,
    };

    transactions[transactionIndex] = updatedTransaction;
    res.status(200).json(updatedTransaction);
});

app.delete("/transactions/:id", (req: Request, res: Response) => {
    const id = Number(req.params.id);
    
    if (isNaN(id)) {
        res.status(400).json({ erro: "ID da transação inválido." });
        return;
    }
    
    const transactionIndex = transactions.findIndex((transaction) => transaction.id === id);

    if (transactionIndex === -1) {
        res.status(404).json({ erro: "Transação não encontrada." });
        return;
    }

    const [deletedTransaction] = transactions.splice(transactionIndex, 1);
    res.status(200).json({ mensagem: "Transação removida com sucesso.", transaction: deletedTransaction });
});

app.listen(3000, () => {
    console.log("Servidor do Persouz Finance rodando na porta 3000!");
});

function validateTransactionPayload(payload: Record<string, unknown>): boolean {
    const { description, value, type, category, date } = payload;

    const isValidDescription = typeof description === "string" && description.trim().length > 0;
    const isValidValue = typeof value === "number" && !Number.isNaN(value) && value > 0;
    const isValidType = type === "income" || type === "expense";
    const isValidCategory = typeof category === "string" && category.trim().length > 0;
    const isValidDate = typeof date === "string" && date.trim().length > 0;

    return isValidDescription && isValidValue && isValidType && isValidCategory && isValidDate;
}