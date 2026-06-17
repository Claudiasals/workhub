import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { BuildingsIcon, SparkleIcon } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
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
  className = "",
}) {
  const dispatch = useDispatch();
  const { t } = useLanguage();

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
  const suggestedLabelKey = canApplySuggestion
    ? getTicketDepartmentLabelKey(suggestedCategory)
    : null;

  return (
    <section className={`ticket-drawer-section ticket-assignment-panel ${className}`.trim()}>
      <div className="ticket-assignment-panel__header">
        <div className="ticket-drawer-section__heading">
          <BuildingsIcon size={18} weight="duotone" />
          <h4 className="ticket-drawer-section__label">{t("ticketAssignTitle")}</h4>
        </div>

        {currentLabelKey ? (
          <p className="ticket-assignment-panel__current">
            {t("ticketAssignedDepartment")}:{" "}
            <span className="ticket-assignment-panel__current-value">{t(currentLabelKey)}</span>
          </p>
        ) : (
          <p className="ticket-assignment-panel__current ticket-assignment-panel__current--empty">
            {t("ticketAssignNone")}
          </p>
        )}
      </div>

      <div
        className={`ticket-assignment-panel__grid${
          canApplySuggestion ? " ticket-assignment-panel__grid--with-suggestion" : ""
        }`}
      >
        {canApplySuggestion && (
          <div className="ticket-assignment-panel__suggestion">
            <div className="ticket-assignment-panel__suggestion-head">
              <SparkleIcon size={14} weight="duotone" />
              <span>{t("aiSuggestion")}</span>
            </div>
            <p className="ticket-assignment-panel__suggestion-text">
              {ticket.aiClassification.adminSuggestion ||
                t(suggestedLabelKey || "aiCatAltro")}
            </p>
            <button
              type="button"
              className="custom-button-light ticket-assignment-panel__suggestion-btn"
              onClick={handleApplySuggestion}
            >
              {t("ticketApplyAiAssignment")}
              {suggestedLabelKey ? `: ${t(suggestedLabelKey)}` : ""}
            </button>
          </div>
        )}

        <div className="ticket-assignment-panel__form">
          <label className="drawer-label ticket-assignment-panel__label">
            {t("ticketAssignSelect")}
          </label>

          <div className="ticket-assignment-panel__controls">
            <select
              className="custom-input ticket-assignment-panel__select"
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
              className="custom-button ticket-assignment-panel__save"
              disabled={!department || saving || department === ticket?.assignedDepartment}
              onClick={handleSave}
            >
              {saving ? t("aiLoading") : t("ticketAssignSave")}
            </button>
          </div>

          {(feedback || (selectedLabelKey && department !== ticket?.assignedDepartment)) && (
            <div className="ticket-assignment-panel__meta">
              {feedback && (
                <p className="ticket-assignment-panel__feedback">{feedback}</p>
              )}
              {selectedLabelKey && department !== ticket?.assignedDepartment && (
                <p className="ticket-assignment-panel__pending">
                  {t("ticketAssignPending")}: {t(selectedLabelKey)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default TicketAssignmentPanel;
