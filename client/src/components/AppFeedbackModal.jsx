import { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  XCircleIcon,
} from "@phosphor-icons/react";

const toneConfig = {
  success: {
    Icon: CheckCircleIcon,
    iconClass: "text-emerald-500",
  },
  error: {
    Icon: XCircleIcon,
    iconClass: "text-red-500",
  },
  warning: {
    Icon: WarningCircleIcon,
    iconClass: "text-amber-500",
  },
  info: {
    Icon: InfoIcon,
    iconClass: "text-[#090c64] dark:text-white",
  },
};

const AppFeedbackModal = ({
  open,
  title,
  message,
  tone = "info",
  closeLabel = "Chiudi",
  onClose,
  actions,
  children,
}) => {
  const { Icon, iconClass } = toneConfig[tone] || toneConfig.info;

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="app-modal-backdrop fixed inset-0 z-[10000] flex items-center justify-center px-4"
      role={tone === "error" ? "alertdialog" : "dialog"}
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="app-modal-panel w-full max-w-[420px] p-6 text-center"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <Icon
          size={42}
          weight="duotone"
          className={`mx-auto mb-3 ${iconClass}`}
        />

        <h3 className="mb-3 text-lg font-bold">
          {title}
        </h3>

        {message && (
          <p className="mb-6 text-sm font-semibold opacity-80">
            {message}
          </p>
        )}

        {children}

        <div className="flex justify-center gap-3">
          {actions?.length ? (
            actions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={action.onClick}
                className={action.className || "custom-button"}
              >
                {action.label}
              </button>
            ))
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="custom-button"
            >
              {closeLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AppFeedbackModal;
