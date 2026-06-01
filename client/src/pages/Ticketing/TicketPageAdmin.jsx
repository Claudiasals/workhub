import { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchTickets, updateTicketAsync } from "../../store/feature/ticketSlice";

import {
  ListMagnifyingGlassIcon,
  PencilIcon,
  CalendarDotsIcon,
  UserListIcon,
  CircleIcon,
  UserCircleIcon,
} from "@phosphor-icons/react";

import { LineChart } from "@mui/x-charts/LineChart";
import { DateRangePicker } from "react-date-range";
import { addDays } from "date-fns";

import bgLight from "../../assets/bg/bg.jpg";
import bgDark from "../../assets/bg/bgScuro.jpg";

import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

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
  },
  {
    _id: "demo-ticket-4",
    name: "Aggiornare priorita bacheca",
    content:
      "La bacheca deve mostrare in alto gli avvisi piu recenti per il team operativo.",
    status: "closed",
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
  },
];

const TicketPageAdmin = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const chartTextColor = isDark ? "#ffffff" : "#090c64";

  /* REDUX STATE */
  const tickets = useSelector((state) => state.tickets.tickets) || [];
  const users = useSelector((state) => state.tickets.users) || [];
  const status = useSelector((state) => state.tickets.status);
  const error = useSelector((state) => state.tickets.error);
  const isDemoMode = tickets.length === 0 && status !== "loading";
  const visibleTickets = isDemoMode ? demoTickets : tickets;
  const visibleUsers = isDemoMode ? demoUsers : users;

  /* LOCAL STATE */
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const [selectedUser, setSelectedUser] = useState("");
  const [userSearch, setUserSearch] = useState("");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [highlightDate, setHighlightDate] = useState("");

  const itemRefs = useRef({});

  /* Local status map for optimistic UI updates */
  const [ticketStatus, setTicketStatus] = useState({});
  const [hiddenLines, setHiddenLines] = useState([]);
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

    setDateRange([
      {
        startDate,
        endDate,
        key: "selection",
      },
    ]);
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

    setTicketStatus(map);
  }, [visibleTickets]);

  /* FILTERED TICKETS */
  const filteredTickets = useMemo(() => {
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

  /* CHART DATA */
  const chartData = useMemo(() => {
    const grouped = {};

    filteredTickets.forEach((ticket) => {
      const rawDate = ticket.date || ticket.createdAt || ticket.updatedAt || new Date().toISOString();
      const key = rawDate.split("T")[0];

      if (!grouped[key]) {
        grouped[key] = { date: key, aperti: 0, risolti: 0, totale: 0 };
      }

      const id = ticket._id || ticket.id;
      const s = ticketStatus[id];

      if (s === "aperto") grouped[key].aperti++;
      if (s === "risolto") grouped[key].risolti++;

      grouped[key].totale++;
    });

    return Object.values(grouped);
  }, [filteredTickets, ticketStatus]);

  const totals = useMemo(() => {
    return chartData.reduce(
      (acc, d) => {
        acc.aperti += d.aperti;
        acc.risolti += d.risolti;
        acc.totale += d.totale;
        return acc;
      },
      { aperti: 0, risolti: 0, totale: 0 }
    );
  }, [chartData]);

  const toggleLine = (key) => {
    setHiddenLines((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const formatDate = (d) =>
    new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "short" });

  /* RENDER */
  return (
    <div className="flex flex-col gap-6 h-full">

      {/* TOOLBAR (SINGLE ROW) */}
      <nav className="app-surface p-4">
        <div className="flex items-center justify-between gap-6">

          {/* LEFT: title */}
          <div className="flex items-center gap-3">
            <ListMagnifyingGlassIcon
              size={24}
              weight="duotone"
              color={theme === "dark" ? "white" : "#090c64"}
              className="preserve-icon-size shrink-0"
            />
            <h1 className="text-lg font-bold">{t("ticket")}</h1>
          </div>

          {/* RIGHT: filters */}
          <div className="flex items-center gap-4">

            {/* Calendar */}
            <button
              onClick={() => setCalendarOpen(true)}
              className="custom-button flex items-center gap-2"
              type="button"
            >
              <CalendarDotsIcon size={20} weight="duotone" />
              <span className="hidden lg:inline">{t("selezionaIntervalloData")}</span>
              <span className="lg:hidden">Date</span>
            </button>

            {/* User search */}
            <div className="relative w-64">
              <UserListIcon
                size={20}
                weight="duotone"
                color={theme === "dark" ? "white" : "#090c64"}
                className="absolute left-3 top-1/2 -translate-y-1/2"
              />

              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={t("cercaUtente")}
                className="ticket-user-search"
              />

              {userSearch && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => {
                    setUserSearch("");
                    setSelectedUser("");
                  }}
                  type="button"
                >
                  ✕
                </button>
              )}

              {/* Dropdown results */}
                  {userSearch && (
                <div
                  className={`absolute top-full mt-1 w-full rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto ${
                    isDark
                      ? "bg-[#1a1a2e] text-white border border-white/20"
                      : "bg-white"
                  }`}
                >
                  <div
                    onClick={() => {
                      setSelectedUser("");
                      setUserSearch("");
                    }}
                    className={`px-3 py-2 cursor-pointer border-b ${
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
                          className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
                            isDark ? "hover:bg-white/10" : "hover:bg-blue-50"
                          }`}
                        >
                          <UserCircleIcon
                            size={22}
                            weight="duotone"
                            color={theme === "dark" ? "white" : "#090c64"}
                          />
                          <span className="text-sm">{first} {last}</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Status filter */}
            <div className="relative w-40">
              <CircleIcon
                size={20}
                weight="duotone"
                color={theme === "dark" ? "white" : "#090c64"}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />

              <button
                onClick={() => setStatusDropdownOpen((v) => !v)}
                className={`pl-10 pr-6 py-2 w-full rounded-lg border text-left ${
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

              <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                {statusDropdownOpen ? "▲" : "▼"}
              </span>

              {statusDropdownOpen && (
                <div
                  className={`absolute top-full mt-1 w-full rounded-xl shadow-lg z-50 overflow-hidden ${
                    isDark
                      ? "bg-[#1a1a2e] text-white border border-white/20"
                      : "bg-white"
                  }`}
                >
                  <div
                    onClick={() => {
                      setSelectedStatus("");
                      setStatusDropdownOpen(false);
                    }}
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
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
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
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
                    className={`px-3 py-2 cursor-pointer flex items-center gap-2 ${
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

      {/* MAIN LAYOUT (SIDE BY SIDE) */}
      <div className="flex gap-6">
        {/* LEFT: chart */}
        <div className="w-3/5 app-surface p-6">
          <h2
            className={`mb-4 text-lg font-bold ${
              isDark ? "text-white" : "text-[#090c64]"
            }`}
          >
            {t("andamentoTicket")}
          </h2>

          {/* Interactive legend */}
          <div className="flex flex-wrap gap-3 mb-4">
            {["aperti", "risolti", "totale"].map((key) => (
              <button
                key={key}
                onClick={() => toggleLine(key)}
                className={`px-4 py-1.5 rounded-xl font-bold text-sm border shadow-sm transition ${
                  hiddenLines.includes(key)
                    ? isDark
                      ? "opacity-40 bg-white/5 text-white border-white/20"
                      : "opacity-40 bg-gray-100 text-[#090c64]"
                    : isDark
                    ? "opacity-100 bg-white/10 text-white border-white/20"
                    : "opacity-100 bg-white text-[#090c64]"
                }`}
                type="button"
              >
                {t(key)} ({totals[key]})
              </button>
            ))}
          </div>

          <LineChart
            dataset={chartData}
            xAxis={[
              {
                dataKey: "date",
                scaleType: "band",
                valueFormatter: (value) => formatDate(value),
              },
            ]}
            series={[
              { dataKey: "aperti", label: t("aperti"), color: "#3B82F6" },
              { dataKey: "risolti", label: t("risolti"), color: "#F59E0B" },
              { dataKey: "totale", label: t("totale"), color: isDark ? "#ffffff" : "#111" },
            ].filter((s) => !hiddenLines.includes(s.dataKey))}
            height={360}
            sx={{
              "& .MuiChartsAxis-line": { stroke: chartTextColor },
              "& .MuiChartsAxis-tick": { stroke: chartTextColor },
              "& .MuiChartsAxis-tickLabel": { fill: chartTextColor },
              "& .MuiChartsAxis-label": { fill: chartTextColor },
              "& .MuiChartsLegend-label": { fill: chartTextColor },
              "& .MuiChartsLegend-series text": { fill: chartTextColor },
              "& .MuiChartsGrid-line": {
                stroke: isDark
                  ? "rgba(255,255,255,0.16)"
                  : "rgba(9,12,100,0.15)",
              },
            }}
            onPointClick={(point) => {
              const clickedDate = point.x;
              setHighlightDate(clickedDate);

              const ticketsOnDate = filteredTickets.filter((ticket) => {
                const raw = ticket.date || ticket.createdAt || ticket.updatedAt || "";
                return raw.split("T")[0] === clickedDate;
              });

              if (ticketsOnDate.length > 0) {
                setSelectedTicket(ticketsOnDate[0]);
                setDrawerOpen(true);

                const id = ticketsOnDate[0]._id || ticketsOnDate[0].id;
                const el = itemRefs.current[id];
                if (el && el.scrollIntoView) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                }
              }
            }}
          />
        </div>

        {/* RIGHT: list */}
        <div className="w-2/5 app-surface p-6">
          <h2
            className={`mb-4 flex items-center gap-2 text-lg font-bold ${
              isDark ? "text-white" : "text-[#090c64]"
            }`}
          >
            <ListMagnifyingGlassIcon size={24} weight="duotone" className="preserve-icon-size shrink-0" />
            {t("listaTicket")}
          </h2>

          <div className="flex flex-col gap-2">
            {filteredTickets
              .slice()
              .sort((a, b) => {
                const da = new Date(a.date || a.createdAt || a.updatedAt);
                const db = new Date(b.date || b.createdAt || b.updatedAt);
                return db - da;
              })
              .map((ticket) => {
                const id = ticket._id || ticket.id;
                const s = ticketStatus[id];

                const raw = ticket.date || ticket.createdAt || ticket.updatedAt || "";
                const isHighlighted = raw.split("T")[0] === highlightDate;

                const statusLabel =
                  s === "risolto" ? t("risolti") : t("aperti");

                return (
                  <div
                    key={id}
                    ref={(el) => (itemRefs.current[id] = el)}
                    className={`ticket-list-card p-3 rounded-lg flex justify-between items-start cursor-pointer transition hover:shadow-md ${
                      isHighlighted ? "ring-2 ring-blue-100 dark:ring-white/30" : ""
                    }`}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setHighlightDate(raw.split("T")[0] || "");
                      setDrawerOpen(true);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-semibold truncate ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {ticket.title || ticket.name}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
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

                    <div className="flex flex-col items-end gap-2 ml-3">
                      <span
                        className={`ticket-status-pill text-xs px-3 py-1 rounded-lg font-semibold shrink-0 ${
                          s === "risolto" ? "is-closed" : "is-open"
                        }`}
                      >
                        {statusLabel}
                      </span>
                      <PencilIcon
                        size={18}
                        color={isDark ? "white" : "#090c64"}
                        weight="duotone"
                        className="shrink-0"
                      />
                    </div>
                  </div>
                );
              })}
          </div>
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
                  </div>

                  <div className="flex flex-col gap-2 mb-4">
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
