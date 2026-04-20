import api from "./axios";

export const createApprovalRequest = async (data) => {
  const response = await api.post("/approvals", data);
  return response.data;
};

export const getPendingApprovalsRequest = async () => {
  const response = await api.get("/approvals/pending");
  return response.data;
};

export const getMyPendingApprovalsRequest = async () => {
  const response = await api.get("/approvals/my-pending");
  return response.data;
};

export const reviewApprovalRequest = async (approvalId, data) => {
  const response = await api.post(`/approvals/${approvalId}/review`, data);
  return response.data;
};