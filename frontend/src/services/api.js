import { supabase } from "./supabase";

const API_URL = "http://127.0.0.1:8000/api/v1";


async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("User is not authenticated");
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
}


async function handleResponse(
  response,
  defaultMessage
) {
  const text = await response.text();

  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (!response.ok) {
    const detail = data?.detail;

    throw new Error(
      typeof detail === "string"
        ? detail
        : detail
          ? JSON.stringify(detail)
          : defaultMessage
    );
  }

  return data;
}


export async function createCandidate(data) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/candidates`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(data),
    }
  );

  return handleResponse(
    response,
    "Failed to create candidate"
  );
}


export async function getAssessments() {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/assessments`,
    {
      headers: {
        ...authHeaders,
      },
    }
  );

  return handleResponse(
    response,
    "Failed to fetch assessments"
  );
}


export async function getQuestions(
  assessmentId
) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/assessments/${assessmentId}/questions`,
    {
      headers: {
        ...authHeaders,
      },
    }
  );

  return handleResponse(
    response,
    "Failed to fetch questions"
  );
}


export async function createAttempt(
  assessmentId,
  candidateId
) {
  const authHeaders = await getAuthHeaders();

  const url =
    `${API_URL}/attempts` +
    `?assessment_id=${encodeURIComponent(
      assessmentId
    )}` +
    `&candidate_id=${encodeURIComponent(
      candidateId
    )}`;

  const response = await fetch(
    url,
    {
      method: "POST",
      headers: {
        ...authHeaders,
      },
    }
  );

  return handleResponse(
    response,
    "Failed to create attempt"
  );
}


export async function saveResponse(
  attemptId,
  questionId,
  answer
) {
  const authHeaders = await getAuthHeaders();

  const response = await fetch(
    `${API_URL}/attempts/${attemptId}/responses/${questionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        answer,
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to save response"
  );
}


export async function submitAssessment(
  attemptId
) {
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

  return handleResponse(
    response,
    "Failed to submit assessment"
  );
}


export async function uploadResume(
  file,
  candidateId
) {
  const authHeaders = await getAuthHeaders();

  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/resumes/upload?candidate_id=${encodeURIComponent(
      candidateId
    )}`,
    {
      method: "POST",
      headers: {
        ...authHeaders,
      },
      body: formData,
    }
  );

  return handleResponse(
    response,
    "Failed to upload resume"
  );
}