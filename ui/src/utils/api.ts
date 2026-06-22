import axios from "axios";
import { useAuthStore } from "../store/authStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const api = axios.create({
  baseURL: API_URL,
});

// před odesláním rq vezmeme access token ze storu a dame jej do headeru
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// po prijeti odpovedi (chytani 401)
api.interceptors.response.use(
  (response) => response, // pokud je odpověď OK, jen ji vrátíme
  async (error) => {
    const originalRequest = error.config;

    // pokud api vratilo 401 a jeste jsme to nezkouseli znovu
    // (_retry je nase vlastni vlajecka, aby nedošlo k nekonečnému loopu)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // nastavíme vlaječku, že už jsme to zkoušeli

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        // uložíme nové tokeny do storu
        useAuthStore.getState().setTokens(access_token, refresh_token);

        // zopakujeme původní rq s novým access tokenem
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest); // znovu posíláme původní rq
      } catch (error) {
        // pokud se nepodaří obnovit tokeny, přesměrujeme uživatele na přihlášení
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error); // pro ostatní chyby jen předáme dál
  },
);
