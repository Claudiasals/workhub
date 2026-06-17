import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTickets, updateTicketAsync } from "../../store/feature/ticketSlice";
import { fetchTicketInsightsRequest } from "../../api/aiApi";

import {
  ListMagnifyingGlassIcon,
  CalendarDotsIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";

import TicketAiInsightsPanel from "../../components/ticketing/TicketAiInsightsPanel";
import { DateRangePicker } from "react-date-range";
import { addDays } from "date-fns";

import {
  TicketAiLabels,
} from "../../components/ai/AiInsightPanel";
import TicketAiReplyAssistant from "../../components/ticketing/TicketAiReplyAssistant";
import TicketAssignmentPanel from "../../components/ticketing/TicketAssignmentPanel";

import bgLight from "../../assets/bg/bg.jpg";
import bgDark from "../../assets/bg/bgScuro.jpg";

import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import {
  getDisplayAiClassification,
  getTicketAiPriorityFilter,
  getTicketDepartmentLabelKey,
  hasValidAiClassification,
  sortTicketsByAiPriority,
} from "../../utils/ticketAiClassification";
import { analyzeTicketInsightsLocal } from "../../utils/ticketInsightsAnalyzer";
import { ticketInsightsFingerprint } from "../../utils/aiDataFingerprint";
import { useAiApiAutoRefresh } from "../../hooks/useAiApiAutoRefresh";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const demoUsers = [
  {
    _id: "demo-user-1",
    firstName: "Luigi",
    lastName: "Verdi",
    role: "magazziniere",
    email: "luigi.verdi@workhub.demo",
  },
  {
    _id: "demo-user-2",
    firstName: "Sara",
    lastName: "Bianchi",
    role: "specialist reparto it",
    email: "sara.bianchi@workhub.demo",
  },
  {
    _id: "demo-user-3",
    firstName: "Marco",
    lastName: "Rossi",
    role: "capo reparto",
    email: "marco.rossi@workhub.demo",
  },
];

const daysAgo = (days) => addDays(new Date(), -days).toISOString();

const demoTickets = [
  {
    _id: "demo-ticket-1",
    name: "Scanner magazzino non sincronizza",
    content:
      "Lo scanner della sede di Milano non aggiorna le giacenze dopo la lettura dei codici.",
    status: "open",
    user: demoUsers[0],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
    aiClassification: {
      priority: "alta",
      category: "tecnico",
      summary: "Scanner non sincronizza giacenze magazzino Milano",
      adminSuggestion: "Verificare connettività scanner e sincronizzazione API magazzino.",
      source: "heuristic",
      generatedAt: daysAgo(2),
    },
  },
  {
    _id: "demo-ticket-2",
    name: "Richiesta accesso report ordini",
    content:
      "Serve abilitare la visualizzazione del report ordini per il responsabile di reparto.",
    status: "closed",
    user: demoUsers[2],
    createdAt: daysAgo(5),
    updatedAt: daysAgo(3),
    aiClassification: {
      priority: "media",
      category: "ordine",
      summary: "Richiesta permessi report ordini",
      adminSuggestion: "Abilitare ruolo report ordini per il capo reparto.",
      source: "heuristic",
      generatedAt: daysAgo(5),
    },
  },
  {
    _id: "demo-ticket-3",
    name: "Errore caricamento allegato prodotto",
    content:
      "Durante il caricamento della scheda prodotto il file PDF resta in attesa e non viene salvato.",
    status: "open",
    user: demoUsers[1],
    createdAt: daysAgo(9),
    updatedAt: daysAgo(8),
    aiClassification: {
      priority: "bassa",
      category: "tecnico",
      summary: "Upload PDF prodotto bloccato in attesa",
      adminSuggestion: "Controllare dimensione PDF e timeout upload allegati.",
      source: "heuristic",
      generatedAt: daysAgo(9),
    },
  },
  {
    _id: "demo-ticket-4",
    name: "Richiesta informazioni orari punto vendita",
    content:
      "Un cliente chiede chiarimenti sugli orari di apertura del negozio di Roma.",
    status: "open",
    user: demoUsers[0],
    createdAt: daysAgo(14),
    updatedAt: daysAgo(12),
  },
  {
    _id: "demo-ticket-5",
    name: "Verifica scorte sotto soglia",
    content:
      "Alcuni prodotti risultano sotto soglia anche dopo il rifornimento registrato in magazzino.",
    status: "open",
    user: demoUsers[2],
    createdAt: daysAgo(20),
    updatedAt: daysAgo(18),
    aiClassification: {
      priority: "alta",
      category: "magazzino",
      summary: "Giacenze sotto soglia dopo rifornimento",
      adminSuggestion: "Riconciliare giacenze e verificare movimenti di magazzino recenti.",
      source: "heuristic",
      generatedAt: daysAgo(20),
    },
  },
];

const TicketPageAdmin = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  /* REDUX STATE */
  const tickets = useSelector((state) => state.tickets.tickets) || [];
  const status = useSelector((state) => state.tickets.status);
  const error = useSelector((state) => state.tickets.error);
  const token = useSelector((state) => state.auth.token);
  const isDemoMode = status === "succeeded" && tickets.length === 0;
  const [demoOverrides, setDemoOverrides] = useState({});
  const visibleTickets = useMemo(
    () =>
      isDemoMode
        ? demoTickets.map((ticket) =>
            demoOverrides[ticket._id] ? { ...ticket, ...demoOverrides[ticket._id] } : ticket
          )
        : tickets,
    [isDemoMode, tickets, demoOverrides]
  );

  /* LOCAL STATE */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [selectedAiPriority, setSelectedAiPriority] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("aperto");

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [highlightDate, setHighlightDate] = useState("");

  const itemRefs = useRef({});

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState("");
  const [ticketInsights, setTicketInsights] = useState(null);

  /* Local status map for optimistic UI updates */
  const [ticketStatus, setTicketStatus] = useState({});
  const [dateRangeTouched, setDateRangeTouched] = useState(false);

  const [dateRange, setDateRange] = useState([
    {
      startDate: addDays(new Date(), -30),
      endDate: new Date(),
      key: "selection",
    },
  ]);

  useEffect(() => {
    if (dateRangeTouched || !visibleTickets.length) return;

    const ticketDates = visibleTickets
      .map((ticket) => ticket.date || ticket.createdAt || ticket.updatedAt)
      .filter(Boolean)
      .map((date) => new Date(date))
      .filter((date) => !Number.isNaN(date.getTime()));

    if (!ticketDates.length) return;

    const startDate = new Date(Math.min(...ticketDates));
    const latestTicketDate = new Date(Math.max(...ticketDates));
    const today = new Date();
    const endDate = latestTicketDate > today ? latestTicketDate : today;

    setDateRange((prev) => {
      const current = prev[0];
      if (
        current?.startDate?.getTime() === startDate.getTime() &&
        current?.endDate?.getTime() === endDate.getTime()
      ) {
        return prev;
      }
      return [
        {
          startDate,
          endDate,
          key: "selection",
        },
      ];
    });
  }, [dateRangeTouched, visibleTickets]);

  /* INITIAL LOAD */
  useEffect(() => {
    if ((tickets?.length || 0) === 0 && status === "idle") {
      dispatch(fetchTickets());
    }
  }, [dispatch, tickets?.length, status]);

  /* NORMALIZE TICKET STATUS */
  useEffect(() => {
    if (!visibleTickets?.length) return;

    const map = {};
    visibleTickets.forEach((ticket) => {
      const id = ticket._id || ticket.id;
      let s = ticket.status || "open";
      if (s === "open") s = "aperto";
      if (s === "closed") s = "chiuso";
      map[id] = s;
    });

    setTicketStatus((prev) => {
      const prevKeys = Object.keys(prev);
      const mapKeys = Object.keys(map);
      if (
        prevKeys.length === mapKeys.length &&
        mapKeys.every((key) => prev[key] === map[key])
      ) {
        return prev;
      }
      return map;
    });
  }, [visibleTickets]);

  /* FILTERED TICKETS (periodo) */
  const baseFilteredTickets = useMemo(() => {
    const start = dateRange[0]?.startDate;
    const end = dateRange[0]?.endDate;

    return visibleTickets.filter((ticket) => {
      const rawDate = ticket.date || ticket.createdAt || ticket.updatedAt || new Date().toISOString();
      const d = new Date(rawDate);

      return (!start || d >= start) && (!end || d <= end);
    });
  }, [visibleTickets, dateRange]);

  const filteredTickets = useMemo(() => {
    let list = baseFilteredTickets;

    list = list.filter((ticket) => {
      const id = ticket._id || ticket.id;
      return (ticketStatus[id] || "aperto") === selectedStatusFilter;
    });

    if (selectedAiPriority) {
      list = list.filter(
        (ticket) => getTicketAiPriorityFilter(ticket) === selectedAiPriority
      );
    }

    return list;
  }, [baseFilteredTickets, selectedStatusFilter, selectedAiPriority, ticketStatus]);

  const loadTicketInsights = useCallback(async () => {
    if (isDemoMode || !token) return;

    const ticketSource = visibleTickets.length ? visibleTickets : tickets;
    if (!ticketSource.length && (status === "idle" || status === "loading")) {
      return;
    }

    setInsightsLoading(true);
    setInsightsError("");

    try {
      const data = await fetchTicketInsightsRequest(token);
      setTicketInsights(data);
    } catch {
      setInsightsError("");
    } finally {
      setInsightsLoading(false);
    }
  }, [isDemoMode, token, status, visibleTickets, tickets]);

  const ticketInsightsFp = useMemo(() => {
    const ticketSource = isDemoMode
      ? demoTickets
      : visibleTickets.length
        ? visibleTickets
        : tickets;
    return ticketInsightsFingerprint(ticketSource);
  }, [isDemoMode, demoTickets, visibleTickets, tickets]);

  useAiApiAutoRefresh({
    enabled: !isDemoMode && Boolean(token),
    dataReady: status !== "loading" && status !== "idle",
    fingerprint: ticketInsightsFp,
    onRefresh: loadTicketInsights,
  });

  useEffect(() => {
    if (isDemoMode) {
      setTicketInsights(analyzeTicketInsightsLocal(demoTickets));
      return;
    }
    if (visibleTickets.length) {
      setTicketInsights(analyzeTicketInsightsLocal(visibleTickets));
    }
  }, [isDemoMode, visibleTickets]);

  const urgentCount = useMemo(
    () =>
      baseFilteredTickets.filter(
        (ticket) => getTicketAiPriorityFilter(ticket) === "alta"
      ).length,
    [baseFilteredTickets]
  );

  const aiPriorityCounts = useMemo(() => {
    const counts = { alta: 0, media: 0, bassa: 0, none: 0 };
    baseFilteredTickets.forEach((ticket) => {
      const key = getTicketAiPriorityFilter(ticket);
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }, [baseFilteredTickets]);

  const ticketStatusCounts = useMemo(() => {
    const counts = { aperto: 0, chiuso: 0 };
    baseFilteredTickets.forEach((ticket) => {
      const id = ticket._id || ticket.id;
      const statusKey = ticketStatus[id] || "aperto";
      counts[statusKey] = (counts[statusKey] || 0) + 1;
    });
    return counts;
  }, [baseFilteredTickets, ticketStatus]);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" });

  const dateRangeLabel = useMemo(() => {
    const start = dateRange[0]?.startDate;
    const end = dateRange[0]?.endDate;
    if (!start || !end) return t("selezionaIntervalloData");
    return `${formatDate(start)} – ${formatDate(end)}`;
  }, [dateRange, t]);

  const selectedTicketDetails = useMemo(() => {
    if (!selectedTicket) return null;

    const ticketId = selectedTicket._id || selectedTicket.id;
    const ticketStatusValue = ticketStatus[ticketId];
    const displayClassification = getDisplayAiClassification(selectedTicket);

    return {
      ticketId,
      isTicketClosed: ticketStatusValue === "chiuso",
      statusLabel: ticketStatusValue === "chiuso" ? t("chiuso") : t("aperto"),
      displayClassification,
      requesterName: [
        selectedTicket.user?.nome ||
          selectedTicket.user?.firstName ||
          selectedTicket.user?.name ||
          "",
        selectedTicket.user?.cognome || selectedTicket.user?.lastName || "",
      ]
        .filter(Boolean)
        .join(" "),
      requesterRole: selectedTicket.user?.ruolo || selectedTicket.user?.role || "",
      requesterEmail: selectedTicket.user?.email || "",
      ticketDate: formatDate(
        selectedTicket.date ||
          selectedTicket.createdAt ||
          selectedTicket.updatedAt
      ),
      hasAiInsights: hasValidAiClassification(selectedTicket),
    };
  }, [selectedTicket, ticketStatus, t]);

  /* RENDER */
  return (
    <div className="page-section-stack h-full min-w-0 w-full">

      {/* CALENDAR MODAL */}
      {calendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="app-modal-backdrop absolute inset-0"
            onClick={() => setCalendarOpen(false)}
          />
          <div
            className="app-modal-panel relative p-6 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2
                className="flex items-center gap-2 text-lg font-bold"
                style={{ color: theme === "dark" ? "#ffffff" : "#090c64" }}
              >
                <CalendarDotsIcon size={26} weight="duotone" />
                {t("selezionaIntervalloData")}
              </h2>
              <button
                onClick={() => setCalendarOpen(false)}
                className="font-bold text-2xl leading-none"
                style={{ color: theme === "dark" ? "#d1d5db" : "#6b7280" }}
                type="button"
              >
                ✕
              </button>
            </div>

            <div
              className="border rounded-xl overflow-hidden"
              style={{ borderColor: theme === "dark" ? "#374151" : "#e5e7eb" }}
            >
              <DateRangePicker
                onChange={(item) => {
                  setDateRange([item.selection]);
                  setDateRangeTouched(true);
                  setHighlightDate("");
                }}
                showSelectionPreview
                moveRangeOnFirstSelection={false}
                months={2}
                ranges={dateRange}
                direction="horizontal"
              />
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setCalendarOpen(false)}
                className="custom-button"
                type="button"
              >
                Applica
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ERROR BANNER */}
      {error && !isDemoMode && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start justify-between">
          <div>
            <h3 className="font-bold">Errore nel caricamento</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
          <button
            onClick={() => dispatch(fetchTickets())}
            className="ml-4 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            type="button"
          >
            {t("riprova")}
          </button>
        </div>
      )}

      <TicketAiInsightsPanel
        data={ticketInsights}
        loading={insightsLoading}
        error={insightsError}
        source={ticketInsights?.source}
      />

      {/* Lista ticket */}
      <div className="w-full min-w-0 app-surface p-4 ticket-page-list">
        <div className="dashboard-card-header ticket-page-list__header">
          <div className="ticket-page-list__lead">
            <h2
              className={`flex items-center gap-2 text-lg font-bold shrink-0 ${
                isDark ? "text-white" : "text-[#090c64]"
              }`}
            >
              <ListMagnifyingGlassIcon
                size={24}
                weight="duotone"
                className="preserve-icon-size shrink-0"
              />
              {t("listaTicket")}
            </h2>

            <button
              type="button"
              onClick={() => setCalendarOpen(true)}
              className="calendar-view-btn sales-trend-filter-btn ticket-page-list__date-btn"
              aria-label={t("selezionaIntervalloData")}
            >
              <CalendarDotsIcon size={16} weight="duotone" className="shrink-0" />
              <span className="ticket-page-list__date-label">{dateRangeLabel}</span>
            </button>
          </div>

          <div
            className="sales-trend-filters ticket-status-filters"
            role="group"
            aria-label={`${t("aperti")} / ${t("chiusi")}`}
          >
            {[
              { key: "aperto", label: t("aperti"), count: ticketStatusCounts.aperto },
              { key: "chiuso", label: t("chiusi"), count: ticketStatusCounts.chiuso },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedStatusFilter(key)}
                className={`calendar-view-btn sales-trend-filter-btn${
                  selectedStatusFilter === key ? " active" : ""
                }`}
                aria-pressed={selectedStatusFilter === key}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div
            className="sales-trend-filters ticket-priority-filters"
            role="group"
            aria-label={t("aiFilterAllPriorities")}
          >
            {[
              { key: "", label: t("aiFilterAllPriorities"), count: baseFilteredTickets.length },
              { key: "alta", label: t("aiPriorityAlta"), count: aiPriorityCounts.alta },
              { key: "media", label: t("aiPriorityMedia"), count: aiPriorityCounts.media },
              { key: "bassa", label: t("aiPriorityBassa"), count: aiPriorityCounts.bassa },
              { key: "none", label: t("aiUnclassified"), count: aiPriorityCounts.none },
            ].map(({ key, label, count }) => (
              <button
                key={key || "all"}
                type="button"
                onClick={() => setSelectedAiPriority(key)}
                className={`calendar-view-btn sales-trend-filter-btn${
                  selectedAiPriority === key ? " active" : ""
                }`}
                aria-pressed={selectedAiPriority === key}
              >
                {label} ({count})
              </button>
            ))}
          </div>
        </div>

        <p
          className={`ticket-page-list__hint text-xs ${
            isDark ? "text-white/70" : "text-gray-600"
          }`}
        >
          {t("aiTicketListAiHint")}
          {selectedAiPriority === "none" && (
            <span className="block mt-1 opacity-90">{t("aiUnclassifiedHint")}</span>
          )}
          {urgentCount > 0 && (
            <span className="font-bold text-red-600 dark:text-red-300">
              {" "}
              · {urgentCount} {t("aiPriorityAlta").toLowerCase()}
            </span>
          )}
        </p>

        <div className="ticket-page-list__items flex flex-col gap-2">
            {filteredTickets
              .slice()
              .sort(sortTicketsByAiPriority)
              .map((ticket) => {
                const id = ticket._id || ticket.id;

                const raw = ticket.date || ticket.createdAt || ticket.updatedAt || "";
                const isHighlighted = raw.split("T")[0] === highlightDate;

                const displayClassification = getDisplayAiClassification(ticket);

                const userName = [
                  ticket.user?.nome || ticket.user?.firstName || ticket.user?.name || "",
                  ticket.user?.cognome || ticket.user?.lastName || "",
                ]
                  .filter(Boolean)
                  .join(" ");

                return (
                  <div
                    key={id}
                    ref={(el) => (itemRefs.current[id] = el)}
                    className={`ticket-list-card ticket-list-card--admin rounded-lg cursor-pointer transition hover:shadow-md ${
                      isHighlighted ? "ring-2 ring-blue-100 dark:ring-white/30" : ""
                    }`}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setHighlightDate(raw.split("T")[0] || "");
                      setDrawerOpen(true);
                    }}
                  >
                    <div className="ticket-list-card__primary">
                      <p
                        className={`ticket-list-card__title ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {ticket.title || ticket.name}
                      </p>
                      {(ticket.description || ticket.content) && (
                        <p
                          className={`ticket-list-card__excerpt ${
                            isDark ? "text-white/80" : "text-gray-700"
                          }`}
                        >
                          {ticket.description || ticket.content}
                        </p>
                      )}
                    </div>

                    <div className="ticket-list-card__ai">
                      <TicketAiLabels
                        classification={displayClassification}
                        compact
                      />
                      {displayClassification?.summary && (
                        <p className="ticket-list-card__summary">
                          {displayClassification.summary}
                        </p>
                      )}
                      {ticket.assignedDepartment && (
                        <span className="business-overview-area business-overview-area--department text-xs">
                          {t("ticketAssignedShort")}:{" "}
                          {t(getTicketDepartmentLabelKey(ticket.assignedDepartment))}
                        </span>
                      )}
                    </div>

                    <div
                      className={`ticket-list-card__meta ${
                        isDark ? "text-white/70" : "text-gray-600"
                      }`}
                    >
                      {userName && (
                        <span className="ticket-list-card__user">{userName}</span>
                      )}
                      <span className="ticket-list-card__date">
                        {formatDate(ticket.date || ticket.createdAt || ticket.updatedAt)}
                      </span>
                    </div>

                    <div className="ticket-list-card__actions">
                      <button
                        type="button"
                        className="custom-button text-xs px-3 py-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicket(ticket);
                          setHighlightDate(raw.split("T")[0] || "");
                          setDrawerOpen(true);
                        }}
                      >
                        {t("gestisci")}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && (
        <div className="drawer-root">
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />

          <aside
            className="drawer-panel drawer-panel--ticket-detail"
            style={{ "--drawer-bg-image": `url(${theme === "light" ? bgLight : bgDark})` }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-drawer-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="drawer-header">
              <h2 className="drawer-title">{t("dettagliTicket")}</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                className="custom-button"
                type="button"
              >
                {t("chiudi")}
              </button>
            </header>

            {selectedTicket && selectedTicketDetails && (
                <div className="ticket-drawer-body">
                  <header className="ticket-drawer-head">
                    <div className="ticket-drawer-head__top">
                      <h3 id="ticket-drawer-title" className="ticket-drawer-title">
                        {selectedTicket.title || selectedTicket.name}
                      </h3>
                      <span
                        className={`ticket-status-pill ticket-drawer-status ${
                          selectedTicketDetails.isTicketClosed ? "is-closed" : "is-open"
                        }`}
                      >
                        {selectedTicketDetails.statusLabel}
                      </span>
                    </div>

                    <div className="ticket-drawer-meta">
                      <span className="ticket-drawer-meta__date">
                        <CalendarDotsIcon size={16} weight="duotone" />
                        {selectedTicketDetails.ticketDate}
                      </span>
                      {selectedTicketDetails.hasAiInsights && (
                        <TicketAiLabels
                          classification={selectedTicketDetails.displayClassification}
                          compact
                        />
                      )}
                    </div>
                  </header>

                  <section className="ticket-drawer-section">
                    <h4 className="ticket-drawer-section__label">{t("ticketRequester")}</h4>
                    <div className="ticket-drawer-requester">
                      <UserCircleIcon
                        size={40}
                        color={isDark ? "white" : "#090c64"}
                        weight="duotone"
                        className="ticket-drawer-requester__avatar shrink-0"
                      />
                      <div className="ticket-drawer-requester__info">
                        {selectedTicketDetails.requesterName && (
                          <span className="ticket-drawer-requester__name">
                            {selectedTicketDetails.requesterName}
                          </span>
                        )}
                        {selectedTicketDetails.requesterRole && (
                          <span className="ticket-drawer-requester__meta">
                            {selectedTicketDetails.requesterRole}
                          </span>
                        )}
                        {selectedTicketDetails.requesterEmail && (
                          <span className="ticket-drawer-requester__meta ticket-drawer-requester__email">
                            {selectedTicketDetails.requesterEmail}
                          </span>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="ticket-drawer-section">
                    <h4 className="ticket-drawer-section__label">{t("descrizione")}</h4>
                    <p className="ticket-drawer-description-text">
                      {selectedTicket.description || selectedTicket.content}
                    </p>
                  </section>

                  <TicketAssignmentPanel
                    ticket={selectedTicket}
                    isDemoMode={isDemoMode}
                    onAssigned={(updated) => {
                      setSelectedTicket(updated);
                      if (isDemoMode) {
                        const id = updated._id || updated.id;
                        setDemoOverrides((prev) => ({
                          ...prev,
                          [id]: {
                            assignedDepartment: updated.assignedDepartment,
                          },
                        }));
                      }
                    }}
                  />

                  <TicketAiReplyAssistant
                    ticket={selectedTicket}
                    token={token}
                    isDemoMode={isDemoMode}
                    onTicketUpdated={(updated) => {
                      setSelectedTicket(updated);
                      const id = updated._id || updated.id;
                      if (!id) return;

                      if (isDemoMode || String(id).startsWith("demo-ticket-")) {
                        setDemoOverrides((prev) => ({
                          ...prev,
                          [id]: {
                            ...prev[id],
                            adminReply: updated.adminReply,
                            status: updated.status ?? prev[id]?.status,
                          },
                        }));
                      }

                      if (updated.status) {
                        setTicketStatus((s) => ({
                          ...s,
                          [id]: updated.status === "closed" ? "chiuso" : "aperto",
                        }));
                      }
                    }}
                    onReplySent={({ closed }) => {
                      if (!isDemoMode) {
                        dispatch(fetchTickets());
                      }
                      if (closed) {
                        setDrawerOpen(false);
                        setSelectedTicket(null);
                      }
                    }}
                  />
                </div>
              )}
          </aside>
        </div>
      )}
    </div>
  );
};

export default TicketPageAdmin;
