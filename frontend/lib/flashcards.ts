const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ============================================
// TYPES
// ============================================
export interface FlashcardCard {
  id?: number;
  term: string;
  definition: string;
  termImageUrl?: string | null;
  definitionImageUrl?: string | null;
  position: number;
}

export interface FlashcardSet {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
  author_name: string;
  card_count?: number;
  cards?: FlashcardCard[];
  isOwner?: boolean;
}

export interface FlashcardSetsResponse {
  success: boolean;
  message?: string;
  data?: {
    sets: FlashcardSet[];
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
export const uploadFlashcardImage = async (token: string, file: File): Promise<{ success: boolean; data?: { url: string }; message?: string }> => {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(`${API_URL}/flashcards/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
};

// ============================================
// CREATE FLASHCARD SET
// ============================================
export const createFlashcardSet = async (
  token: string,
  data: {
    title: string;
    description?: string;
    visibility: 'public' | 'private';
    cards: { term: string; definition: string; termImageUrl?: string; definitionImageUrl?: string }[];
  }
) => {
  const response = await fetch(`${API_URL}/flashcards/sets`, {
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
// GET FLASHCARD SETS (browse)
// ============================================
export const getFlashcardSets = async (
  params?: { search?: string; page?: number; limit?: number; filter?: string },
  token?: string | null
): Promise<FlashcardSetsResponse> => {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set('search', params.search);
  if (params?.page) searchParams.set('page', params.page.toString());
  if (params?.limit) searchParams.set('limit', params.limit.toString());
  if (params?.filter) searchParams.set('filter', params.filter);

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/flashcards/sets?${searchParams.toString()}`, {
    method: 'GET',
    headers,
  });

  return response.json();
};

// ============================================
// GET SINGLE FLASHCARD SET
// ============================================
export const getFlashcardSet = async (id: number, token?: string | null) => {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/flashcards/sets/${id}`, {
    method: 'GET',
    headers,
  });

  return response.json();
};

// ============================================
// UPDATE FLASHCARD SET
// ============================================
export const updateFlashcardSet = async (
  token: string,
  id: number,
  data: {
    title: string;
    description?: string;
    visibility: 'public' | 'private';
    cards: { term: string; definition: string; termImageUrl?: string; definitionImageUrl?: string }[];
  }
) => {
  const response = await fetch(`${API_URL}/flashcards/sets/${id}`, {
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
// DELETE FLASHCARD SET
// ============================================
export const deleteFlashcardSet = async (token: string, id: number) => {
  const response = await fetch(`${API_URL}/flashcards/sets/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.json();
};
