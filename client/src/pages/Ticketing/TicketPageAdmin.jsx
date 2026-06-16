import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTickets, updateTicketAsync } from "../../store/feature/ticketSlice";
import { fetchTicketInsightsRequest } from "../../api/aiApi";

import {
  ListMagnifyingGlassIcon,
  CalendarDotsIcon,
  UserListIcon,
  CircleIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";

import TicketAiInsightsPanel from "../../components/ticketing/TicketAiInsightsPanel";
import { DateRangePicker } from "react-date-range";
import { addDays } from "date-fns";

import {
  TicketAiLabels,
  TicketClassificationCard,
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
  const users = useSelector((state) => state.tickets.users) || [];
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
  const visibleUsers = isDemoMode ? demoUsers : users;

  /* LOCAL STATE */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [selectedUser, setSelectedUser] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [selectedAiPriority, setSelectedAiPriority] = useState("");

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
      if (s === "closed") s = "risolto";
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

  /* FILTERED TICKETS (periodo, utente, stato) */
  const baseFilteredTickets = useMemo(() => {
    const start = dateRange[0]?.startDate;
    const end = dateRange[0]?.endDate;

    return visibleTickets.filter((ticket) => {
      const rawDate = ticket.date || ticket.createdAt || ticket.updatedAt || new Date().toISOString();
      const d = new Date(rawDate);

      const matchDate = (!start || d >= start) && (!end || d <= end);

      const uid = ticket.user?._id || ticket.user?.id || ticket.user;
      const matchUser = !selectedUser || uid === selectedUser;

      const tid = ticket._id || ticket.id;
      const matchStatus = !selectedStatus || ticketStatus[tid] === selectedStatus;

      return matchDate && matchUser && matchStatus;
    });
  }, [visibleTickets, dateRange, selectedUser, selectedStatus, ticketStatus]);

  const filteredTickets = useMemo(() => {
    if (!selectedAiPriority) return baseFilteredTickets;

    return baseFilteredTickets.filter(
      (ticket) => getTicketAiPriorityFilter(ticket) === selectedAiPriority
    );
  }, [baseFilteredTickets, selectedAiPriority]);

  const loadTicketInsights = useCallback(async () => {
    if (status === "idle" || status === "loading") return;

    setInsightsLoading(true);
    setInsightsError("");
    try {
      if (isDemoMode) {
        setTicketInsights(analyzeTicketInsightsLocal(demoTickets));
      } else if (token) {
        const data = await fetchTicketInsightsRequest(token);
        setTicketInsights(data);
      }
    } catch (err) {
      setInsightsError(err.message || t("aiError"));
    } finally {
      setInsightsLoading(false);
    }
  }, [isDemoMode, token, t, status]);

  useEffect(() => {
    loadTicketInsights();
  }, [loadTicketInsights]);

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

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" });

  /* RENDER */
  return (
    <div className="flex flex-col gap-4 h-full min-w-0 w-full">

      {/* Barra filtri: periodo, utente, stato */}
      <nav className="app-surface ticket-admin-filters p-4 min-w-0">
        <div className="ticket-admin-filters__row">
          <div className="ticket-admin-filters__title">
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight">{t("ticket")}</h1>
              <p className="ticket-admin-filters__desc">{t("ticketFiltersDesc")}</p>
            </div>
          </div>

          <div className="ticket-admin-filters__controls">
            <button
              onClick={() => setCalendarOpen(true)}
              className="custom-button ticket-admin-filters__date-btn"
              type="button"
            >
              <CalendarDotsIcon size={20} weight="duotone" />
              {t("selezionaIntervalloData")}
            </button>

            <div className="ticket-admin-filters__search">
              <UserListIcon
                size={20}
                weight="duotone"
                color={theme === "dark" ? "white" : "#090c64"}
                className="ticket-admin-filters__search-icon"
              />

              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={t("cercaUtente")}
                className="ticket-user-search !w-full min-w-0"
              />

              {userSearch && (
                <button
                  className="ticket-admin-filters__clear"
                  onClick={() => {
                    setUserSearch("");
                    setSelectedUser("");
                  }}
                  type="button"
                  aria-label={t("annulla")}
                >
                  ✕
                </button>
              )}

              {userSearch && (
                <div
                  className={`ticket-admin-filters__dropdown ${
                    isDark
                      ? "bg-[#1a1a2e] text-white border border-white/20"
                      : "bg-white border border-[#090c64]/10"
                  }`}
                >
                  <div
                    onClick={() => {
                      setSelectedUser("");
                      setUserSearch("");
                    }}
                    className={`ticket-admin-filters__dropdown-item border-b ${
                      isDark
                        ? "border-white/10 hover:bg-white/10"
                        : "hover:bg-blue-50"
                    }`}
                  >
                    {t("tuttiUtenti")}
                  </div>

                  {visibleUsers
                    .filter((u) => {
                      const first = u.nome || u.firstName || u.name || "";
                      const last = u.cognome || u.lastName || "";
                      const full = `${first} ${last}`.toLowerCase();
                      return full.includes(userSearch.toLowerCase());
                    })
                    .map((u) => {
                      const userId = u._id || u.id;
                      const first = u.nome || u.firstName || u.name || "";
                      const last = u.cognome || u.lastName || "";

                      return (
                        <div
                          key={userId}
                          onClick={() => {
                            setSelectedUser(userId);
                            setUserSearch(`${first} ${last}`);
                          }}
                          className={`ticket-admin-filters__dropdown-item ${
                            isDark ? "hover:bg-white/10" : "hover:bg-blue-50"
                          }`}
                        >
                          <UserCircleIcon
                            size={22}
                            weight="duotone"
                            color={theme === "dark" ? "white" : "#090c64"}
                          />
                          <span className="text-sm truncate">
                            {first} {last}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="ticket-admin-filters__status">
              <CircleIcon
                size={20}
                weight="duotone"
                color={theme === "dark" ? "white" : "#090c64"}
                className="ticket-admin-filters__status-icon"
              />

              <button
                onClick={() => setStatusDropdownOpen((v) => !v)}
                className={`ticket-admin-filters__status-btn ${
                  isDark
                    ? "border-white/25 bg-white/10 text-white"
                    : "border-gray-300 bg-white/70 text-[#090c64]"
                }`}
                type="button"
              >
                {selectedStatus === "" && t("tutti")}
                {selectedStatus === "aperto" && t("aperti")}
                {selectedStatus === "risolto" && t("risolti")}
              </button>

              <span className="ticket-admin-filters__status-caret">
                {statusDropdownOpen ? "▲" : "▼"}
              </span>

              {statusDropdownOpen && (
                <div
                  className={`ticket-admin-filters__dropdown ${
                    isDark
                      ? "bg-[#1a1a2e] text-white border border-white/20"
                      : "bg-white border border-[#090c64]/10"
                  }`}
                >
                  <div
                    onClick={() => {
                      setSelectedStatus("");
                      setStatusDropdownOpen(false);
                    }}
                    className={`ticket-admin-filters__dropdown-item ${
                      isDark ? "hover:bg-white/10" : "hover:bg-blue-50"
                    }`}
                  >
                    <CircleIcon
                      size={16}
                      weight="duotone"
                      color={isDark ? "white" : "#090c64"}
                    />
                    {t("tutti")}
                  </div>

                  <div
                    onClick={() => {
                      setSelectedStatus("aperto");
                      setStatusDropdownOpen(false);
                    }}
                    className={`ticket-admin-filters__dropdown-item ${
                      isDark ? "hover:bg-white/10" : "hover:bg-blue-50"
                    }`}
                  >
                    <CircleIcon size={16} weight="fill" color="#3B82F6" />
                    {t("aperti")}
                  </div>

                  <div
                    onClick={() => {
                      setSelectedStatus("risolto");
                      setStatusDropdownOpen(false);
                    }}
                    className={`ticket-admin-filters__dropdown-item ${
                      isDark ? "hover:bg-white/10" : "hover:bg-blue-50"
                    }`}
                  >
                    <CircleIcon size={16} weight="fill" color="#F59E0B" />
                    {t("risolti")}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

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

      <div className="ticket-ai-insights-wrap min-w-0 w-full shrink-0">
        <TicketAiInsightsPanel
          data={ticketInsights}
          loading={insightsLoading}
          error={insightsError}
          onRefresh={loadTicketInsights}
          source={ticketInsights?.source}
        />
      </div>

      {/* Lista ticket */}
      <div className="w-full min-w-0 app-surface p-6">
          <h2
            className={`mb-4 flex items-center gap-2 text-lg font-bold ${
              isDark ? "text-white" : "text-[#090c64]"
            }`}
          >
            <ListMagnifyingGlassIcon size={24} weight="duotone" className="preserve-icon-size shrink-0" />
            {t("listaTicket")}
          </h2>

          <p className={`text-xs mb-3 ${isDark ? "text-white/70" : "text-gray-600"}`}>
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

          <div className="ticket-ai-priority-filters">
            {[
              { key: "", label: t("aiFilterAllPriorities"), count: baseFilteredTickets.length },
              { key: "alta", label: t("aiPriorityAlta"), urgent: true, count: aiPriorityCounts.alta },
              { key: "media", label: t("aiPriorityMedia"), count: aiPriorityCounts.media },
              { key: "bassa", label: t("aiPriorityBassa"), count: aiPriorityCounts.bassa },
              { key: "none", label: t("aiUnclassified"), count: aiPriorityCounts.none },
            ].map(({ key, label, urgent, count }) => (
              <button
                key={key || "all"}
                type="button"
                onClick={() => setSelectedAiPriority(key)}
                className={`ticket-ai-priority-filters__btn${
                  selectedAiPriority === key ? " is-active" : ""
                }${urgent ? " ticket-ai-priority-filters__btn--urgent" : ""}`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            {filteredTickets
              .slice()
              .sort(sortTicketsByAiPriority)
              .map((ticket) => {
                const id = ticket._id || ticket.id;
                const s = ticketStatus[id];

                const raw = ticket.date || ticket.createdAt || ticket.updatedAt || "";
                const isHighlighted = raw.split("T")[0] === highlightDate;

                const statusLabel =
                  s === "risolto" ? t("risolti") : t("aperti");
                const isUrgent = getTicketAiPriorityFilter(ticket) === "alta";
                const displayClassification = getDisplayAiClassification(ticket);

                return (
                  <div
                    key={id}
                    ref={(el) => (itemRefs.current[id] = el)}
                    className={`ticket-list-card p-3 rounded-lg flex justify-between items-start cursor-pointer transition hover:shadow-md ${
                      isHighlighted ? "ring-2 ring-blue-100 dark:ring-white/30" : ""
                    }${isUrgent ? " ticket-list-card--ai-urgent" : ""}`}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setHighlightDate(raw.split("T")[0] || "");
                      setDrawerOpen(true);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <div
                          className={`text-sm font-semibold truncate ${
                            isDark ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {ticket.title || ticket.name}
                        </div>
                      </div>

                      <TicketAiLabels
                        classification={displayClassification}
                        showSummary
                      />

                      {ticket.assignedDepartment && (
                        <span className="ticket-ai-label ticket-ai-label--category ai-category-badge text-xs mt-1">
                          {t("ticketAssignedShort")}:{" "}
                          {t(getTicketDepartmentLabelKey(ticket.assignedDepartment))}
                        </span>
                      )}

                      <div
                        className={`text-xs mt-1.5 ${
                          isDark ? "text-white/70" : "text-gray-600"
                        }`}
                      >
                        {(ticket.user?.nome || ticket.user?.firstName || ticket.user?.name || "")}{" "}
                        {(ticket.user?.cognome || ticket.user?.lastName || "")} •{" "}
                        {formatDate(ticket.date || ticket.createdAt || ticket.updatedAt)}
                      </div>
                      {(ticket.description || ticket.content) && (
                        <p
                          className={`text-xs mt-1 line-clamp-2 ${
                            isDark ? "text-white/80" : "text-gray-700"
                          }`}
                        >
                          {ticket.description || ticket.content}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2 ml-3">
                      <span
                        className={`ticket-status-pill text-xs px-3 py-1 rounded-lg font-semibold shrink-0 ${
                          s === "risolto" ? "is-closed" : "is-open"
                        }`}
                      >
                        {statusLabel}
                      </span>
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
        <div className="fixed inset-0 z-50">
          <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />

          <aside
            className="drawer-panel"
            style={{ "--drawer-bg-image": `url(${theme === "light" ? bgLight : bgDark})` }}
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="sticky top-0 z-10 border-b border-white/60 px-6 py-4 flex items-center justify-between">
              <h2
                className={`text-lg font-bold ${
                  isDark ? "text-white" : "text-[#090c64]"
                }`}
              >
                {t("dettagliTicket")}
              </h2>
              <button onClick={() => setDrawerOpen(false)} className="custom-button" type="button">
                {t("chiudi")}
              </button>
            </header>

            <div
              className={`p-6 text-[15px] leading-relaxed ${
                isDark ? "text-white" : "text-[#090c64]"
              }`}
            >
              {selectedTicket && (
                <>
                  <div
                    className={`flex flex-col gap-3 mb-4 p-2 rounded-xl border ${
                      isDark
                        ? "bg-white/10 border-white/20"
                        : "bg-gray-50 border-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <UserCircleIcon
                        size={48}
                        color={isDark ? "white" : "#090c64"}
                        weight="duotone"
                      />
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold ${
                            isDark ? "text-white" : "text-gray-800"
                          }`}
                        >
                          {(selectedTicket.user?.nome || selectedTicket.user?.firstName || selectedTicket.user?.name || "")}{" "}
                          {(selectedTicket.user?.cognome || selectedTicket.user?.lastName || "")}
                        </span>
                        <span
                          className={`text-sm ${
                            isDark ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {selectedTicket.user?.ruolo || selectedTicket.user?.role || ""}
                        </span>
                        <span
                          className={`text-sm ${
                            isDark ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {selectedTicket.user?.email || ""}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`mt-2 p-2 rounded-lg border ${
                        isDark
                          ? "bg-white/10 border-white/20"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <span
                        className={`font-semibold ${
                          isDark ? "text-white" : "text-gray-800"
                        }`}
                      >
                        {t("descrizione")}:
                      </span>
                      <p
                        className={`text-sm mt-1 ${
                          isDark ? "text-white/80" : "text-gray-700"
                        }`}
                      >
                        {selectedTicket.description || selectedTicket.content}
                      </p>
                    </div>

                    {hasValidAiClassification(selectedTicket) && (
                      <div className="mt-2">
                        <p className="text-xs font-bold mb-2 opacity-80">{t("aiTicketInsights")}</p>
                        <TicketClassificationCard
                          classification={getDisplayAiClassification(selectedTicket)}
                        />
                      </div>
                    )}

                    <TicketAssignmentPanel
                      ticket={selectedTicket}
                      isDemoMode={isDemoMode}
                      onAssigned={(updated) => {
                        setSelectedTicket(updated);
                        if (isDemoMode) {
                          const id = updated._id || updated.id;
                          setDemoOverrides((prev) => ({
                            ...prev,
                            [id]: { assignedDepartment: updated.assignedDepartment },
                          }));
                        }
                      }}
                    />
                  </div>

                  <TicketAiReplyAssistant
                    ticket={selectedTicket}
                    token={token}
                    isDemoMode={isDemoMode}
                  />

                  <div className="flex flex-col gap-2 mb-4 mt-4">
                    <button
                      type="button"
                      className="ticket-status-btn ticket-status-btn-open"
                      onClick={async () => {
                        const id = selectedTicket._id || selectedTicket.id;
                        if (!id) return;

                        setTicketStatus((s) => ({ ...s, [id]: "aperto" }));

                        try {
                          if (!String(id).startsWith("demo-ticket-")) {
                            await dispatch(updateTicketAsync({ id, payload: { status: "open" } })).unwrap();
                            dispatch(fetchTickets());
                          }
                        } catch (err) {
                          setTicketStatus((s) => ({ ...s, [id]: "risolto" }));
                          console.error("Update ticket failed", err);
                        }
                      }}
                    >
                      {t("aperto")}
                    </button>

                    <button
                      type="button"
                      className="ticket-status-btn ticket-status-btn-resolved"
                      onClick={async () => {
                        const id = selectedTicket._id || selectedTicket.id;
                        if (!id) return;

                        setTicketStatus((s) => ({ ...s, [id]: "risolto" }));

                        try {
                          if (!String(id).startsWith("demo-ticket-")) {
                            await dispatch(updateTicketAsync({ id, payload: { status: "closed" } })).unwrap();
                            dispatch(fetchTickets());
                          }
                          setDrawerOpen(false);
                          setSelectedTicket(null);
                        } catch (err) {
                          setTicketStatus((s) => ({ ...s, [id]: "aperto" }));
                          console.error("Update ticket failed", err);
                        }
                      }}
                    >
                      {t("risolto")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default TicketPageAdmin;
