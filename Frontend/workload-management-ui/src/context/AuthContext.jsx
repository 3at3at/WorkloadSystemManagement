import { createContext, useContext, useState } from "react";
import { loginRequest } from "../api/authApi";
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

  const login = async (formData) => {
    setLoading(true);

    try {
      const data = await loginRequest(formData);

      const userData = {
        id: data.id,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
        teamLeaderId: data.teamLeaderId ?? null,
        teamLeaderName: data.teamLeaderName ?? null,
      };

      setToken(data.token);
      setUser(userData);

      setTokenState(data.token);
      setUserState(userData);

      return userData;
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