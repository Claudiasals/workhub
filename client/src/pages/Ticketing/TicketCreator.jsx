import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import AppFeedbackModal from "../../components/AppFeedbackModal";
import Drawer from "../../components/Drawer";
import {
  createTicketAsync,
  fetchTickets,
  selectTickets,
} from "../../store/feature/ticketSlice";
import { useLanguage } from "../../context/LanguageContext";

const getDemoUserTickets = (authUser) => {
  const demoUserId = authUser?._id || authUser?.id || "demo-current-user";
  const now = new Date();

  return [
    {
      _id: "demo-user-ticket-1",
      name: "Richiesta cambio turno",
      status: "open",
      user: demoUserId,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
    },
    {
      _id: "demo-user-ticket-2",
      name: "Problema accesso area magazzino",
      status: "closed",
      user: demoUserId,
      createdAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 8).toISOString(),
      updatedAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    },
  ];
};

const TicketCreator = ({ user }) => {
  const dispatch = useDispatch();
  const { t } = useLanguage();

  const authUser = useSelector((state) => state.auth.user);
  const tickets = useSelector(selectTickets);
  const creatorStatus = useSelector((state) => state.tickets.status);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ticketDrawerOpen, setTicketDrawerOpen] = useState(false);

  useEffect(() => {
    if (authUser) {
      dispatch(fetchTickets());
    }
  }, [dispatch, authUser]);

  const filteredTickets = useMemo(() => {
    const userId = authUser?._id || authUser?.id;
    if (!userId || !tickets) return [];

    return tickets.filter(
      (ticket) =>
        ticket.user === userId ||
        ticket.user?._id === userId ||
        ticket.user?.id === userId
    );
  }, [tickets, authUser]);

  const visibleTickets = useMemo(() => {
    if (filteredTickets.length > 0 || creatorStatus === "loading") {
      return filteredTickets;
    }

    return getDemoUserTickets(authUser);
  }, [filteredTickets, creatorStatus, authUser]);

  const handleCreateTicket = async () => {
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (trimmedTitle.length < 3) {
      setError(t("titoloMinimo"));
      return;
    }

    if (trimmedDescription.length < 3) {
      setError(t("aiDescriptionTicket"));
      return;
    }

    const resolvedUserId =
      user?._id || user?.id || authUser?._id || authUser?.id;

    if (!resolvedUserId) {
      setError(t("utenteNonAutenticato"));
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        user: resolvedUserId,
        name: trimmedTitle,
        content: trimmedDescription,
        status: "open",
      };

      const result = await dispatch(createTicketAsync(payload)).unwrap();

      setTitle("");
      setDescription("");
      setSuccess(`"${result.name}"`);
      setTicketDrawerOpen(false);
      dispatch(fetchTickets());
    } catch (err) {
      let message = t("erroreCreazioneTicket");

      if (typeof err === "string") {
        message = err;
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
      console.error("Ticket creation error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedTickets = useMemo(() => {
    return [...visibleTickets].sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0);
      const db = new Date(b.updatedAt || b.createdAt || 0);
      return db - da;
    });
  }, [visibleTickets]);

  const searchedTickets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return sortedTickets;

    return sortedTickets.filter((ticket) =>
      String(ticket.name || "")
        .toLowerCase()
        .includes(query)
    );
  }, [sortedTickets, searchTerm]);

  const openTickets = useMemo(
    () => searchedTickets.filter((ticket) => ticket.status !== "closed"),
    [searchedTickets]
  );

  const closedTickets = useMemo(
    () => searchedTickets.filter((ticket) => ticket.status === "closed"),
    [searchedTickets]
  );

  const openCreateDrawer = () => {
    setError("");
    setTitle("");
    setDescription("");
    setTicketDrawerOpen(true);
  };

  const closeDrawer = () => {
    setTicketDrawerOpen(false);
    setError("");
  };

  const renderTicketList = (items, emptyText) => {
    if (items.length === 0) {
      return <p className="text-sm opacity-70">{emptyText}</p>;
    }

    return (
      <ul className="flex flex-col gap-2">
        {items.map((ticket) => {
          const isClosed = ticket.status === "closed";

          return (
            <li
              key={ticket._id || ticket.id}
              className="ticket-list-card rounded-xl p-2 flex justify-between items-start gap-3"
            >
              <div>
                <div className="text-sm font-semibold">
                  {ticket.name}
                </div>
                <div className="text-xs opacity-70">
                  {new Date(
                    ticket.updatedAt || ticket.createdAt
                  ).toLocaleString()}
                </div>
              </div>

              <span
                className={`ticket-status-pill text-xs px-2 py-1 rounded-xl font-semibold shrink-0 ${
                  isClosed ? "is-closed" : "is-open"
                }`}
              >
                {isClosed ? t("risolto") : t("aperto")}
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <div className="custom-box p-4 w-full ticket-page">
        <div className="table-toolbar ticket-page-toolbar">
          <div className="table-toolbar-left">
            <h2 className="table-toolbar-title">{t("ticket")}</h2>
          </div>

          <div className="table-toolbar-search">
            <input
              type="text"
              placeholder={t("cerca")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="table-search w-full min-w-0"
            />
          </div>

          <div className="table-toolbar-right">
            <button
              type="button"
              onClick={openCreateDrawer}
              className="custom-button shrink-0"
            >
              {t("apriTicket")}
            </button>
          </div>
        </div>

        {creatorStatus === "loading" && (
          <div className="mt-3 text-sm opacity-70">
            {t("sincronizzazioneInCorso")}
          </div>
        )}

        <div className="ticket-page-list">
          <div className="ticket-user-columns">
            <div className="ticket-user-column">
              <h4 className="ticket-user-column__title">{t("chiusi")}</h4>
              {renderTicketList(closedTickets, t("nessunTicketChiuso"))}
            </div>

            <div className="ticket-user-column">
              <h4 className="ticket-user-column__title">{t("aperti")}</h4>
              {renderTicketList(openTickets, t("nessunTicketAperto"))}
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={ticketDrawerOpen}
        onClose={closeDrawer}
        title={t("apriTicket")}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!isLoading) handleCreateTicket();
          }}
          className="flex flex-col gap-4"
        >
          <label className="drawer-label">{t("titoloTicket")}</label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("titoloTicket")}
            disabled={isLoading}
            maxLength={100}
            className="drawer-search"
          />

          <div className="text-xs opacity-70 text-right">
            {title.length}/100 {t("caratteri")}
          </div>

          <label className="drawer-label">{t("aiDescriptionTicket")}</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("aiDescriptionTicket")}
            disabled={isLoading}
            maxLength={1000}
            rows={4}
            className="drawer-search min-h-[96px] resize-y"
          />

          {error && (
            <div className="p-2 rounded-xl bg-red-500 text-white text-sm flex justify-between">
              <span>{error}</span>
              <button type="button" onClick={() => setError("")}>
                x
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={closeDrawer}
              className="custom-button-light"
            >
              {t("annulla")}
            </button>

            <button
              type="submit"
              disabled={isLoading || !title.trim() || !description.trim()}
              className="custom-button disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t("creando") : t("apriTicket")}
            </button>
          </div>
        </form>
      </Drawer>

      <AppFeedbackModal
        open={Boolean(success)}
        title={t("ticketCreato")}
        message={success}
        tone="success"
        closeLabel={t("chiudi")}
        onClose={() => setSuccess("")}
      />
    </>
  );
};

export default TicketCreator;
