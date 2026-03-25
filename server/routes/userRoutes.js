import express from 'express';
import { getAllUsers, createUser, deleteUser, updateUser } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(adminOnly);

router.get('/', getAllUsers);
router.post('/create', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;