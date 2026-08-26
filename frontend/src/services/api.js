const API_URL = "http://127.0.0.1:8000/api/v1";

export async function createCandidate(data) {
  const response = await fetch(`${API_URL}/candidates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create candidate");
  }

  return response.json();
}

export async function getAssessments() {
  const response = await fetch(`${API_URL}/assessments`);

  if (!response.ok) {
    throw new Error("Failed to fetch assessments");
  }

  return response.json();
}

export async function getQuestions(assessmentId) {
  const response = await fetch(
    `${API_URL}/assessments/${assessmentId}/questions`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch questions");
  }

  return response.json();
}

export async function createAttempt(
  assessmentId,
  candidateId
) {
  const response = await fetch(
    `${API_URL}/attempts?assessment_id=${assessmentId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        candidate_id: candidateId,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create attempt");
  }

  return response.json();
}

export async function saveResponse(
  attemptId,
  questionId,
  answer
) {
  const response = await fetch(
    `${API_URL}/attempts/${attemptId}/responses/${questionId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        answer: answer,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save response");
  }

  return response.json();
}

export async function submitAssessment(attemptId) {
  const response = await fetch(
    `${API_URL}/attempts/${attemptId}/submit`,
    {
      method: "POST",
    }
  );

  if (!response.ok) {
    throw new Error("Failed to submit assessment");
  }

  return response.json();
}