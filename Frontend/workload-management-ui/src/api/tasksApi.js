import api from "./axios";

export const getAllTasksRequest = async () => {
  const response = await api.get("/tasks");
  return response.data;
};

export const getMyTasksRequest = async () => {
  const response = await api.get("/tasks/my-tasks");
  return response.data;
};

export const getTaskByIdRequest = async (id) => {
  const response = await api.get(`/tasks/${id}`);
  return response.data;
};

export const createTaskRequest = async (data) => {
  const response = await api.post("/tasks", data);
  return response.data;
};

export const updateTaskRequest = async (id, data) => {
  const response = await api.put(`/tasks/${id}`, data);
  return response.data;
};

export const updateMyTaskStatusRequest = async (id, data) => {
  const response = await api.patch(`/tasks/${id}/status`, data);
  return response.data;
};

export const deleteTaskRequest = async (id) => {
  const response = await api.delete(`/tasks/${id}`);
  return response.data;
};

export const completeTaskRequest = async (id) => {
  const response = await api.patch(`/tasks/${id}/complete`);
  return response.data;
};