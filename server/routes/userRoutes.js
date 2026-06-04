import express from 'express';
import { getAllUsers, createUser, deleteUser, updateUser, getSessionLogs } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

// 1. Static GET Routes
router.get('/', getAllUsers);
router.get('/sessions', getSessionLogs); // Clean static route

// 2. Static POST Routes
router.post('/create', createUser);

// 3. Dynamic Parameterized Routes (Keep these at the very bottom)
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;