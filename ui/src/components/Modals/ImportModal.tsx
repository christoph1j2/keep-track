import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BaseModal } from "./BaseModal";
import { parseBankCSV } from "../../utils/bankImport";
import { toast } from "react-hot-toast";
import { api } from "../../utils/api";
import { CircularProgress } from "@mui/material";
import { useSocketStore } from "../../store/socketStore";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const { t } = useTranslation();
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setImportProcessing = useSocketStore(
    (state) => state.setImportProcessing,
  );

  // Zpracování nahrání souboru a AI kategorizace na pozadí
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setError(null);

    try {
      // 1. Lokální vyčištění CSV
      const rawData = await parseBankCSV(file);
      setIsParsing(false);

      if (rawData.length === 0) {
        setError(
          t("import.noData", "V souboru nebyly nalezeny platné transakce."),
        );
        return;
      }

      // 2. Nastavíme globální stav, že se něco děje
      setImportProcessing(true);
      toast.success(
        t(
          "import.sentToAi",
          "Odesláno AI k analýze. Můžete aplikaci dál používat.",
        ),
      );

      // Zavřeme modal pro nahrávání
      onClose();

      // 3. Odpálíme na backend (rychlá odpověď 202)
      await api.post("/ai/categorize-batch", { transactions: rawData });
    } catch (err) {
      setImportProcessing(false);
      setError(t("import.parseError", "Při zpracování souboru nastala chyba."));
      toast.error(t("import.uploadError", "Chyba při nahrávání."));
      console.error(err);
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  };

  return (
    <BaseModal title={t("import.title")} isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Nahrání souboru a Loading */}
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center flex flex-col items-center justify-center">
          {isParsing ? (
            <div className="flex flex-col items-center gap-3 text-blue-600 dark:text-blue-400 py-4">
              <CircularProgress size={32} color="inherit" />
              <p className="text-sm font-medium animate-pulse">
                {t("import.readingFile", "Čtu strukturu CSV souboru...")}
              </p>
            </div>
          ) : (
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isParsing}
              className="block w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-indigo-500/20 dark:file:text-indigo-200 dark:hover:file:bg-indigo-500/30 cursor-pointer"
            />
          )}

          {error && (
            <p className="mt-4 text-red-500 dark:text-red-400 font-medium">
              {error}
            </p>
          )}
        </div>

        {!isParsing && (
          <div className="mt-6 text-sm text-slate-600 dark:text-slate-300 bg-blue-50 dark:bg-indigo-500/10 p-4 rounded-xl text-left shadow-sm">
            <strong>{t("import.helpPrefix")}</strong> {t("import.helpText")}
          </div>
        )}
      </div>
    </BaseModal>
  );
}
