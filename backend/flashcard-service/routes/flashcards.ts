import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as flashcardController from '../controllers/flashcard.controller';

const router = Router();

// Upload
router.post('/upload', authMiddleware, flashcardController.uploadImage);

// CRUD
router.post('/sets', authMiddleware, flashcardController.createSet);
router.get('/sets', flashcardController.getAllSets);
router.get('/sets/:id', flashcardController.getSet);
router.put('/sets/:id', authMiddleware, flashcardController.updateSet);
router.delete('/sets/:id', authMiddleware, flashcardController.deleteSet);

export default router;
