import { useEffect, useState } from "react";
import { SparkleIcon } from "@phosphor-icons/react";
import { AiBadge, AiButtonLabel } from "../ai/AiInsightPanel";
import { generateTicketReplyRequest } from "../../api/aiApi";
import { generateTicketReplyLocal } from "../../utils/ticketReplyGenerator";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";

const getTicketUserName = (ticket) => {
  if (!ticket?.user) return "";
  const first =
    ticket.user.nome || ticket.user.firstName || ticket.user.name || "";
  const last = ticket.user.cognome || ticket.user.lastName || "";
  return `${first} ${last}`.trim();
};

export function TicketAiReplyAssistant({ ticket, token, isDemoMode = false }) {
  const { t, lang } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [keywords, setKeywords] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setKeywords("");
    setReplyBody("");
    setError("");
    setSource(null);
    setCopied(false);
  }, [ticket?._id, ticket?.id]);

  const handleGenerate = async () => {
    const trimmed = keywords.trim();
    if (trimmed.length < 2 || !ticket) return;

    setLoading(true);
    setError("");
    setCopied(false);

    const payload = {
      ticketTitle: ticket.name || ticket.title || "",
      ticketContent: ticket.content || ticket.description || "",
      keywords: trimmed,
      lang,
      userName: getTicketUserName(ticket),
    };

    try {
      let result;
      if (isDemoMode || String(ticket._id || ticket.id).startsWith("demo-ticket-")) {
        result = generateTicketReplyLocal(payload);
      } else {
        result = await generateTicketReplyRequest({ token, ...payload });
      }
      setReplyBody(result.body || "");
      setSource(result.source);
    } catch (err) {
      setError(err.message || t("aiError"));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!replyBody) return;
    try {
      await navigator.clipboard.writeText(replyBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("aiTicketReplyCopyError"));
    }
  };

  return (
    <div
      className={`ticket-ai-reply rounded-xl border p-4 flex flex-col gap-3 ${
        isDark
          ? "border-white/20 bg-white/10"
          : "border-[#090c64]/10 bg-white/60"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <SparkleIcon
          size={20}
          weight="duotone"
          color={isDark ? "white" : "#090c64"}
          className="shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-tight">{t("aiTicketReplyTitle")}</p>
          <p className="text-xs opacity-75 mt-0.5">{t("aiTicketReplyDesc")}</p>
        </div>
        <AiBadge source={source} />
      </div>

      <textarea
        className="custom-input min-h-[72px] resize-y text-sm"
        placeholder={t("aiTicketReplyKeywordsPlaceholder")}
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        rows={3}
      />

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading || keywords.trim().length < 2}
        className="custom-button w-fit text-sm"
      >
        <AiButtonLabel loading={loading}>{t("aiTicketReplyGenerate")}</AiButtonLabel>
      </button>

      {error && <p className="text-xs text-red-500 dark:text-red-300">{error}</p>}

      {replyBody && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold opacity-80">{t("aiTicketReplyBody")}</label>
          <textarea
            className="custom-input min-h-[160px] resize-y text-sm leading-relaxed"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={8}
          />
          <button
            type="button"
            onClick={handleCopy}
            className="custom-button-light w-fit text-sm"
          >
            {copied ? t("aiTicketReplyCopied") : t("aiTicketReplyCopy")}
          </button>
        </div>
      )}
    </div>
  );
}

export default TicketAiReplyAssistant;
