import api from "./axios";

export const loginRequest = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const registerRequest = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const getCurrentUserWithTokenRequest = async (token) => {
  const response = await api.get("/users/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};