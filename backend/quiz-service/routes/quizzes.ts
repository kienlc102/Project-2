import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as quizController from '../controllers/quiz.controller';

const router = Router();

// Upload
router.post('/upload', authMiddleware, quizController.uploadImage);

// CRUD
router.post('/', authMiddleware, quizController.createQuiz);
router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuiz);
router.put('/:id', authMiddleware, quizController.updateQuiz);
router.delete('/:id', authMiddleware, quizController.deleteQuiz);

// Quiz submission
router.post('/:id/submit', authMiddleware, quizController.submitQuiz);

// Analytics (owner only)
router.get('/:id/analytics', authMiddleware, quizController.getAnalytics);
router.get('/:id/responses', authMiddleware, quizController.getResponses);
router.get('/:id/responses/:attemptId', authMiddleware, quizController.getResponseDetail);

// My attempts (quiz-taker)
router.get('/:id/my-attempts', authMiddleware, quizController.getMyAttempts);
router.get('/:id/my-attempts/:attemptId', authMiddleware, quizController.getMyAttemptDetail);

export default router;
