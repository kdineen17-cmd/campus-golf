import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, UserSummary } from "../api";
import { setUnauthorizedHandler } from "../api/authEvents";

const TOKEN_KEY = "campus-golf/token";
const USER_KEY = "campus-golf/user";

interface AuthContextValue {
  token: string | null;
  user: UserSummary | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [storedToken, storedUser] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setIsLoading(false);
    })();
  }, []);

  async function clearSession() {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    setToken(null);
    setUser(null);
  }

  // Any API call that gets a 401 for a request that carried a token calls
  // this, so an expired/invalid session bounces cleanly back to login
  // instead of leaving screens stuck on a dead-end auth error.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      clearSession();
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  async function persist(nextToken: string, nextUser: UserSummary) {
    await Promise.all([
      AsyncStorage.setItem(TOKEN_KEY, nextToken),
      AsyncStorage.setItem(USER_KEY, JSON.stringify(nextUser)),
    ]);
    setToken(nextToken);
    setUser(nextUser);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      isLoading,
      async login(usernameOrEmail, password) {
        const res = await api.login(usernameOrEmail, password);
        await persist(res.token, res.user);
      },
      async register(username, email, password) {
        const res = await api.register(username, email, password);
        await persist(res.token, res.user);
      },
      logout: clearSession,
    }),
    [token, user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
