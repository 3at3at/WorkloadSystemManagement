import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "../../components/layout/DashboardShell";
import StatCard from "../../components/layout/StatCard";
import { useAuth } from "../../context/AuthContext";
import {
  getMyWorkloadRequest,
  getTeamWorkloadRequest,
} from "../../api/workloadApi";

const getCurrentWeekNumber = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), 0, 1);
  const pastDays = Math.floor((now - firstDay) / 86400000);
  return Math.ceil((pastDays + firstDay.getDay() + 1) / 7);
};

const WorkloadPage = () => {
  const { user } = useAuth();

  const [weekNumber, setWeekNumber] = useState(getCurrentWeekNumber());
  const [year, setYear] = useState(new Date().getFullYear());
  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const isMember = user?.role === "Member";

  const fetchWorkload = async () => {
    setLoading(true);
    setPageError("");

    try {
      let data;

      if (isMember) {
        data = await getMyWorkloadRequest(weekNumber, year);
      } else {
        data = await getTeamWorkloadRequest(weekNumber, year);
      }

      setWorkload(data);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          (isMember
            ? "Failed to load your workload."
            : "Failed to load team workload.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkload();
  }, [weekNumber, year]);

  return (
    <DashboardShell
      user={user}
      title={isMember ? "My Workload" : "Workload Overview"}
    >
      <div style={styles.filterCard}>
        <div>
          <h2 style={styles.sectionTitle}>
            {isMember ? "My Workload Overview" : "Team Workload Overview"}
          </h2>
          <p style={styles.sectionSubtitle}>
            {isMember
              ? "Track your personal workload and task pressure by week."
              : "Monitor member capacity and spot overload quickly."}
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

          <motion.button
            style={styles.refreshButton}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={fetchWorkload}
          >
            Refresh
          </motion.button>
        </div>
      </div>

      {pageError && <div style={styles.errorBox}>{pageError}</div>}

      {loading ? (
        <div style={styles.loadingText}>Loading workload...</div>
      ) : isMember ? (
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

          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h3 style={styles.summaryTitle}>Current Status</h3>
              <p style={styles.summarySubtitle}>
                Week {weekNumber} — {year}
              </p>
            </div>

            <div style={styles.memberSingleCard}>
              <div style={styles.memberTopRow}>
                <div>
                  <h4 style={styles.memberName}>{user?.fullName}</h4>
                  <p style={styles.memberMeta}>User ID: {workload?.userId ?? "-"}</p>
                </div>

                <span style={getStatusBadgeStyle(workload?.workloadStatus || "Available")}>
                  {workload?.workloadStatus || "N/A"}
                </span>
              </div>

              <div style={styles.memberStatsRow}>
                <div style={styles.memberStatBox}>
                  <p style={styles.memberStatLabel}>Total Weight</p>
                  <p style={styles.memberStatValue}>{workload?.totalWeight ?? 0}</p>
                </div>

                <div style={styles.memberStatBox}>
                  <p style={styles.memberStatLabel}>Task Count</p>
                  <p style={styles.memberStatValue}>{workload?.taskCount ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div style={styles.statsGrid}>
            <StatCard
              title="Overloaded Members"
              value={workload?.overloadedCount ?? 0}
              subtitle="Need workload reduction"
            />
            <StatCard
              title="Balanced Members"
              value={workload?.balancedCount ?? 0}
              subtitle="Healthy workload level"
            />
            <StatCard
              title="Available Members"
              value={workload?.availableCount ?? 0}
              subtitle="Can take more tasks"
            />
          </div>

          <div style={styles.summaryCard}>
            <div style={styles.summaryHeader}>
              <h3 style={styles.summaryTitle}>Team Members Summary</h3>
              <p style={styles.summarySubtitle}>
                Week {weekNumber} — {year}
              </p>
            </div>

            {!workload?.members || workload.members.length === 0 ? (
              <div style={styles.emptyText}>No members found for this week.</div>
            ) : (
              <div style={styles.membersGrid}>
                {workload.members.map((member) => (
                  <motion.div
                    key={member.userId}
                    style={styles.memberCard}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.22 }}
                    whileHover={{ y: -4 }}
                  >
                    <div style={styles.memberTopRow}>
                      <div>
                        <h4 style={styles.memberName}>{member.fullName}</h4>
                        <p style={styles.memberMeta}>User ID: {member.userId}</p>
                        <p style={styles.memberLeaderText}>
                          Team Leader: {member.teamLeaderName || "Not assigned"}
                        </p>
                      </div>

                      <span style={getStatusBadgeStyle(member.workloadStatus)}>
                        {member.workloadStatus}
                      </span>
                    </div>

                    <div style={styles.memberStatsRow}>
                      <div style={styles.memberStatBox}>
                        <p style={styles.memberStatLabel}>Total Weight</p>
                        <p style={styles.memberStatValue}>{member.totalWeight}</p>
                      </div>

                      <div style={styles.memberStatBox}>
                        <p style={styles.memberStatLabel}>Task Count</p>
                        <p style={styles.memberStatValue}>{member.taskCount}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
};

const getStatusBadgeStyle = (status) => {
  const base = {
    padding: "10px 14px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: "800",
    display: "inline-block",
  };

  if (status === "Overloaded") {
    return {
      ...base,
      background: "rgba(239,68,68,0.18)",
      color: "#fca5a5",
      border: "1px solid rgba(239,68,68,0.28)",
    };
  }

  if (status === "Balanced") {
    return {
      ...base,
      background: "rgba(59,130,246,0.18)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.28)",
    };
  }

  return {
    ...base,
    background: "rgba(16,185,129,0.18)",
    color: "#86efac",
    border: "1px solid rgba(16,185,129,0.28)",
  };
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
  refreshButton: {
    padding: "13px 18px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #2563eb)",
    color: "#fff",
    fontWeight: "800",
    boxShadow: "0 14px 28px rgba(79,70,229,0.25)",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },
  summaryCard: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "24px",
    backdropFilter: "blur(14px)",
  },
  summaryHeader: {
    marginBottom: "18px",
  },
  summaryTitle: {
    color: "#fff",
    fontSize: "24px",
    fontWeight: "800",
    marginBottom: "8px",
  },
  summarySubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "15px",
  },
  membersGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "18px",
  },
  memberSingleCard: {
    padding: "22px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  memberCard: {
    padding: "22px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  memberTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "18px",
  },
  memberName: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "800",
    lineHeight: 1.35,
    marginBottom: "8px",
  },
  memberMeta: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
    marginBottom: "4px",
  },
  memberLeaderText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
    marginBottom: "2px",
  },
  memberStatsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "14px",
  },
  memberStatBox: {
    padding: "18px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  memberStatLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: "14px",
    marginBottom: "10px",
  },
  memberStatValue: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: "800",
  },
  loadingText: {
    color: "#fff",
    padding: "10px 6px",
    fontWeight: "600",
  },
  emptyText: {
    color: "rgba(255,255,255,0.72)",
    padding: "12px 6px",
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

export default WorkloadPage;