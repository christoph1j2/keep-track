import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import i18n from "../i18n";
import { useNotificationStore } from "./notificationStore";
import { useAuthStore } from "./authStore";
import { useTransactionStore } from "./transactionStore";
import { useCategoryStore } from "./categoryStore";
import { useBudgetStore } from "./budgetStore";
import { useTemplateStore } from "./quickAddTemplateStore";
import { api } from "../utils/api";

interface SocketState {
  socket: Socket | null;
  isImportProcessing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importedDataReady: any[] | null;
  importJobId: string | null;

  connectSocket: () => void;
  disconnectSocket: () => void;
  setImportProcessing: (status: boolean, jobId?: string) => void;
  clearImportedData: () => void;
  fetchPendingJob: (targetJobId?: string) => Promise<boolean>;
}

const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || "/socket.io";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || window.location.origin;

let importPollTimer: ReturnType<typeof setInterval> | null = null;

const stopImportPolling = () => {
  if (importPollTimer) {
    clearInterval(importPollTimer);
    importPollTimer = null;
  }
};

export const useSocketStore = create<SocketState>()(
  persist(
    (set, get) => ({
      socket: null,
      isImportProcessing: false,
      importedDataReady: null,
      importJobId: null,

      connectSocket: () => {
        // pokud jsme pripojeni, nedelam nic
        if (get().socket?.connected) return;

        const token = useAuthStore.getState().accessToken;
        if (!token) return;

        const newSocket = io(BACKEND_URL, {
          path: SOCKET_PATH,
          withCredentials: true,
          auth: { token },
        });

        newSocket.on("connect", () => {
          console.log("WebSocket connected.");
          get().fetchPendingJob();
        });

        newSocket.on("data_updated", (payload?: { resource?: string }) => {
          const resource = payload?.resource;
          if (!resource || resource === "transactions") {
            useTransactionStore.getState().fetchTransactions();
          }
          if (!resource || resource === "categories") {
            useCategoryStore.getState().fetchCategories();
          }
          if (!resource || resource === "budgets") {
            useBudgetStore.getState().fetchBudgets();
            useBudgetStore.getState().fetchComplexBudget();
          }
          if (!resource || resource === "templates") {
            useTemplateStore.getState().fetchTemplates();
          }
        });

        newSocket.on("import_finished", (payload) => {
          stopImportPolling();
          if (payload.status === "success") {
            set({
              isImportProcessing: false,
              importedDataReady: payload.data,
              importJobId: payload.jobId,
            });
            toast.success(
              i18n.t("import.aiSuccess", "Transakce byly analyzovány!"),
            );
            // Obnovíme notifikace z backendu (nová IMPORT_READY notifikace)
            useNotificationStore.getState().fetchNotifications();
          } else {
            set({ isImportProcessing: false });
            toast.error(
              payload.message ||
                i18n.t(
                  "import.parseError",
                  "Při zpracování souboru nastala chyba.",
                ),
            );
          }
        });

        set({ socket: newSocket });
      },

      disconnectSocket: () => {
        stopImportPolling();
        const { socket } = get();
        if (socket) {
          socket.disconnect();
          set({ socket: null });
        }
      },

      setImportProcessing: (status, jobId) => {
        if (status) {
          set({
            isImportProcessing: true,
            importedDataReady: null,
            ...(jobId ? { importJobId: jobId } : {}),
          });
          stopImportPolling();
          importPollTimer = setInterval(async () => {
            const currentJobId = get().importJobId;
            const found = await get().fetchPendingJob(currentJobId || undefined);
            if (found) {
              stopImportPolling();
              toast.success(
                i18n.t("import.aiSuccess", "Transakce byly analyzovány!"),
              );
              useNotificationStore.getState().fetchNotifications();
            }
          }, 3000);
        } else {
          stopImportPolling();
          set({ isImportProcessing: false });
        }
      },

      clearImportedData: () => set({ importedDataReady: null }),

      fetchPendingJob: async (targetJobId) => {
        try {
          const idToUse = targetJobId || get().importJobId || undefined;
          const response = await api.get("/import/pending", {
            params: idToUse ? { jobId: idToUse } : {},
          });
          if (response.data) {
            if (idToUse && response.data.jobId !== idToUse) {
              return false;
            }
            stopImportPolling();
            set({
              importedDataReady: response.data.transactions,
              importJobId: response.data.jobId,
              isImportProcessing: false,
            });
            return true;
          }
        } catch (error) {
          console.error("Nepodařilo se načíst čekající import", error);
        }
        return false;
      },
    }),
    {
      name: "socket-store",
      partialize: (state) => ({
        importedDataReady: state.importedDataReady,
        importJobId: state.importJobId,
      }),
    },
  ),
);

