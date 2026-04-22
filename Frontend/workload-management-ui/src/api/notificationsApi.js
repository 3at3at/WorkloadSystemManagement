import api from "./axios";

export const getMyNotificationsRequest = async () => {
  const response = await api.get("/notifications/my");
  return response.data;
};

export const getUnreadNotificationsCountRequest = async () => {
  const response = await api.get("/notifications/unread-count");
  return response.data;
};

export const markNotificationAsReadRequest = async (id) => {
  const response = await api.post(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsReadRequest = async () => {
  const response = await api.post("/notifications/read-all");
  return response.data;
};
