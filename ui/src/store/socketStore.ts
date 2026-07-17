import { create } from "zustand";
import { persist } from "zustand/middleware";
import { io, Socket } from "socket.io-client";
import { toast } from "react-hot-toast";
import i18n from "../i18n";
import { useNotificationStore } from "./notificationStore";
import { useAuthStore } from "./authStore";

interface SocketState {
  socket: Socket | null;
  isImportProcessing: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  importedDataReady: any[] | null;
  importJobId: string | null;

  connectSocket: () => void;
  disconnectSocket: () => void;
  setImportProcessing: (status: boolean) => void;
  clearImportedData: () => void;
}

//const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
const SOCKET_PATH = import.meta.env.VITE_SOCKET_PATH || "/socket.io";

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

        const newSocket = io(window.location.origin,{
          path: SOCKET_PATH,
          withCredentials: true,
          auth: { token },
        });

    newSocket.on("connect", () => {
      console.log("WebSocket connected.");
    });

    newSocket.on("import_finished", (payload) => {
      if (payload.status === "success") {
        set({ isImportProcessing: false, importedDataReady: payload.data, importJobId: payload.jobId });
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
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },

  setImportProcessing: (status) => set({ isImportProcessing: status }),

  clearImportedData: () => set({ importedDataReady: null }),
    }),
    {
      name: "socket-store",
      partialize: (state) => ({
        importedDataReady: state.importedDataReady,
        importJobId: state.importJobId,
      }),
    }
  )
);
