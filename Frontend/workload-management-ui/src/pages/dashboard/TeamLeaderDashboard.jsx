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
      <div style={styles.roleBanner}>
        <div style={styles.roleIcon}>🧠</div>
        <div>
          <h2 style={styles.roleLabel}>Team Leader</h2>
          <p style={styles.roleDesc}>You oversee your team's workload — assign and track tasks within your scope, review member approval requests, and escalate decisions to Admin when needed.</p>
        </div>
      </div>

      <div style={styles.grid}>
        <StatCard
          title="Assigned Tasks"
          value={stats.assignedTasks}
          subtitle="Tasks under your leadership scope"
          accent="#a5b4fc"
          loading={loading}
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingApprovals}
          subtitle="Requests sent to you by members"
          accent="#a5b4fc"
          loading={loading}
        />
        <StatCard
          title="Balanced Members"
          value={stats.balancedMembers}
          subtitle="Members with healthy workload"
          accent="#a5b4fc"
          loading={loading}
        />
        <StatCard
          title="Overloaded Members"
          value={stats.overloadedMembers}
          subtitle="Members who may need support"
          accent="#a5b4fc"
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
  roleBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    padding: "24px 28px",
    borderRadius: "24px",
    background: "rgba(99,102,241,0.12)",
    border: "1px solid rgba(99,102,241,0.3)",
    backdropFilter: "blur(14px)",
  },
  roleIcon: {
    fontSize: "48px",
    lineHeight: 1,
    flexShrink: 0,
  },
  roleLabel: {
    color: "#a5b4fc",
    fontSize: "20px",
    fontWeight: "800",
    margin: "0 0 8px",
    letterSpacing: "-0.01em",
  },
  roleDesc: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "14px",
    lineHeight: 1.7,
    margin: 0,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  panel: {
    padding: "26px",
    borderRadius: "24px",
    background: "rgba(99,102,241,0.08)",
    border: "1px solid rgba(99,102,241,0.2)",
    minHeight: "220px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "14px",
    color: "#a5b4fc",
  },
  text: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "15px",
    lineHeight: 1.7,
  },
};

export default TeamLeaderDashboard;
