import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "./BaseModal";
import {
  AutoAwesome,
  FlashOn,
  Description,
  CheckCircle,
  RadioButtonUnchecked,
  AccessTime,
} from "@mui/icons-material";

interface ImportOptionsModalProps {
  /** Whether the modal dialog is currently open */
  isOpen: boolean;
  /** Callback fired when the user dismisses the modal without confirming */
  onClose: () => void;
  /**
   * Callback fired when the user confirms the import options.
   *
   * @param useSmart - Whether to run smart categorization on unassigned transactions
   */
  onConfirm: (useSmart: boolean) => void;
  /** Number of parsed transactions found in the uploaded file */
  transactionCount: number;
  /** Name of the uploaded file being processed */
  fileName: string;
}

/**
 * ImportOptionsModal provides a confirmation dialog allowing users to choose
 * between local heuristics only (fast) vs smart categorization with local rules
 * before committing parsed transactions to the backend.
 */
export function ImportOptionsModal({
  isOpen,
  onClose,
  onConfirm,
  transactionCount,
  fileName,
}: ImportOptionsModalProps) {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState<"ai" | "heuristics">("ai");

  const handleStart = () => {
    onConfirm(selectedMode === "ai");
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("import.optionsTitle", "Transaction Import Options")}
    >
      <div className="flex flex-col gap-4 pt-4">
        {/* File summary banner */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl">
          <div className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">
            <Description fontSize="small" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("import.readingFile", "Uploaded File")}
            </div>
            <div className="text-sm font-medium truncate" title={fileName}>
              {t("import.optionsFound", {
                count: transactionCount,
                fileName,
                defaultValue: `Found ${transactionCount} transactions in ${fileName}.`,
              })}
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-semibold bg-slate-700 dark:bg-slate-600 text-white rounded-full whitespace-nowrap">
            {transactionCount}
          </span>
        </div>

        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {t("import.optionsSubtitle", "Choose transaction categorization method:")}
        </p>

        {/* Options grid */}
        <div className="flex flex-col gap-3" role="radiogroup" aria-label={t("import.optionsSubtitle", "Choose transaction categorization method:")}>
          {/* Option 1: Heuristics Only */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedMode === "heuristics"}
            onClick={() => setSelectedMode("heuristics")}
            className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
              selectedMode === "heuristics"
                ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-500 ring-2 ring-emerald-600/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                {selectedMode === "heuristics" ? (
                  <CheckCircle fontSize="small" />
                ) : (
                  <RadioButtonUnchecked
                    fontSize="small"
                    className="text-slate-400"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    <FlashOn fontSize="small" className="text-amber-500" />
                    <span>
                      {t(
                        "import.heuristicsOnlyTitle",
                        "Local Rules Only (Fast)",
                      )}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-md">
                    {t("import.heuristicsOnlyBadge", "Instant (0s)")}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {t(
                    "import.heuristicsOnlyDesc",
                    "Assigns categories based on your previous rules and saved matches in the app.",
                  )}
                </p>
              </div>
            </div>
          </button>

          {/* Option 2: Smart Categorization */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedMode === "ai"}
            onClick={() => setSelectedMode("ai")}
            className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
              selectedMode === "ai"
                ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-500 ring-2 ring-emerald-600/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-emerald-600 dark:text-emerald-400">
                {selectedMode === "ai" ? (
                  <CheckCircle fontSize="small" />
                ) : (
                  <RadioButtonUnchecked
                    fontSize="small"
                    className="text-slate-400"
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    <AutoAwesome
                      fontSize="small"
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                    <span>
                      {t(
                        "import.aiTitle",
                        "Smart Categorization + Local Rules",
                      )}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 rounded-md">
                    {t("import.aiBadge", "Smart")}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  {t(
                    "import.aiDesc",
                    "Uses smart categorization to analyze unassigned transactions.",
                  )}
                </p>

                {/* Smart Notice Box with MUI AccessTime Icon */}
                <div className="mt-2.5 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 rounded-lg text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <AccessTime
                    fontSize="small"
                    className="text-amber-600 dark:text-amber-400 shrink-0"
                  />
                  <span className="leading-tight font-medium">
                    {t(
                      "import.aiNotice",
                      "Smart processing runs in the background and may take a moment.",
                    )}
                  </span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer buttons */}
        <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg font-medium text-sm transition-colors cursor-pointer"
          >
            {t("common.cancel", "Cancel")}
          </button>
          <button
            type="button"
            onClick={handleStart}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors shadow-sm cursor-pointer"
          >
            {t("import.startImportBtn", {
              count: transactionCount,
              defaultValue: `Start import (${transactionCount} transactions)`,
            })}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}
