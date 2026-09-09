import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  getProfile,
  login as apiLogin,
  register as apiRegister,
  User,
} from "./api";

interface AuthContextType {
  user: User | null;
  session: string | null;
  loading: boolean;
  signUp: (
    name: string,
    email: string,
    password: string
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    getProfile()
      .then((response) => {
        const profile = response.user || response.data;

        if (profile) {
          setUser(profile);
          setSession(token);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        setUser(null);
        setSession(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  async function signUp(
    name: string,
    email: string,
    password: string
  ) {
    const response = await apiRegister(
      name,
      email,
      password
    );

    localStorage.setItem("token", response.token);

    setSession(response.token);
    setUser(response.user);
  }

  async function signIn(
    email: string,
    password: string
  ) {
    const response = await apiLogin(email, password);

    localStorage.setItem("token", response.token);

    setSession(response.token);
    setUser(response.user);
  }

  function signOut() {
    localStorage.removeItem("token");
    setUser(null);
    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}