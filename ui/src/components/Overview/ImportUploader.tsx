import { useRef, useEffect } from "react";
import { useSocketStore } from "../../store/socketStore";
import { api } from "../../utils/api";
import { parseBankCSV } from "../../utils/bankImport";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { CircularProgress } from "@mui/material";

export function ImportUploader() {
  const { t } = useTranslation();
  const { isImportProcessing, setImportProcessing } = useSocketStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (isImportProcessing) {
      toast.error(t("import.alreadyProcessing", "Již probíhá zpracování jiného importu."));
      return;
    }

    try {
      setImportProcessing(true);

      // 1. Lokální vyčištění CSV
      const rawData = await parseBankCSV(file);
      
      if (rawData.length === 0) {
        toast.error(t("import.noData", "V souboru nebyly nalezeny žádné transakce."));
        setImportProcessing(false);
        return;
      }

      // 2. Odeslání na backend (okamžitá odpověď 202 Accepted)
      await api.post("/ai/import/start", { transactions: rawData });
      toast.success(t("import.sentToAi", "Soubor odeslán! AI ho zpracovává na pozadí."));

      timerRef.current = setTimeout(() => {
        if (useSocketStore.getState().isImportProcessing) {
          toast.error(t("import.timeout"));
        }
      }, 120000);
    } catch (err) {
      setImportProcessing(false);
      toast.error(t("import.parseError", "Při čtení souboru nastala chyba."));
      console.error(err);
    } finally {
      if (event.target) {
        event.target.value = ""; // Vyčištění inputu
      }
    }
  };

  return (
    <div className="w-full md:w-fit">
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
            <span>{t("import.processing", "Zpracovávám...")}</span>
          </>
        ) : (
          t("overview.importBank")
        )}
      </button>
    </div>
  );
}
