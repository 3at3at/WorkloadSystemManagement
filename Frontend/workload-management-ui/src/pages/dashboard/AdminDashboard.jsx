import { useEffect, useState } from "react";
import DashboardShell from "../../components/layout/DashboardShell";
import StatCard from "../../components/layout/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getAdminDashboardSummaryRequest } from "../../api/dashboardApi";

const getCurrentWeekNumber = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
};

const AdminDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalTasks: 0,
    overloadedMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  const weekNumber = getCurrentWeekNumber();
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getAdminDashboardSummaryRequest(weekNumber, year);

        setStats({
          totalUsers: data?.totalUsers ?? 0,
          pendingApprovals: data?.pendingApprovals ?? 0,
          totalTasks: data?.totalTasks ?? 0,
          overloadedMembers: data?.overloadedMembers ?? 0,
        });
      } catch (error) {
        console.error("Failed to load admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [weekNumber, year]);

  return (
    <DashboardShell user={user} title="Admin Dashboard">
      <div style={styles.grid}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="All users except your own admin account"
          loading={loading}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Requests assigned to you for review"
          loading={loading}
        />
        <StatCard
          title="Total Tasks"
          value={stats.totalTasks}
          subtitle="Tasks across the whole platform"
          loading={loading}
        />
        <StatCard
          title="Overloaded Members"
          value={stats.overloadedMembers}
          subtitle="Members needing workload balancing"
          loading={loading}
        />
      </div>

      <div style={styles.bottomGrid}>
        <div style={styles.bigCard}>
          <h3 style={styles.cardTitle}>System Overview</h3>
          <p style={styles.cardText}>
            This dashboard gives the Admin a live overview of users, approvals,
            tasks, and workload pressure across the platform.
          </p>
        </div>

        <div style={styles.bigCard}>
          <h3 style={styles.cardTitle}>Quick Insight</h3>
          <p style={styles.cardText}>
            The system now supports real role-based visibility, structured
            approval routing, and workload tracking by hierarchy.
          </p>
        </div>
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
  bottomGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "18px",
  },
  bigCard: {
    padding: "26px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    minHeight: "220px",
  },
  cardTitle: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "14px",
    color: "#fff",
  },
  cardText: {
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.7,
    fontSize: "15px",
  },
};

export default AdminDashboard;
