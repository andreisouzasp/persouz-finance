import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import {
    getTransactions,
    createTransaction,
    updateTransaction,
    deleteTransaction
} from '../controllers/transactionController.js';

const router = Router();

router.use(authenticateToken);

router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;