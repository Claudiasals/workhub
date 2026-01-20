import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";

import { createTicketAsync, fetchTickets, selectTickets } from "../../store/feature/ticketSlice";
import { useLanguage } from "../../context/LanguageContext";

/*
  TicketCreator
  -------------
  Component responsible for:
  - Creating a new support ticket
  - Showing feedback (error / success / loading)
  - Listing tickets belonging to the authenticated user
*/
const TicketCreator = ({ user }) => {
  const dispatch = useDispatch();
  const { t } = useLanguage();

  /* REDUX STATE */
  const authUser = useSelector((state) => state.auth.user);
  const tickets = useSelector(selectTickets);
  const creatorStatus = useSelector((state) => state.tickets.status);

  /* LOCAL STATE */
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /* LOAD USER TICKETS */
  useEffect(() => {
    if (authUser) {
      dispatch(fetchTickets());
    }
  }, [dispatch, authUser]);

  /* AUTO CLEAR SUCCESS */
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  /* FILTER TICKETS BY USER */
  const filteredTickets = useMemo(() => {
    const userId = authUser?._id || authUser?.id;
    if (!userId || !tickets) return [];

    return tickets.filter(
      (t) =>
        t.user === userId ||
        t.user?._id === userId ||
        t.user?.id === userId
    );
  }, [tickets, authUser]);

  /* CREATE TICKET HANDLER */
  const handleCreateTicket = async () => {
    const trimmedTitle = title.trim();

    // Basic validation
    if (trimmedTitle.length < 3) {
      setError(t("titoloMinimo"));
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
        content: `Ticket created by ${user?.nome || authUser?.firstName || "User"}`,
        status: "open",
      };

      const result = await dispatch(createTicketAsync(payload)).unwrap();

      setTitle("");
      setSuccess(`✓ ${t("ticketCreato")}: "${result.name}"`);
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

  /* SORT TICKETS (LATEST FIRST) */
  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      const da = new Date(a.updatedAt || a.createdAt || 0);
      const db = new Date(b.updatedAt || b.createdAt || 0);
      return db - da;
    });
  }, [filteredTickets]);

  return (
    <div className="custom-box p-4 w-full">

      {/* TITLE */}
      <h2 className="font-bold text-xl mb-4">
        {t("creaTicket")}
      </h2>

      {/* TICKET TITLE INPUT */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) =>
          e.key === "Enter" && !isLoading && handleCreateTicket()
        }
        placeholder={t("titoloTicket")}
        disabled={isLoading}
        maxLength={100}
      />

      {/* ERROR MESSAGE */}
      {error && (
        <div className="mt-3 p-2 rounded-xl bg-red-500 text-white text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")}>✕</button>
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {success && (
        <div className="mt-3 p-2 rounded-xl bg-green-500 text-white text-sm">
          {success}
        </div>
      )}

      {/* CREATE BUTTON */}
      <button
        onClick={handleCreateTicket}
        disabled={isLoading || !title.trim()}
        className="custom-button w-full mt-4"
      >
        {isLoading ? t("creando") : `+ ${t("richiediTicket")}`}
      </button>

      {/* SYNC STATUS */}
      {creatorStatus === "loading" && (
        <div className="mt-3 text-sm opacity-70">
          {t("sincronizzazioneInCorso")}
        </div>
      )}

      {/* CHARACTER COUNTER */}
      <div className="mt-2 text-xs opacity-70 text-right">
        {title.length}/100 {t("caratteri")}
      </div>

      {/*USER TICKETS LIST */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">
          {t("iTuoiTicket")}
        </h3>

        {sortedTickets.length === 0 ? (
          <p className="text-sm opacity-70">
            {t("nessunTicket")}
          </p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-[480px] overflow-auto">
            {sortedTickets.map((ticket) => {
              const status = ticket.status;
              const isClosed = status === "closed";

              return (
                <li
                  key={ticket._id || ticket.id}
                  className="bg-white/60 rounded-xl p-2 flex justify-between items-start"
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
                    className={`text-xs px-2 py-1 rounded-xl font-semibold ${
                      isClosed
                        ? "bg-[#FFD580] text-[#663c00]"
                        : "bg-[#A3B8E0] text-[#06234a]"
                    }`}
                  >
                    {isClosed ? t("risolto") : t("aperto")}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TicketCreator;
