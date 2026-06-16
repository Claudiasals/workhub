import { loadCompanyDocuments } from "./companyDocumentsStorage";

export function leaveRequestKey(req, index) {
  return req._id || `leave-${index}-${req.from}-${req.to}-${req.mode}`;
}

export function loadNotificationState(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`workhub_notif_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveNotificationState(userId, state) {
  if (!userId || !state) return;
  localStorage.setItem(`workhub_notif_${userId}`, JSON.stringify(state));
}

export function createNotificationBaseline({
  tickets = [],
  leaveRequests = [],
  documents = [],
  events = [],
  shiftsUpdatedAt = null,
}) {
  const ticketMap = {};
  tickets.forEach((ticket) => {
    const id = ticket._id || ticket.id;
    if (!id) return;
    ticketMap[id] = {
      status: ticket.status,
      updatedAt: ticket.updatedAt || ticket.createdAt || null,
    };
  });

  const leaveMap = {};
  leaveRequests.forEach((req, index) => {
    leaveMap[leaveRequestKey(req, index)] = req.status;
  });

  const documentMap = {};
  documents.forEach((doc) => {
    documentMap[doc.id] = { publishedAt: doc.publishedAt };
  });

  const eventMap = {};
  events.forEach((event) => {
    const id = event._id || event.id;
    if (!id) return;
    eventMap[id] = {
      updatedAt: event.updatedAt || event.createdAt || null,
    };
  });

  return {
    initialized: true,
    tickets: ticketMap,
    leave: leaveMap,
    documents: documentMap,
    events: eventMap,
    shiftsUpdatedAt: shiftsUpdatedAt || null,
  };
}

export function syncNotificationBaseline(userId, snapshot) {
  const baseline = createNotificationBaseline(snapshot);
  saveNotificationState(userId, baseline);
  return baseline;
}

export function markDocumentReadInNotifications(userId, docId) {
  if (!userId || !docId) return;
  const state = loadNotificationState(userId);
  if (!state?.initialized) return;
  const docs = loadCompanyDocuments();
  const doc = docs.find((d) => d.id === docId);
  if (!doc) return;
  state.documents = state.documents || {};
  state.documents[docId] = { publishedAt: doc.publishedAt };
  saveNotificationState(userId, state);
}
