import axios from "axios";
import { useAuthStore } from "../store/authStore";

// Set the base URL for the API, defaulting to localhost if not specified in environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Axios instance configured for API requests, including automatic token handling and refresh logic.
 */
export const api = axios.create({
  baseURL: API_URL,
});

/**
 * Request interceptor to automatically attach the access token from the auth store to the Authorization header of each request.
 */
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Response interceptor to handle 401 Unauthorized errors by attempting to refresh the access token using the refresh token.
 */
api.interceptors.response.use(
  (response) => response, // If the response is OK, return it unchanged
  async (error) => {
    const originalRequest = error.config;

    if (originalRequest.url.includes("/auth/login")) {
      return Promise.reject(error); // if its the login request, we don't want to retry
    }

    // If the response status is 401 (Unauthorized) and we haven't already retried this request, attempt to refresh the access token using the refresh token.
    // (_retry is our custom flag to prevent infinite loops)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // set the retry flag to true to prevent infinite loops

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          return Promise.reject(error); // if we dont have a refresh token, we can't refresh, so we just reject
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { access_token, refresh_token } = response.data;

        // Save the new tokens in the auth store
        useAuthStore.getState().setTokens(access_token, refresh_token);

        // Retry the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest); // Send the original request again with the new access token
      } catch (error) {
        // If refreshing the token fails (e.g., the refresh token is invalid or expired), log the user out and reject the promise.
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error); // If the error is not a 401 or if we've already retried, just reject the promise with the error.
  },
);
