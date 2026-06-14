import { API_URL } from "../config/api";

const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const parseAiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  const looksLikeHtml =
    text.trimStart().startsWith("<!DOCTYPE") ||
    text.trimStart().startsWith("<html");

  if (looksLikeHtml || (text && !contentType.includes("application/json"))) {
    throw new Error(
      "Servizio AI non disponibile. Riavvia il server backend (porta 3030)."
    );
  }

  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Risposta non valida dal server.");
  }

  if (!response.ok || json.success === false) {
    throw new Error(json.message || "AI request failed");
  }
  return json.data;
};

const postAiRequest = async (token, path) => {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: authHeaders(token),
  });

  if (response.status === 404) {
    throw new Error("Endpoint not found");
  }

  return parseAiResponse(response);
};

export const classifyTicketRequest = async ({ token, title, description }) => {
  const response = await fetch(`${API_URL}/ai/tickets/classify`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ title, description }),
  });
  return parseAiResponse(response);
};

export const fetchTicketInsightsRequest = async (token) => {
  const response = await fetch(`${API_URL}/ai/tickets/insights`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return parseAiResponse(response);
};

export const fetchWarehouseSuggestionsRequest = async (token, lang = "it") => {
  const response = await fetch(`${API_URL}/ai/warehouse/suggestions`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ lang }),
  });
  return parseAiResponse(response);
};

export const fetchShiftAnalysisRequest = async (token) => {
  const response = await fetch(`${API_URL}/ai/shifts/analyze`, {
    method: "POST",
    headers: authHeaders(token),
  });
  return parseAiResponse(response);
};

export const generateCustomerPromoEmailRequest = async ({
  token,
  customerId,
  promotionIndex = 0,
  lang,
}) => {
  const response = await fetch(`${API_URL}/ai/customers/promo-email`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ customerId, promotionIndex, lang }),
  });
  return parseAiResponse(response);
};

export const fetchBusinessOverviewRequest = async (token) => {
  const paths = ["/ai/business/overview", "/ai/dashboard/insights"];
  let lastError;

  for (const path of paths) {
    try {
      return await postAiRequest(token, path);
    } catch (err) {
      lastError = err;
      if (/404|not found|non disponibile/i.test(err.message || "")) {
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error("Business overview non disponibile");
};

/** @deprecated use fetchBusinessOverviewRequest */
export const fetchDashboardInsightsRequest = fetchBusinessOverviewRequest;

export const fetchCustomerAiInsightsRequest = async ({ token, customerId }) => {
  const response = await fetch(`${API_URL}/ai/customers/insights`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ customerId }),
  });
  return parseAiResponse(response);
};

export const generateTicketReplyRequest = async ({
  token,
  ticketTitle,
  ticketContent,
  keywords,
  lang,
  userName,
}) => {
  const response = await fetch(`${API_URL}/ai/tickets/reply`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      ticketTitle,
      ticketContent,
      keywords,
      lang,
      userName,
    }),
  });
  return parseAiResponse(response);
};

export const generateCommunicationRequest = async ({ token, keywords, lang }) => {
  const response = await fetch(`${API_URL}/ai/communications/generate`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ keywords, lang }),
  });
  return parseAiResponse(response);
};
