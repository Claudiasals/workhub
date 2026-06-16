import {
  createNotificationBaseline,
  leaveRequestKey,
  loadNotificationState,
  saveNotificationState,
} from "./notificationStorage";

const getUserId = (authUser) => authUser?._id || authUser?.id;

const filterUserTickets = (tickets, authUser) => {
  const userId = getUserId(authUser);
  if (!userId || !Array.isArray(tickets)) return [];

  return tickets.filter(
    (ticket) =>
      ticket.user === userId ||
      ticket.user?._id === userId ||
      ticket.user?.id === userId
  );
};

const isNewer = (a, b) => {
  if (!a || !b) return Boolean(a && !b);
  return new Date(a).getTime() > new Date(b).getTime();
};

export function buildUserNotifications({
  authUser,
  tickets = [],
  leaveRecord = null,
  documents = [],
  events = [],
  userShifts = null,
  isAdmin = false,
  t,
}) {
  const userId = getUserId(authUser);
  if (!userId) {
    return { items: [], count: 0, state: null };
  }

  const userTickets = isAdmin ? [] : filterUserTickets(tickets, authUser);
  const leaveRequests = isAdmin ? [] : leaveRecord?.requestedHours || [];
  const shiftsUpdatedAt = isAdmin ? null : userShifts?.updatedAt || null;

  const snapshot = {
    tickets: userTickets,
    leaveRequests,
    documents,
    events,
    shiftsUpdatedAt,
  };

  let state = loadNotificationState(userId);

  if (!state?.initialized) {
    state = createNotificationBaseline(snapshot);
    saveNotificationState(userId, state);
    return { items: [], count: 0, state };
  }

  const items = [];

  if (!isAdmin) {
    userTickets.forEach((ticket) => {
      const id = ticket._id || ticket.id;
      if (!id) return;

      const prev = state.tickets?.[id];
      const updatedAt = ticket.updatedAt || ticket.createdAt;

      if (!prev) return;

      if (prev.status === "open" && ticket.status === "closed") {
        items.push({
          id: `ticket-${id}-closed`,
          type: "ticket",
          entityId: id,
          title: t("notifTicketClosed"),
          message: ticket.name,
          href: "/ticket",
          at: updatedAt,
        });
        return;
      }

      if (
        ticket.status === "open" &&
        isNewer(updatedAt, prev.updatedAt)
      ) {
        items.push({
          id: `ticket-${id}-updated`,
          type: "ticket",
          entityId: id,
          title: t("notifTicketUpdated"),
          message: ticket.name,
          href: "/ticket",
          at: updatedAt,
        });
      }
    });

    leaveRequests.forEach((req, index) => {
      const key = leaveRequestKey(req, index);
      const prevStatus = state.leave?.[key];
      const modeLabel =
        req.mode === "vacation" ? t("notifLeaveVacation") : t("notifLeavePermit");

      if (
        prevStatus === "pending" &&
        (req.status === "approved" || req.status === "denied")
      ) {
        const title =
          req.status === "approved"
            ? t("notifLeaveApproved")
            : t("notifLeaveDenied");

        items.push({
          id: `leave-${key}-${req.status}`,
          type: "leave",
          leaveKey: key,
          leaveStatus: req.status,
          title,
          message: modeLabel,
          href: "/personale",
          at: leaveRecord?.updatedAt || new Date().toISOString(),
        });
      }
    });

    if (
      shiftsUpdatedAt &&
      state.shiftsUpdatedAt &&
      isNewer(shiftsUpdatedAt, state.shiftsUpdatedAt)
    ) {
      items.push({
        id: `shifts-${shiftsUpdatedAt}`,
        type: "shift",
        title: t("notifShiftUpdated"),
        message: t("notifShiftUpdatedHint"),
        href: "/board#calendar",
        at: shiftsUpdatedAt,
      });
    } else if (shiftsUpdatedAt && !state.shiftsUpdatedAt) {
      state = { ...state, shiftsUpdatedAt };
      saveNotificationState(userId, state);
    }
  }

  documents.forEach((doc) => {
    const prev = state.documents?.[doc.id];
    if (!prev) {
      items.push({
        id: `doc-${doc.id}`,
        type: "document",
        entityId: doc.id,
        title: t("notifNewDocument"),
        message: doc.title,
        href: "/board#documents",
        at: doc.publishedAt,
      });
      return;
    }

    if (prev.publishedAt !== doc.publishedAt) {
      items.push({
        id: `doc-${doc.id}-updated`,
        type: "document",
        entityId: doc.id,
        title: t("notifDocumentUpdated"),
        message: doc.title,
        href: "/board#documents",
        at: doc.publishedAt,
      });
    }
  });

  events.forEach((event) => {
    const id = event._id || event.id;
    if (!id) return;

    const prev = state.events?.[id];
    const updatedAt = event.updatedAt || event.createdAt;
    const title = event.title || event.name || t("notifEventDefault");

    if (!prev) {
      items.push({
        id: `event-${id}`,
        type: "event",
        entityId: id,
        title: t("notifNewEvent"),
        message: title,
        href: "/board#calendar",
        at: updatedAt,
      });
      return;
    }

    if (isNewer(updatedAt, prev.updatedAt)) {
      items.push({
        id: `event-${id}-updated`,
        type: "event",
        entityId: id,
        title: t("notifEventUpdated"),
        message: title,
        href: "/board#calendar",
        at: updatedAt,
      });
    }
  });

  items.sort(
    (a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime()
  );

  return { items, count: items.length, state, snapshot };
}

export function markNotificationItemRead(userId, item, snapshot) {
  if (!userId || !item || !snapshot) return;

  const state = loadNotificationState(userId);
  if (!state?.initialized) return;

  switch (item.type) {
    case "ticket": {
      const ticket = snapshot.tickets.find(
        (entry) => (entry._id || entry.id) === item.entityId
      );
      if (!ticket) return;
      state.tickets = state.tickets || {};
      state.tickets[item.entityId] = {
        status: ticket.status,
        updatedAt: ticket.updatedAt || ticket.createdAt || null,
      };
      break;
    }
    case "leave": {
      state.leave = state.leave || {};
      state.leave[item.leaveKey] = item.leaveStatus;
      break;
    }
    case "shift":
      state.shiftsUpdatedAt = snapshot.shiftsUpdatedAt || null;
      break;
    case "document": {
      const doc = snapshot.documents.find((entry) => entry.id === item.entityId);
      if (!doc) return;
      state.documents = state.documents || {};
      state.documents[item.entityId] = { publishedAt: doc.publishedAt };
      break;
    }
    case "event": {
      const event = snapshot.events.find(
        (entry) => (entry._id || entry.id) === item.entityId
      );
      if (!event) return;
      state.events = state.events || {};
      state.events[item.entityId] = {
        updatedAt: event.updatedAt || event.createdAt || null,
      };
      break;
    }
    default:
      return;
  }

  saveNotificationState(userId, state);
}

export function markAllNotificationsRead(userId, snapshot) {
  if (!userId) return;
  const baseline = createNotificationBaseline(snapshot);
  saveNotificationState(userId, baseline);
  return baseline;
}
