import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { BuildingsIcon, SparkleIcon } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import {
  AI_CATEGORIES,
  TICKET_DEPARTMENT_LABEL_KEYS,
  getTicketDepartmentLabelKey,
  hasValidAiClassification,
} from "../../utils/ticketAiClassification";
import { updateTicketAsync } from "../../store/feature/ticketSlice";

export function TicketAssignmentPanel({
  ticket,
  isDemoMode = false,
  onAssigned,
}) {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [department, setDepartment] = useState(ticket?.assignedDepartment || "");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    setDepartment(ticket?.assignedDepartment || "");
    setFeedback("");
  }, [ticket?._id, ticket?.id, ticket?.assignedDepartment]);

  const suggestedCategory = ticket?.aiClassification?.category;
  const canApplySuggestion =
    hasValidAiClassification(ticket) &&
    suggestedCategory &&
    AI_CATEGORIES.includes(suggestedCategory);

  const handleApplySuggestion = () => {
    if (!canApplySuggestion) return;
    setDepartment(suggestedCategory);
    setFeedback("");
  };

  const handleSave = async () => {
    const id = ticket?._id || ticket?.id;
    if (!id || !department) return;

    setSaving(true);
    setFeedback("");

    try {
      if (isDemoMode || String(id).startsWith("demo-ticket-")) {
        const updated = { ...ticket, assignedDepartment: department };
        onAssigned?.(updated);
        setFeedback(t("ticketAssignSuccess"));
        return;
      }

      const updated = await dispatch(
        updateTicketAsync({
          id,
          payload: { assignedDepartment: department },
        })
      ).unwrap();

      onAssigned?.(updated);
      setFeedback(t("ticketAssignSuccess"));
    } catch {
      setFeedback(t("ticketAssignError"));
    } finally {
      setSaving(false);
    }
  };

  const currentLabelKey = getTicketDepartmentLabelKey(ticket?.assignedDepartment);
  const selectedLabelKey = getTicketDepartmentLabelKey(department);

  return (
    <section
      className={`ticket-assignment-panel rounded-xl border p-3 mt-3 ${
        isDark ? "border-white/20 bg-white/5" : "border-gray-200 bg-white/60"
      }`}
    >
      <div className="flex items-center gap-2 mb-3">
        <BuildingsIcon size={20} weight="duotone" />
        <h4 className="text-sm font-bold">{t("ticketAssignTitle")}</h4>
      </div>

      {currentLabelKey ? (
        <p className="text-xs mb-2 opacity-80">
          {t("ticketAssignedDepartment")}:{" "}
          <span className="font-bold">{t(currentLabelKey)}</span>
        </p>
      ) : (
        <p className="text-xs mb-2 opacity-70">{t("ticketAssignNone")}</p>
      )}

      {canApplySuggestion && (
        <div
          className={`rounded-lg p-2 mb-3 text-xs leading-relaxed ${
            isDark ? "bg-white/10" : "bg-blue-50/80"
          }`}
        >
          <div className="flex items-center gap-1 font-bold mb-1">
            <SparkleIcon size={14} weight="duotone" />
            {t("aiSuggestion")}
          </div>
          <p className="opacity-90">
            {ticket.aiClassification.adminSuggestion ||
              t(suggestedCategory ? getTicketDepartmentLabelKey(suggestedCategory) : "aiCatAltro")}
          </p>
          <button
            type="button"
            className="custom-button-light text-xs mt-2"
            onClick={handleApplySuggestion}
          >
            {t("ticketApplyAiAssignment")}: {t(getTicketDepartmentLabelKey(suggestedCategory))}
          </button>
        </div>
      )}

      <label className="drawer-label text-xs mb-1 block">{t("ticketAssignSelect")}</label>
      <select
        className="custom-input w-full text-sm mb-3"
        value={department}
        onChange={(e) => {
          setDepartment(e.target.value);
          setFeedback("");
        }}
      >
        <option value="">{t("ticketAssignSelectPlaceholder")}</option>
        {AI_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {t(TICKET_DEPARTMENT_LABEL_KEYS[cat])}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="custom-button w-full text-sm"
        disabled={!department || saving || department === ticket?.assignedDepartment}
        onClick={handleSave}
      >
        {saving ? t("aiLoading") : t("ticketAssignSave")}
      </button>

      {feedback && (
        <p className="text-xs mt-2 font-semibold opacity-90">{feedback}</p>
      )}

      {selectedLabelKey && department !== ticket?.assignedDepartment && (
        <p className="text-xs mt-2 opacity-70">
          {t("ticketAssignPending")}: {t(selectedLabelKey)}
        </p>
      )}
    </section>
  );
}

export default TicketAssignmentPanel;
