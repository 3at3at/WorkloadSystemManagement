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
      <div style={styles.roleBanner}>
        <div style={styles.roleIcon}>👤</div>
        <div>
          <h2 style={styles.roleLabel}>Team Member</h2>
          <p style={styles.roleDesc}>This is your personal workspace — track your assigned tasks, monitor your weekly workload score, and stay on top of what needs your attention.</p>
        </div>
      </div>

      <div style={styles.grid}>
        <StatCard
          title="My Tasks"
          value={stats.myTasks}
          subtitle="Tasks currently assigned to you"
          accent="#6ee7b7"
          loading={loading}
        />
        <StatCard
          title="New Tasks"
          value={stats.newTasks}
          subtitle="Tasks still in New status"
          accent="#6ee7b7"
          loading={loading}
        />
        <StatCard
          title="Weekly Workload"
          value={stats.weeklyWorkload}
          subtitle="Your current weekly workload score"
          accent="#6ee7b7"
          loading={loading}
        />
        <StatCard
          title="Workload Status"
          value={stats.workloadStatus}
          subtitle="Your workload condition this week"
          accent="#6ee7b7"
          loading={loading}
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
  roleBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    padding: "24px 28px",
    borderRadius: "24px",
    background: "rgba(5,150,105,0.12)",
    border: "1px solid rgba(5,150,105,0.3)",
    backdropFilter: "blur(14px)",
  },
  roleIcon: {
    fontSize: "48px",
    lineHeight: 1,
    flexShrink: 0,
  },
  roleLabel: {
    color: "#6ee7b7",
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
    background: "rgba(5,150,105,0.08)",
    border: "1px solid rgba(5,150,105,0.2)",
    minHeight: "220px",
  },
  title: {
    fontSize: "22px",
    fontWeight: "800",
    marginBottom: "14px",
    color: "#6ee7b7",
  },
  text: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "15px",
    lineHeight: 1.7,
  },
};

export default MemberDashboard;
