import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import { getMyTasksRequest } from "../../api/tasksApi";

const MyTasksPage = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const fetchMyTasks = async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await getMyTasksRequest();
      setTasks(data || []);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load your tasks."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, []);

  return (
    <DashboardShell user={user} title="My Tasks">
      <div style={styles.header}>
        <h2 style={styles.title}>My Assigned Tasks</h2>
        <p style={styles.subtitle}>
          Track the tasks currently assigned to you.
        </p>
      </div>

      {pageError && <div style={styles.errorBox}>{pageError}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingText}>Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div style={styles.emptyText}>No tasks assigned to you yet.</div>
        ) : (
          <div style={styles.grid}>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                style={styles.taskCard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                whileHover={{ y: -4 }}
              >
                <div style={styles.topRow}>
                  <h3 style={styles.taskTitle}>{task.title}</h3>
                  <span style={getStatusBadgeStyle(task.status)}>{task.status}</span>
                </div>

                <div style={styles.metaRow}>
                  <span style={getPriorityBadgeStyle(task.priority)}>{task.priority}</span>
                  <span style={getComplexityBadgeStyle(task.complexity)}>{task.complexity}</span>
                </div>

                <div style={styles.infoBlock}>
                  <p style={styles.infoText}>
                    <strong>Created By:</strong> {task.createdBy}
                  </p>
                  <p style={styles.infoText}>
                    <strong>Estimated Hours:</strong> {task.estimatedHours}
                  </p>
                  <p style={styles.infoText}>
                    <strong>Weight:</strong> {task.weight}
                  </p>
                  <p style={styles.infoText}>
                    <strong>Due Date:</strong>{" "}
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

const getStatusBadgeStyle = (status) => {
  const base = {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  };

  if (status === "Completed") {
    return { ...base, background: "rgba(16,185,129,0.18)", color: "#86efac" };
  }

  if (status === "InProgress") {
    return { ...base, background: "rgba(59,130,246,0.18)", color: "#93c5fd" };
  }

  if (status === "Blocked") {
    return { ...base, background: "rgba(239,68,68,0.18)", color: "#fca5a5" };
  }

  return { ...base, background: "rgba(250,204,21,0.18)", color: "#fde68a" };
};

const getPriorityBadgeStyle = (priority) => {
  const base = {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  };

  if (priority === "Critical") {
    return { ...base, background: "rgba(239,68,68,0.18)", color: "#fca5a5" };
  }

  if (priority === "High") {
    return { ...base, background: "rgba(249,115,22,0.18)", color: "#fdba74" };
  }

  if (priority === "Medium") {
    return { ...base, background: "rgba(59,130,246,0.18)", color: "#93c5fd" };
  }

  return { ...base, background: "rgba(16,185,129,0.18)", color: "#86efac" };
};

const getComplexityBadgeStyle = (complexity) => {
  const base = {
    padding: "6px 10px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
  };

  if (complexity === "Hard") {
    return { ...base, background: "rgba(139,92,246,0.18)", color: "#c4b5fd" };
  }

  if (complexity === "Medium") {
    return { ...base, background: "rgba(14,165,233,0.18)", color: "#7dd3fc" };
  }

  return { ...base, background: "rgba(16,185,129,0.18)", color: "#86efac" };
};

const styles = {
  header: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  title: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#fff",
  },
  subtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "15px",
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "20px",
    backdropFilter: "blur(14px)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  taskCard: {
    padding: "22px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  taskTitle: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "800",
    lineHeight: 1.35,
  },
  metaRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  infoBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "14px",
    lineHeight: 1.5,
  },
  loadingText: {
    color: "#fff",
    padding: "18px 6px",
    fontWeight: "600",
  },
  emptyText: {
    color: "rgba(255,255,255,0.72)",
    padding: "18px 6px",
    fontWeight: "600",
  },
  errorBox: {
    marginBottom: "8px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "linear-gradient(135deg, #fff1f2, #ffe4e6)",
    color: "#b91c1c",
    border: "1px solid #fecdd3",
    fontSize: "14px",
    fontWeight: "700",
  },
};

export default MyTasksPage;