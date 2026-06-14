import { COMPANY_DOCUMENTS } from "../data/companyDocuments";

const STORAGE_KEY = "workhub_company_documents";

export function loadCompanyDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...COMPANY_DOCUMENTS];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return [...COMPANY_DOCUMENTS];
    return parsed;
  } catch {
    return [...COMPANY_DOCUMENTS];
  }
}

export function saveCompanyDocuments(docs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function createDocumentId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
