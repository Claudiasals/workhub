import { COMPANY_DOCUMENTS } from "../data/companyDocuments";

const STORAGE_KEY = "workhub_company_documents";

export function getDocumentSortTime(doc) {
  if (doc?.createdAt) {
    const created = new Date(doc.createdAt).getTime();
    if (!Number.isNaN(created)) return created;
  }

  if (doc?.publishedAt) {
    const published = new Date(doc.publishedAt).getTime();
    if (!Number.isNaN(published)) return published;
  }

  const idMatch = String(doc?.id || "").match(/^doc-(\d+)/);
  if (idMatch) return Number(idMatch[1]);

  return 0;
}

export function sortCompanyDocumentsByNewest(docs = []) {
  return [...docs].sort(
    (a, b) => getDocumentSortTime(b) - getDocumentSortTime(a)
  );
}

export function loadCompanyDocuments() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return sortCompanyDocumentsByNewest([...COMPANY_DOCUMENTS]);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return sortCompanyDocumentsByNewest([...COMPANY_DOCUMENTS]);
    }
    return sortCompanyDocumentsByNewest(parsed);
  } catch {
    return sortCompanyDocumentsByNewest([...COMPANY_DOCUMENTS]);
  }
}

export function saveCompanyDocuments(docs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function createDocumentId() {
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
