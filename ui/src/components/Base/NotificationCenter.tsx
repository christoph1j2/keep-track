import { useState, useRef, useEffect } from "react";
import { useNotificationStore } from "../../store/notificationStore";
import { useSocketStore } from "../../store/socketStore";
import { ImportModal } from "../Modals/ImportModal";
import { useTranslation } from "react-i18next";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CloseIcon from "@mui/icons-material/Close";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";

function getNotificationIcon(type: string) {
  switch (type) {
    case "IMPORT_READY":
      return <FileUploadIcon sx={{ fontSize: 18 }} />;
    case "INSIGHT":
      return <AutoAwesomeIcon sx={{ fontSize: 18 }} />;
    default:
      return <InfoOutlinedIcon sx={{ fontSize: 18 }} />;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "IMPORT_READY":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/20";
    case "INSIGHT":
      return "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-500/20";
    default:
      return "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function timeAgo(dateStr: string, t: any): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return t("notifications.justNow", "Právě teď");
  if (diffMin < 60) return t("notifications.minutesAgo", "{{count}} min", { count: diffMin });
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return t("notifications.hoursAgo", "{{count}}h", { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return t("notifications.daysAgo", "{{count}}d", { count: diffDays });
}

export function NotificationCenter() {
  const { t } = useTranslation();
  const { notifications, dismissNotification } = useNotificationStore();
  const { isImportProcessing, importedDataReady } = useSocketStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const count = notifications.length;

  // Zavírání panelu po kliknutí mimo
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleNotificationAction = (type: string) => {
    if (type === "IMPORT_READY" && importedDataReady) {
      setIsImportModalOpen(true);
      setIsOpen(false);
    }
  };

  return (
    <div className="w-full mt-auto relative">
      {/* Oddělovací linka */}
      <div className="border-t border-slate-200 dark:border-slate-800" />

      {/* Processing indicator */}
      {isImportProcessing && (
        <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400 px-4 py-3">
          <div className="w-4 h-4 border-2 border-t-transparent border-current rounded-full animate-spin shrink-0"></div>
          <span className="text-sm font-medium animate-pulse">
            {t("import.aiAnalyzing", "AI analyzuje transakce...")}
          </span>
        </div>
      )}

      {/* Zvoneček s badge */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer rounded-xl font-medium"
      >
        <div className="relative">
          <NotificationsIcon sx={{ fontSize: 22 }} />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </div>
        <span>{t("notifications.title", "Notifikace")}</span>
      </button>

      {/* Overlay panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" />

          {/* Panel */}
          <div
            ref={panelRef}
            className="absolute bottom-full left-0 mb-2 w-80 max-h-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {t("notifications.title", "Notifikace")}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {count === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400 dark:text-slate-500">
                  {t("notifications.empty", "Žádné nové notifikace")}
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Ikona */}
                      <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5 ${getNotificationColor(n.type)}`}>
                        {getNotificationIcon(n.type)}
                      </div>

                      {/* Obsah */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleNotificationAction(n.type)}
                      >
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                          {n.title}
                        </p>
                        {n.message && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                            {n.message}
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                          {timeAgo(n.createdAt, t)}
                        </p>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissNotification(n.id);
                        }}
                        className="shrink-0 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all cursor-pointer"
                        title={t("notifications.dismiss", "Zavřít")}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Import modal */}
      {isImportModalOpen && importedDataReady && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
      )}
    </div>
  );
}
