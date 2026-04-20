import api from "./axios";

export const getAdminDashboardSummaryRequest = async (weekNumber, year) => {
  const response = await api.get(
    `/dashboard/admin-summary?weekNumber=${weekNumber}&year=${year}`
  );
  return response.data;
};

export const getLeaderDashboardSummaryRequest = async (weekNumber, year) => {
  const response = await api.get(
    `/dashboard/leader-summary?weekNumber=${weekNumber}&year=${year}`
  );
  return response.data;
};

export const getMemberDashboardSummaryRequest = async (weekNumber, year) => {
  const response = await api.get(
    `/dashboard/member-summary?weekNumber=${weekNumber}&year=${year}`
  );
  return response.data;
};