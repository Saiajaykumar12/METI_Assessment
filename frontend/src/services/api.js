import { supabase } from "./supabase";

const API_URL = "http://127.0.0.1:8000/api/v1";

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("User is not authenticated");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
};

// Create candidate
export const createCandidate = async (candidateData) => {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_URL}/candidates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify(candidateData),
  });

  if (!response.ok) {
    let errorMessage = "Failed to create candidate";

    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// Upload resume
export const uploadResume = async (file, candidateId) => {
  const authHeaders = await getAuthHeaders();

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/resumes/upload?candidate_id=${candidateId}`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    let errorMessage = "Resume upload failed";

    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// Get assessments
export const getAssessments = async () => {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_URL}/assessments`, {
    method: "GET",
    headers: {
      ...authHeaders,
    },
  });

  if (!response.ok) {
    let errorMessage = "Failed to fetch assessments";

    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// Get questions for assessment
export const getQuestions = async (assessmentId) => {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/assessments/${assessmentId}/questions`,
    {
      method: "GET",
      headers: {
        ...authHeaders,
      },
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to fetch questions";

    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// Create attempt
export const createAttempt = async (assessmentId) => {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/attempts?assessment_id=${assessmentId}`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
      },
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to create attempt";

    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // ignore
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// Save response
export const saveResponse = async (
  attemptId,
  questionId,
  selectedAnswer
) => {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(`${API_URL}/attempts/${attemptId}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      question_id: questionId,
      selected_answer: selectedAnswer,
    }),
  });

  if (!response.ok) {
    let errorMessage = "Failed to save response";

    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// Submit assessment
export const submitAssessment = async (attemptId) => {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/attempts/${attemptId}/submit`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
      },
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to submit assessment";

    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// Get result
export const getResult = async (attemptId) => {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/attempts/${attemptId}/result`,
    {
      method: "GET",
      headers: {
        ...authHeaders,
      },
    }
  );

  if (!response.ok) {
    let errorMessage = "Failed to fetch result";

    try {
      const error = await response.json();
      errorMessage = error.detail || errorMessage;
    } catch {
      // Ignore JSON parsing error
    }

    throw new Error(errorMessage);
  }

  return response.json();
};