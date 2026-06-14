import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { SparkleIcon, CircleNotchIcon } from "@phosphor-icons/react";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { AI_PRIORITIES } from "../../utils/ticketAiClassification";

const AiInsightBodyRefContext = createContext(null);

const severityClassMap = {
  high: "ai-alert-item--high",
  medium: "ai-alert-item--medium",
  low: "ai-alert-item--low",
  info: "ai-alert-item--info",
};

const severityOrder = { high: 0, medium: 1, low: 2, info: 3 };

const priorityClassMap = {
  alta: "ai-priority-badge--alta",
  media: "ai-priority-badge--media",
  bassa: "ai-priority-badge--bassa",
};

export const AiBadge = ({ source }) => {
  const { t } = useLanguage();
  if (source !== "ai") return null;

  return (
    <span className="ai-insight-badge">
      <SparkleIcon size={12} weight="duotone" />
      {t("aiBadgeLive")}
    </span>
  );
};

export const AiButtonLabel = ({ loading, children }) => (
  <>
    {loading && (
      <CircleNotchIcon size={16} weight="bold" className="ai-insight-spinner" aria-hidden="true" />
    )}
    <span>{children}</span>
  </>
);

export const AiLoadingIndicator = ({ className = "" }) => {
  const { t } = useLanguage();
  return (
    <p className={`ai-insight-loading inline-flex items-center gap-2 ${className}`.trim()}>
      <CircleNotchIcon size={16} weight="bold" className="ai-insight-spinner" aria-hidden="true" />
      <span>{t("aiLoading")}</span>
    </p>
  );
};

export const AiInsightPanel = ({
  title,
  loading = false,
  error = "",
  source,
  children,
  onRefresh,
  refreshLabel,
  onClose,
  showContent = true,
  compact = false,
  fillHeight = false,
  hasData = false,
  className = "",
  style,
}) => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";
  const iconColor = theme === "dark" ? "white" : "#090c64";
  const bodyRef = useRef(null);
  const isInitialLoad = loading && !hasData;
  const showChildren = showContent && !error && (!loading || hasData);

  const bodyContent = (
    <>
      {showContent && isInitialLoad && <AiLoadingIndicator />}

      {showContent && error && !loading && (
        <p className="ai-insight-error">{error}</p>
      )}

      {showChildren && children}
    </>
  );

  return (
    <section
      style={style}
      className={`app-surface flex flex-col min-w-0 ${textColor} ${
        compact ? "gap-2 p-3" : "gap-3 p-4"
      }${fillHeight ? " ai-insight-panel--fill" : ""}${className ? ` ${className}` : ""}`}
    >
      <div className="dashboard-card-header flex items-center gap-3 min-w-0 w-full shrink-0">
        <SparkleIcon
          size={24}
          weight="duotone"
          color={iconColor}
          className="preserve-icon-size shrink-0"
        />
        <h3 className="text-[14px] font-bold shrink-0">{title}</h3>
        <AiBadge source={source} />

        {(onRefresh || onClose) && (
          <div className="card-toolbar-actions">
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="custom-button shrink-0 whitespace-nowrap text-[14px]"
              >
                {refreshLabel || t("aiRefresh")}
              </button>
            )}
            {onClose && showContent && (
              <button
                type="button"
                onClick={onClose}
                className="custom-button shrink-0 whitespace-nowrap text-[14px]"
              >
                {t("chiudi")}
              </button>
            )}
          </div>
        )}
      </div>

      {fillHeight ? (
        <AiInsightBodyRefContext.Provider value={bodyRef}>
          <div ref={bodyRef} className="ai-insight-panel__body">
            {bodyContent}
          </div>
        </AiInsightBodyRefContext.Provider>
      ) : (
        bodyContent
      )}
    </section>
  );
};

