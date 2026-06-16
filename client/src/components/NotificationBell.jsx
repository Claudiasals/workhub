import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BellIcon } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

import { useTheme } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";
import { useUserNotifications } from "../hooks/useUserNotifications";

const formatWhen = (value, locale) => {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "";
  }
};

const NotificationBell = () => {
  const { theme } = useTheme();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const { items, count, markItemRead, refresh } = useUserNotifications();

  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState({});
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const iconColor = theme === "dark" ? "white" : "#090c64";
  const textColor = theme === "dark" ? "text-white" : "text-[#090c64]";

  const updatePanelPosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    setPanelStyle({
      position: "fixed",
      top: `${rect.bottom + 8}px`,
      right: `${Math.max(16, window.innerWidth - rect.right)}px`,
      width: "min(22rem, calc(100vw - 2rem))",
      zIndex: 10050,
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();

    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);

    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (
        rootRef.current?.contains(event.target) ||
        panelRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const handleToggle = () => {
    setOpen((current) => {
      const next = !current;
      if (next) refresh();
      return next;
    });
  };

  const handleItemClick = (item) => {
    setOpen(false);
    navigate(item.href);
  };

  const handleMarkItemRead = (event, item) => {
    event.stopPropagation();
    markItemRead(item);
  };

  const panel = open
    ? createPortal(
        <div
          ref={panelRef}
          className={`notification-bell-panel app-surface flex flex-col min-w-0 ${textColor}`}
          style={panelStyle}
          role="menu"
        >
          <div className="notification-bell-panel-header">
            <strong>{t("notifBellTitle")}</strong>
          </div>

          {items.length === 0 ? (
            <p className="notification-bell-empty">{t("notifEmpty")}</p>
          ) : (
            <ul className="notification-bell-list">
              {items.map((item) => (
                <li key={item.id} className="notification-bell-item-row">
                  <button
                    type="button"
                    className="notification-bell-item"
                    onClick={() => handleItemClick(item)}
                    role="menuitem"
                  >
                    <span className="notification-bell-item-title">
                      {item.title}
                    </span>
                    <span className="notification-bell-item-message">
                      {item.message}
                    </span>
                    {item.at && (
                      <span className="notification-bell-item-time">
                        {formatWhen(item.at, lang === "en" ? "en-GB" : "it-IT")}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="notification-bell-mark-one"
                    onClick={(event) => handleMarkItemRead(event, item)}
                  >
                    {t("notifMarkRead")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="notification-bell-trigger"
        onClick={handleToggle}
        title={t("notifBellTitle")}
        aria-label={t("notifBellTitle")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon size={24} color={iconColor} weight="duotone" />
        {count > 0 && (
          <span className="notification-bell-badge" aria-hidden="true">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {panel}
    </div>
  );
};

export default NotificationBell;
