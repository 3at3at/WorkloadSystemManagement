import api from "./axios";

export const getTeamWorkloadRequest = async (weekNumber, year) => {
  const response = await api.get(`/workload/team?weekNumber=${weekNumber}&year=${year}`);
  return response.data;
};

export const getMyWorkloadRequest = async (weekNumber, year) => {
  const response = await api.get(`/workload/my?weekNumber=${weekNumber}&year=${year}`);
  return response.data;
};

export const getMemberWorkloadRequest = async (userId, weekNumber, year) => {
  const response = await api.get(
    `/workload/member/${userId}?weekNumber=${weekNumber}&year=${year}`
  );
  return response.data;
};