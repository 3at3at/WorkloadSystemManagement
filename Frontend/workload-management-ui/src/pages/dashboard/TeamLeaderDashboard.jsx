import { useEffect, useState } from "react";
import DashboardShell from "../../components/layout/DashboardShell";
import StatCard from "../../components/layout/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getLeaderDashboardSummaryRequest } from "../../api/dashboardApi";

const getCurrentWeekNumber = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
};

const TeamLeaderDashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    assignedTasks: 0,
    pendingApprovals: 0,
    balancedMembers: 0,
    overloadedMembers: 0,
  });
  const [loading, setLoading] = useState(true);

  const weekNumber = getCurrentWeekNumber();
  const year = new Date().getFullYear();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const data = await getLeaderDashboardSummaryRequest(weekNumber, year);

        setStats({
          assignedTasks: data?.assignedTasks ?? 0,
          pendingApprovals: data?.pendingApprovals ?? 0,
          balancedMembers: data?.balancedMembers ?? 0,
          overloadedMembers: data?.overloadedMembers ?? 0,
        });
      } catch (error) {
        console.error("Failed to load team leader dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [weekNumber, year]);

  return (
    <DashboardShell user={user} title="Team Leader Dashboard">
      <div style={styles.grid}>
        <StatCard
          title="Assigned Tasks"
          value={stats.assignedTasks}
          subtitle="Tasks under your leadership scope"
          loading={loading}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Requests sent to you by members"
          loading={loading}
        />
        <StatCard
          title="Balanced Members"
          value={stats.balancedMembers}
          subtitle="Members with healthy workload"
          loading={loading}
        />
        <StatCard
          title="Overloaded Members"
          value={stats.overloadedMembers}
          subtitle="Members who may need support"
          loading={loading}
        />
      </div>

      <div style={styles.panel}>
        <h3 style={styles.title}>Leadership Overview</h3>
        <p style={styles.text}>
          As a Team Leader, you can monitor your team, assign tasks inside your
          scope, review member approval requests, and escalate major changes to
          Admin when needed.
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

export default TeamLeaderDashboard;
