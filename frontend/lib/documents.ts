const API_URL = 'http://127.0.0.1:8000/api/v1';

export interface UploadDocumentResult {
  status: number;
  ok: boolean;
  data: any;
}

export interface UniversityOption {
  id: number;
  university_code: string;
  university_name: string;
}

export interface SubjectOption {
  id: number;
  subject_code: string;
  subject_name: string;
  university_id: number;
}

export const uploadDocument = async (formData: FormData): Promise<UploadDocumentResult> => {
  const response = await fetch(`${API_URL}/document/upload`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();
  return {
    status: response.status,
    ok: response.ok,
    data,
  };
};

export const getUniversities = async (search?: string): Promise<UniversityOption[]> => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const response = await fetch(`${API_URL}/document/universities?${params.toString()}`);
  if (!response.ok) {
    return [];
  }
  return response.json();
};

export const getSubjects = async (
  universityId?: number,
  search?: string
): Promise<SubjectOption[]> => {
  const params = new URLSearchParams();
  if (universityId !== undefined) params.set('university_id', universityId.toString());
  if (search) params.set('search', search);
  const response = await fetch(`${API_URL}/document/subjects?${params.toString()}`);
  if (!response.ok) {
    return [];
  }
  return response.json();
};

export const generateAIFromDocument = async (documentId: string): Promise<{
  ok: boolean;
  data: any;
}> => {
  const response = await fetch(`${API_URL}/document/generate-ai/${documentId}`, {
    method: 'POST',
  });
  const data = await response.json();
  return { ok: response.ok, data };
};
