import api from "./axios";

export const getAllUsersRequest = async () => {
  const response = await api.get("/users");
  return response.data;
};

export const getUserByIdRequest = async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
};

export const createUserRequest = async (data) => {
  const response = await api.post("/users", data);
  return response.data;
};

export const updateUserRequest = async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
};

export const deleteUserRequest = async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
};

export const updateUserStatusRequest = async (id, data) => {
  const response = await api.patch(`/users/${id}/status`, data);
  return response.data;
};