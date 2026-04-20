import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "../../components/layout/DashboardShell";
import StatCard from "../../components/layout/StatCard";
import { useAuth } from "../../context/AuthContext";
import { getMemberWorkloadRequest } from "../../api/workloadApi";

const getCurrentWeekNumber = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
};

const MyWorkloadPage = () => {
  const { user } = useAuth();

  const [weekNumber, setWeekNumber] = useState(getCurrentWeekNumber());
  const [year, setYear] = useState(new Date().getFullYear());
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const fetchMyWorkload = async () => {
    if (!user?.id) return;

    setLoading(true);
    setPageError("");

    try {
      const data = await getMemberWorkloadRequest(user.id, weekNumber, year);
      setWorkload(data);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load your workload."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyWorkload();
  }, [user?.id, weekNumber, year]);

  return (
    <DashboardShell user={user} title="My Workload">
      <div style={styles.filterCard}>
        <div>
          <h2 style={styles.sectionTitle}>My Weekly Workload</h2>
          <p style={styles.sectionSubtitle}>
            Track your personal workload and task pressure by week.
          </p>
        </div>

        <div style={styles.filterControls}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Week</label>
            <input
              style={styles.input}
              type="number"
              min="1"
              max="53"
              value={weekNumber}
              onChange={(e) => setWeekNumber(Number(e.target.value))}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Year</label>
            <input
              style={styles.input}
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {pageError && <div style={styles.errorBox}>{pageError}</div>}

      {loading ? (
        <div style={styles.loadingText}>Loading workload...</div>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <StatCard
              title="Total Weight"
              value={workload?.totalWeight ?? 0}
              subtitle="Your total weighted effort"
            />
            <StatCard
              title="Task Count"
              value={workload?.taskCount ?? 0}
              subtitle="Tasks due in this week"
            />
            <StatCard
              title="Workload Status"
              value={workload?.workloadStatus ?? "N/A"}
              subtitle="Your weekly workload state"
            />
          </div>

          <motion.div
            style={styles.statusCard}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 style={styles.statusTitle}>Current Status</h3>
            <p style={styles.statusText}>
              Week {weekNumber} of {year}:{" "}
              <span style={getStatusTextStyle(workload?.workloadStatus)}>
                {workload?.workloadStatus ?? "No data"}
              </span>
            </p>
          </motion.div>
        </>
      )}
    </DashboardShell>
  );
};

const getStatusTextStyle = (status) => {
  if (status === "Overloaded") {
    return { color: "#fca5a5", fontWeight: "800" };
  }

  if (status === "Balanced") {
    return { color: "#93c5fd", fontWeight: "800" };
  }

  return { color: "#86efac", fontWeight: "800" };
};

const styles = {
  filterCard: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "22px",
    backdropFilter: "blur(14px)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
  },
  sectionTitle: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "6px",
  },
  sectionSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "15px",
  },
  filterControls: {
    display: "flex",
    alignItems: "end",
    gap: "14px",
    flexWrap: "wrap",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "13px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.82)",
  },
  input: {
    minWidth: "120px",
    padding: "13px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  statusCard: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "24px",
    backdropFilter: "blur(14px)",
  },
  statusTitle: {
    color: "#fff",
    fontSize: "24px",
    fontWeight: "800",
    marginBottom: "10px",
  },
  statusText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "16px",
    lineHeight: 1.6,
  },
  loadingText: {
    color: "#fff",
    padding: "10px 6px",
    fontWeight: "600",
  },
  errorBox: {
    marginBottom: "6px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #fff1f2, #ffe4e6)",
    color: "#b91c1c",
    border: "1px solid #fecdd3",
    fontSize: "14px",
    fontWeight: "700",
  },
};

export default MyWorkloadPage;