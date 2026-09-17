import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * User interface representing the structure of a user object in the authentication state.
 */
interface User {
  id: string;
  email: string;
  username: string;
  baseCurrency: string;
  role?: "USER" | "ADMIN";
}

/**
 * AuthState interface defines the structure of the authentication state managed by the auth store.
 */
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;

  /**
   * Sets the authentication state with the authenticated user profile and token pair.
   *
   * @param user - The authenticated user profile object.
   * @param accessToken - The JWT access token for API authorization.
   * @param refreshToken - The JWT refresh token used to obtain new access tokens.
   */
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;

  /**
   * Updates only the access and refresh tokens in state (e.g. after a silent token refresh).
   *
   * @param accessToken - The newly issued JWT access token.
   * @param refreshToken - The newly issued JWT refresh token.
   */
  setTokens: (accessToken: string, refreshToken: string) => void;

  /**
   * Clears all authentication state and tokens, effectively logging out the user.
   */
  logout: () => void;
}

/**
 * Custom hook for managing the authentication state.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      /**
       * Sets the authentication state with user information and tokens.
       *
       * @param user - The authenticated user profile object.
       * @param accessToken - The JWT access token for API authorization.
       * @param refreshToken - The JWT refresh token used to obtain new access tokens.
       */
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),

      /**
       * Updates the access and refresh tokens in the authentication state.
       *
       * @param accessToken - The newly issued JWT access token.
       * @param refreshToken - The newly issued JWT refresh token.
       */
      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken }),

      /**
       * Clears the authentication state, effectively logging the user out.
       */
      logout: () => set({ user: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: "auth-storage", // Key for localStorage
    },
  ),
);
