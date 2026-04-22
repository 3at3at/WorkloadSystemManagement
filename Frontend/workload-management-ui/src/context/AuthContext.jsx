import { createContext, useContext, useState } from "react";
import {
  getCurrentUserWithTokenRequest,
  loginRequest,
} from "../api/authApi";
import {
  clearAuthStorage,
  getToken,
  getUser,
  setToken,
  setUser,
} from "../utils/storage";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setTokenState] = useState(getToken());
  const [user, setUserState] = useState(getUser());
  const [loading, setLoading] = useState(false);

  const normalizeUserData = (data) => ({
    id: data.id,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    isActive: data.isActive,
    teamLeaderId: data.teamLeaderId ?? null,
    teamLeaderName: data.teamLeaderName ?? null,
  });

  const login = async (formData) => {
    setLoading(true);

    try {
      const data = await loginRequest(formData);
      const loginToken = data?.token;

      if (!loginToken) {
        throw new Error("Login failed. Missing token.");
      }

      setToken(loginToken);
      setTokenState(loginToken);

      let userData;

      if (data?.id && data?.role) {
        userData = normalizeUserData(data);
      } else {
        const me = await getCurrentUserWithTokenRequest(loginToken);
        userData = normalizeUserData(me);
      }

      setUser(userData);
      setUserState(userData);

      return userData;
    } catch (error) {
      clearAuthStorage();
      setTokenState(null);
      setUserState(null);

      const message =
        error?.response?.data?.message ||
        "Login failed. Please try again.";

      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuthStorage();
    setTokenState(null);
    setUserState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
