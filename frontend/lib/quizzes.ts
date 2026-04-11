const API_URL = process.env.NEXT_PUBLIC_QUIZ_API_URL || 'http://localhost:5000/api';

// ============================================
// TYPES
// ============================================
export interface QuizOption {
  id?: number;
  option_text: string;
  is_correct: boolean;
  position: number;
}

export interface QuizQuestion {
  id?: number;
  question_text: string;
  question_type: 'multiple_choice' | 'checkboxes' | 'short_answer' | 'paragraph' | 'dropdown';
  image_url?: string | null;
  is_required: boolean;
  points: number;
  position: number;
  options: QuizOption[];
}

export interface Quiz {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
  author_name: string;
  question_count?: number;
  questions?: QuizQuestion[];
  isOwner?: boolean;
}

export interface QuizzesResponse {
  success: boolean;
  message?: string;
  data?: {
    quizzes: Quiz[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// ============================================
// UPLOAD IMAGE
// ============================================
export const uploadQuizImage = async (
  token: string,
  file: File
): Promise<{ success: boolean; data?: { url: string }; message?: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/quizzes/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  return response.json();
};

// ============================================
// CREATE QUIZ
// ============================================
export const createQuiz = async (
  token: string,
  data: {
    title: string;
    description?: string;
    visibility: 'public' | 'private';
    questions: {
      questionText: string;
      questionType: string;
      imageUrl?: string;
      isRequired: boolean;
      points: number;
      options?: { text: string; isCorrect: boolean }[];
    }[];
  }
) => {
  const response = await fetch(`${API_URL}/quizzes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

// ============================================
// GET QUIZZES (browse)
// ============================================
export const getQuizzes = async (
  params?: { search?: string; page?: number; limit?: number; filter?: string },
  token?: string | null
): Promise<QuizzesResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.filter) searchParams.set('filter', params.filter);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/quizzes?${searchParams.toString()}`, { headers });
  return response.json();
};

// ============================================
// GET SINGLE QUIZ
// ============================================
export const getQuiz = async (
  id: number,
  token?: string | null
): Promise<{ success: boolean; data?: Quiz; message?: string }> => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/quizzes/${id}`, { headers });
  return response.json();
};

// ============================================
// UPDATE QUIZ
// ============================================
export const updateQuiz = async (
  token: string,
  id: number,
  data: {
    title: string;
    description?: string;
    visibility: 'public' | 'private';
    questions: {
      questionText: string;
      questionType: string;
      imageUrl?: string;
      isRequired: boolean;
      points: number;
      options?: { text: string; isCorrect: boolean }[];
    }[];
  }
) => {
  const response = await fetch(`${API_URL}/quizzes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

// ============================================
// DELETE QUIZ
// ============================================
export const deleteQuiz = async (
  token: string,
  id: number
): Promise<{ success: boolean; message?: string }> => {
  const response = await fetch(`${API_URL}/quizzes/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
};

// ============================================
// SUBMIT QUIZ (Take quiz)
// ============================================
export const submitQuiz = async (
  token: string,
  quizId: number,
  answers: { questionId: number; selectedOptionIds?: number[]; textAnswer?: string }[]
): Promise<{
  success: boolean;
  message?: string;
  data?: { attemptId: number; score: number; totalPoints: number; percentage: number };
}> => {
  const response = await fetch(`${API_URL}/quizzes/${quizId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ answers }),
  });

  return response.json();
};

// ============================================
// GET QUIZ ANALYTICS (Owner only)
// ============================================
export interface QuestionAnalytics {
  id: number;
  questionText: string;
  questionType: string;
  points: number;
  totalAnswers: number;
  correctCount: number;
  incorrectCount: number;
  correctPercentage: number;
  options: {
    id: number;
    text: string;
    isCorrect: boolean;
    selectionCount: number;
  }[];
}

export interface QuizAnalytics {
  quizTitle: string;
  summary: {
    totalAttempts: number;
    averageScore: number;
    averageTotal: number;
    averagePercentage: number;
    highestScore: number;
    lowestScore: number;
  };
  questions: QuestionAnalytics[];
}

export const getQuizAnalytics = async (
  token: string,
  quizId: number
): Promise<{ success: boolean; data?: QuizAnalytics; message?: string }> => {
  const response = await fetch(`${API_URL}/quizzes/${quizId}/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
};

// ============================================
// GET QUIZ RESPONSES (Owner only)
// ============================================
export interface QuizResponse {
  id: number;
  quiz_id: number;
  user_id: number;
  score: number;
  total_points: number;
  started_at: string;
  completed_at: string;
  user_name: string;
  user_email: string;
  percentage: number;
}

export const getQuizResponses = async (
  token: string,
  quizId: number
): Promise<{ success: boolean; data?: { responses: QuizResponse[] }; message?: string }> => {
  const response = await fetch(`${API_URL}/quizzes/${quizId}/responses`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
};

// ============================================
// GET SINGLE RESPONSE DETAIL (Owner only)
// ============================================
export const getResponseDetail = async (
  token: string,
  quizId: number,
  attemptId: number
) => {
  const response = await fetch(`${API_URL}/quizzes/${quizId}/responses/${attemptId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
};

// ============================================
// GET MY ATTEMPTS (Quiz-taker)
// ============================================
export const getMyAttempts = async (
  token: string,
  quizId: number
) => {
  const response = await fetch(`${API_URL}/quizzes/${quizId}/my-attempts`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
};

// ============================================
// GET MY ATTEMPT DETAIL (Quiz-taker)
// ============================================
export const getMyAttemptDetail = async (
  token: string,
  quizId: number,
  attemptId: number
) => {
  const response = await fetch(`${API_URL}/quizzes/${quizId}/my-attempts/${attemptId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.json();
};