export const AiAlertList = ({
  items = [],
  labelKey = "message",
  initialLimit = null,
  sortBySeverity = false,
  compact = false,
  fitToSpace = false,
}) => {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [fittedCount, setFittedCount] = useState(items.length);
  const measureRef = useRef(null);
  const toggleMeasureRef = useRef(null);
  const containerRef = useContext(AiInsightBodyRefContext);

  const sortedItems = useMemo(() => {
    if (!sortBySeverity) return items;

    return [...items].sort(
      (a, b) =>
        (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9)
    );
  }, [items, sortBySeverity]);

  const listGapPx = compact ? 6 : 8;

  const recalculateFit = useCallback(() => {
    if (!fitToSpace || expanded) {
      setFittedCount(sortedItems.length);
      return;
    }

    const container = containerRef?.current;
    const measureRoot = measureRef.current;
    if (!container || !measureRoot || !sortedItems.length) {
      setFittedCount(sortedItems.length);
      return;
    }

    const itemNodes = measureRoot.querySelectorAll(".ai-alert-item");
    if (!itemNodes.length) return;

    const needsToggle = sortedItems.length > 1;
    const toggleReserve = needsToggle
      ? (toggleMeasureRef.current?.offsetHeight ?? 26) + 10
      : 0;
    const budget = container.clientHeight - toggleReserve;

    let used = 0;
    let count = 0;

    for (let i = 0; i < itemNodes.length; i++) {
      const itemHeight = itemNodes[i].getBoundingClientRect().height;
      const gap = count > 0 ? listGapPx : 0;
      const nextUsed = used + gap + itemHeight;

      if (count > 0 && nextUsed > budget) break;

      used = nextUsed;
      count++;
    }

    setFittedCount(Math.max(1, Math.min(count, sortedItems.length)));
  }, [fitToSpace, expanded, sortedItems, containerRef, listGapPx]);

  useLayoutEffect(() => {
    recalculateFit();
  }, [recalculateFit]);

  useLayoutEffect(() => {
    if (!fitToSpace) return;
    const container = containerRef?.current;
    if (!container) return;

    const observer = new ResizeObserver(recalculateFit);
    observer.observe(container);
    return () => observer.disconnect();
  }, [fitToSpace, containerRef, recalculateFit]);

  useEffect(() => {
    setExpanded(false);
  }, [sortedItems.length]);

  if (!sortedItems.length) return null;

  const spaceLimit = fitToSpace ? fittedCount : initialLimit;
  const hasHidden =
    spaceLimit != null && sortedItems.length > spaceLimit;
  const visibleItems =
    !expanded && hasHidden
      ? sortedItems.slice(0, spaceLimit)
      : sortedItems;
  const hiddenCount = hasHidden ? sortedItems.length - spaceLimit : 0;

  const renderItem = (item, index) => (
    <li
      key={`${item.type}-${index}`}
      className={`ai-alert-item ${
        severityClassMap[item.severity] || severityClassMap.info
      }${compact ? " ai-alert-item--compact" : ""}`}
    >
      {item[labelKey]}
    </li>
  );

  return (
    <div
      className={`ai-alert-list-wrap${fitToSpace ? " ai-alert-list-wrap--fit" : ""}`}
    >
      {fitToSpace && (
        <ul
          ref={measureRef}
          className={`ai-alert-list ai-alert-list--measure${
            compact ? " ai-alert-list--compact" : ""
          }`}
          aria-hidden="true"
        >
          {sortedItems.map(renderItem)}
        </ul>
      )}

      <ul className={`ai-alert-list${compact ? " ai-alert-list--compact" : ""}`}>
        {visibleItems.map(renderItem)}
      </ul>

      {fitToSpace && sortedItems.length > 1 && (
        <button
          ref={toggleMeasureRef}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          className="ai-alert-toggle ai-alert-toggle--measure"
        >
          {t("aiShowMore").replace("{count}", "0")}
        </button>
      )}

      {hasHidden && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="ai-alert-toggle"
        >
          {expanded
            ? t("aiShowLess")
            : t("aiShowMore").replace("{count}", String(hiddenCount))}
        </button>
      )}
    </div>
  );
};

const priorityKeyMap = {
  alta: "aiPriorityAlta",
  media: "aiPriorityMedia",
  bassa: "aiPriorityBassa",
};

const categoryKeyMap = {
  tecnico: "aiCatTecnico",
  magazzino: "aiCatMagazzino",
  ordine: "aiCatOrdine",
  cliente: "aiCatCliente",
  personale: "aiCatPersonale",
  altro: "aiCatAltro",
};

export const TicketAiLabels = ({
  classification,
  showSummary = false,
  compact = false,
}) => {
  const { t } = useLanguage();

  const priority = classification?.priority;
  const isValid =
    classification && AI_PRIORITIES.includes(priority);

  if (!isValid) {
    return (
      <span className="ticket-ai-label ticket-ai-label--none">
        {t("aiUnclassified")}
      </span>
    );
  }

  const priorityKey = priorityKeyMap[priority];
  const categoryKey =
    categoryKeyMap[classification.category] || "aiCatAltro";

  return (
    <div
      className={`ticket-ai-labels${
        compact ? " ticket-ai-labels--compact" : ""
      }`}
    >
      <span
        className={`ticket-ai-label ticket-ai-label--priority ai-priority-badge ${
          priorityClassMap[priority] || priorityClassMap.bassa
        }`}
      >
        {t(priorityKey)}
      </span>
      <span className="ticket-ai-label ticket-ai-label--category ai-category-badge">
        {t(categoryKey)}
      </span>
      <AiBadge source={classification.source} />
      {showSummary && classification.summary && (
        <span className="ticket-ai-summary">{classification.summary}</span>
      )}
    </div>
  );
};

export const TicketClassificationCard = ({ classification }) => {
  const { t } = useLanguage();
  if (!classification?.priority || !AI_PRIORITIES.includes(classification.priority)) {
    return null;
  }

  return (
    <div className="ai-classification-card">
      <div className="flex flex-wrap gap-2">
        <span
          className={`ai-priority-badge ${
            priorityClassMap[classification.priority] ||
            priorityClassMap.bassa
          }`}
        >
          {t(priorityKeyMap[classification.priority])}
        </span>
        <span className="ai-category-badge">
          {t(categoryKeyMap[classification.category] || "aiCatAltro")}
        </span>
      </div>
      {classification.summary && (
        <p>
          <span className="font-extrabold">{t("aiSummary")}:</span>{" "}
          {classification.summary}
        </p>
      )}
      {classification.adminSuggestion && (
        <p>
          <span className="font-extrabold">{t("aiSuggestion")}:</span>{" "}
          {classification.adminSuggestion}
        </p>
      )}
    </div>
  );
};

export default AiInsightPanel;
