import express from 'express';
import { logout } from '../controllers/auth.js';

const router = express.Router();

router.get('/logout', logout);

export default router;
