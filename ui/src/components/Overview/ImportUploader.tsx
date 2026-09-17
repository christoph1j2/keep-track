import { useRef, useEffect, useState } from "react";
import { useSocketStore } from "../../store/socketStore";
import { api } from "../../utils/api";
import { parseBankCSV } from "../../utils/bankImport";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { CircularProgress } from "@mui/material";
import { ImportOptionsModal } from "../Modals/ImportOptionsModal";

/**
 * ImportUploader provides a file upload button and workflow for importing bank CSV files.
 * It parses the file client-side first, presents an options modal (e.g. smart categorization),
 * and triggers background job processing via the backend API.
 */
export function ImportUploader() {
  const { t } = useTranslation();
  const { isImportProcessing, setImportProcessing } = useSocketStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pendingTransactions, setPendingTransactions] = useState<
    Awaited<ReturnType<typeof parseBankCSV>> | null
    >(null);
  const [pendingFileName, setPendingFileName] = useState<string>("");
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);

  useEffect(() => {
    if (!isImportProcessing && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isImportProcessing]);

  /**
   * Handles user file selection, parses the CSV locally, and prompts for import options.
   */
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isImportProcessing) {
      toast.error(t("import.alreadyProcessing", "Another import is already processing."));
      return;
    }

    try {
      // 1. Local CSV parsing and sanitization
      const rawData = await parseBankCSV(file);
      
      if (rawData.length === 0) {
        toast.error(t("import.noData", "No transactions found in file."));
        return;
      }

      setPendingTransactions(rawData);
      setPendingFileName(file.name);
      setIsOptionsModalOpen(true);
    } catch (err) {
      toast.error(t("import.parseError", "An error occurred while reading file."));
      console.error("Failed to parse CSV file:", err);
    } finally {
      if (event.target) {
        event.target.value = ""; // Reset input so identical file can be selected again
      }
    }
  };

  /**
   * Submits the parsed transactions to the backend for background processing.
   *
   * @param useAi - Whether to run smart categorization on the imported transactions
   */
  const handleConfirmImport = async (useAi: boolean) => {
    if (!pendingTransactions || pendingTransactions.length === 0) return;

    setIsOptionsModalOpen(false);
    try {
      setImportProcessing(true);

      // 2. Submit to backend (returns 202 Accepted)
      const res = await api.post("/import/start", {
        transactions: pendingTransactions,
        useAi,
      });
      const jobId = res.data?.jobId;
      setImportProcessing(true, jobId);
      toast.success(
        useAi
          ? t("import.sentToSmart", "File uploaded! Processing in the background.")
          : t("import.processing", "Processing import..."),
      );

      timerRef.current = setTimeout(() => {
        if (useSocketStore.getState().isImportProcessing) {
          toast(t("import.timeout"), { icon: "⏳" });
        }
      }, 120000);
    } catch (err) {
      setImportProcessing(false);
      toast.error(t("import.startFailed", "Failed to start import."));
      console.error("Failed to initiate import:", err);
    } finally {
      setPendingTransactions(null);
      setPendingFileName("");
    }
  };

  return (
    <div className="w-full md:w-fit flex flex-col items-center md:items-start gap-2">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        disabled={isImportProcessing}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isImportProcessing}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium w-full md:w-fit flex items-center justify-center gap-2 cursor-pointer shadow-sm"
      >
        {isImportProcessing ? (
          <>
            <CircularProgress size={16} color="inherit" />
            <span>{t("import.processing", "Processing...")}</span>
          </>
        ) : (
          t("overview.importBank")
        )}
      </button>

      {isOptionsModalOpen && (
        <ImportOptionsModal
          isOpen={isOptionsModalOpen}
          onClose={() => {
            setIsOptionsModalOpen(false);
            setPendingTransactions(null);
            setPendingFileName("");
          }}
          onConfirm={handleConfirmImport}
          transactionCount={pendingTransactions?.length || 0}
          fileName={pendingFileName}
        />
      )}
    </div>
  );
}
