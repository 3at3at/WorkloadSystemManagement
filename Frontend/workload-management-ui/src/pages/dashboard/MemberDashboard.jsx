import { useEffect, useState } from "react";
import DashboardShell from "../../components/layout/DashboardShell";
import StatCard from "../../components/layout/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getMemberDashboardSummaryRequest } from "../../api/dashboardApi";

const getCurrentWeekNumber = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
};

const MemberDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    myTasks: 0,
    newTasks: 0,
    weeklyWorkload: 0,
    workloadStatus: "N/A",
  });
  const [loading, setLoading] = useState(true);

  const weekNumber = getCurrentWeekNumber();
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getMemberDashboardSummaryRequest(weekNumber, year);

        setStats({
          myTasks: data?.myTasks ?? 0,
          newTasks: data?.newTasks ?? 0,
          weeklyWorkload: data?.weeklyWorkload ?? 0,
          workloadStatus: data?.workloadStatus ?? "N/A",
        });
      } catch (error) {
        console.error("Failed to load member dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [weekNumber, year]);

  return (
    <DashboardShell user={user} title="Member Dashboard">
      <div style={styles.grid}>
        <StatCard
          title="My Tasks"
          value={loading ? "..." : stats.myTasks}
          subtitle="Tasks currently assigned to you"
        />
        <StatCard
          title="New Tasks"
          value={loading ? "..." : stats.newTasks}
          subtitle="Tasks still in New status"
        />
        <StatCard
          title="Weekly Workload"
          value={loading ? "..." : stats.weeklyWorkload}
          subtitle="Your current weekly workload score"
        />
        <StatCard
          title="Workload Status"
          value={loading ? "..." : stats.workloadStatus}
          subtitle="Your workload condition this week"
        />
      </div>

      <div style={styles.panel}>
        <h3 style={styles.title}>My Activity</h3>
        <p style={styles.text}>
          Here you can track your assigned tasks, current workload, and the work
          you need to start. This dashboard reflects your real activity inside
          the system.
        </p>
      </div>
    </DashboardShell>
  );
};

const styles = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  panel: {
    padding: "26px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    minHeight: "220px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "14px",
    color: "#fff",
  },
  text: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "15px",
    lineHeight: 1.7,
  },
};

export default MemberDashboard;