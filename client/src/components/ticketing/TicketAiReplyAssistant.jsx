import { useEffect, useState } from "react";
import { SparkleIcon } from "@phosphor-icons/react";
import { useDispatch } from "react-redux";
import { AiBadge, AiButtonLabel } from "../ai/AiInsightPanel";
import { generateTicketReplyRequest } from "../../api/aiApi";
import { generateTicketReplyLocal } from "../../utils/ticketReplyGenerator";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { updateTicketAsync } from "../../store/feature/ticketSlice";

const getTicketUserName = (ticket) => {
  if (!ticket?.user) return "";
  const first =
    ticket.user.nome || ticket.user.firstName || ticket.user.name || "";
  const last = ticket.user.cognome || ticket.user.lastName || "";
  return `${first} ${last}`.trim();
};

const getTicketId = (ticket) => ticket?._id || ticket?.id || null;

export function TicketAiReplyAssistant({
  ticket,
  token,
  isDemoMode = false,
  onTicketUpdated,
  onReplySent,
}) {
  const dispatch = useDispatch();
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [source, setSource] = useState(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [keepTicketOpen, setKeepTicketOpen] = useState(false);

  useEffect(() => {
    const savedReply = ticket?.adminReply || "";
    setMessage(savedReply);
    setError("");
    setSuccess("");
    setSource(null);
    setHasGenerated(Boolean(savedReply));
    setKeepTicketOpen(false);
  }, [ticket?._id, ticket?.id]);

  const ticketId = getTicketId(ticket);
  const isDemoTicket =
    isDemoMode || (ticketId && String(ticketId).startsWith("demo-ticket-"));

  const persistReply = async ({ closeAfterSend = false } = {}) => {
    const trimmed = message.trim();
    if (!trimmed || !ticket) return false;

    const payload = {
      adminReply: trimmed,
      ...(closeAfterSend ? { status: keepTicketOpen ? "open" : "closed" } : {}),
    };

    if (isDemoTicket) {
      onTicketUpdated?.({
        ...ticket,
        ...payload,
        updatedAt: new Date().toISOString(),
      });
      return true;
    }

    if (!token || !ticketId) return false;

    const updated = await dispatch(
      updateTicketAsync({ id: ticketId, payload, token })
    ).unwrap();

    onTicketUpdated?.(updated);
    return true;
  };

  const handleGenerate = async () => {
    const trimmed = message.trim();
    if (trimmed.length < 2 || !ticket) return;

    setLoading(true);
    setError("");
    setSuccess("");

    const payload = {
      ticketTitle: ticket.name || ticket.title || "",
      ticketContent: ticket.content || ticket.description || "",
      keywords: trimmed,
      lang,
      userName: getTicketUserName(ticket),
    };

    try {
      let result;
      if (isDemoTicket) {
        result = generateTicketReplyLocal(payload);
      } else {
        result = await generateTicketReplyRequest({ token, ...payload });
      }
      setMessage(result.body || "");
      setHasGenerated(true);
      setSource(result.source);
    } catch (err) {
      setError(err.message || t("aiError"));
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const ok = await persistReply({ closeAfterSend: true });
      if (!ok) return;

      setSuccess(t("aiTicketReplySent"));
      onReplySent?.({
        ticketId,
        keepOpen: keepTicketOpen,
        closed: !keepTicketOpen,
      });
    } catch (err) {
      setError(
        typeof err === "string" ? err : err?.message || t("aiTicketReplySendError")
      );
    } finally {
      setSending(false);
    }
  };

  const canPersist = message.trim().length > 0;

  return (
    <section
      className={`ticket-drawer-section ticket-ai-reply flex flex-col gap-3 min-w-0 ${textColor}`}
    >
      <div className="business-overview-panel__header">
        <div className="panel-header-leading min-w-0">
          <SparkleIcon
            size={24}
            weight="duotone"
            color={iconColor}
            className="preserve-icon-size shrink-0"
          />
          <div className="panel-header-leading__text min-w-0">
            <p className="text-sm font-bold leading-tight">{t("aiTicketReplyTitle")}</p>
            <p className="text-xs opacity-75 mt-0.5">{t("aiTicketReplyDesc")}</p>
          </div>
          <AiBadge source={source} />
        </div>
      </div>

      <label className="text-xs font-bold opacity-80">
        {hasGenerated ? t("aiTicketReplyBody") : t("aiTicketReplyKeywordsLabel")}
      </label>

      <textarea
        className="custom-input min-h-[160px] resize-y text-sm leading-relaxed"
        placeholder={t("aiTicketReplyKeywordsPlaceholder")}
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setSuccess("");
        }}
        rows={hasGenerated ? 8 : 3}
      />

      <div className="ticket-ai-reply-generate-wrap">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading || message.trim().length < 2}
          className="custom-button ticket-ai-reply-generate text-sm"
        >
          {loading ? (
            <AiButtonLabel loading>{t("aiTicketReplyGenerate")}</AiButtonLabel>
          ) : (
            <>
              <SparkleIcon size={16} weight="duotone" className="shrink-0" />
              <span>{t("aiTicketReplyGenerate")}</span>
            </>
          )}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 dark:text-red-300">{error}</p>}
      {success && <p className="text-xs text-green-600 dark:text-green-300">{success}</p>}

      <div className="ticket-ai-reply-footer">
        <label className="ticket-ai-reply-keep-open">
          <input
            type="checkbox"
            checked={keepTicketOpen}
            onChange={(e) => setKeepTicketOpen(e.target.checked)}
          />
          <span className="ticket-ai-reply-keep-open__box" aria-hidden="true" />
          <span className="ticket-ai-reply-keep-open__label">{t("aiTicketReplyKeepOpen")}</span>
        </label>

        <div className="ticket-ai-reply-footer__actions">
          <button
            type="button"
            onClick={handleSend}
            disabled={!canPersist || sending}
            className="custom-button text-sm"
          >
            {sending ? t("invioInCorso") : t("aiTicketReplySend")}
          </button>
        </div>
      </div>
    </section>
  );
}

export default TicketAiReplyAssistant;
