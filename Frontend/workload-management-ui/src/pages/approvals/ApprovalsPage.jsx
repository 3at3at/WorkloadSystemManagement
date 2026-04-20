import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import {
  createApprovalRequest,
  getMyPendingApprovalsRequest,
  reviewApprovalRequest,
} from "../../api/approvalsApi";
import { getAllTasksRequest, getMyTasksRequest } from "../../api/tasksApi";
import { getAllUsersRequest } from "../../api/usersApi";

const SIDEBAR_OFFSET = 388;

const ApprovalsPage = () => {
  const { user } = useAuth();

  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [approvers, setApprovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    taskId: "",
    targetApproverUserId: "",
    requestReason: "",
  });

  const canCreateRequest = user?.role === "Member" || user?.role === "TeamLeader";
  const canReview = user?.role === "Admin" || user?.role === "TeamLeader";

  const showToast = (message, type = "success") => {
    setToast({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchPendingApprovals = async () => {
    if (!canReview) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError("");

    try {
      const data = await getMyPendingApprovalsRequest();
      setPendingApprovals(data || []);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load pending approvals."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    if (!canCreateRequest) return;

    try {
      if (user?.role === "Member") {
        const myTasks = await getMyTasksRequest();
        setTasks((myTasks || []).filter((task) => task.status !== "Completed"));
        return;
      }

      if (user?.role === "TeamLeader") {
        const allTasks = await getAllTasksRequest();

        const filteredTasks = (allTasks || []).filter(
          (task) =>
            task.assignedToUserId === user.id || task.createdByUserId === user.id
        );

        setTasks(filteredTasks.filter((task) => task.status !== "Completed"));
        return;
      }

      setTasks([]);
    } catch (err) {
      console.log("Failed to load tasks", err);
      setTasks([]);
    }
  };

  const fetchApprovers = async () => {
    if (!canCreateRequest) return;

    try {
      if (user?.role === "Member") {
        if (user?.teamLeaderId && user?.teamLeaderName) {
          setApprovers([
            {
              id: user.teamLeaderId,
              fullName: user.teamLeaderName,
              role: "TeamLeader",
              isActive: true,
            },
          ]);
        } else {
          setApprovers([]);
        }
        return;
      }

      if (user?.role === "TeamLeader") {
        const data = await getAllUsersRequest();
        const users = Array.isArray(data) ? data : [];

        const admins = users.filter(
          (item) => item.role === "Admin" && item.isActive
        );

        setApprovers(admins);
        return;
      }

      setApprovers([]);
    } catch (err) {
      console.log("Failed to load approvers", err);
      setApprovers([]);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    fetchTasks();
    fetchApprovers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "taskId" || name === "targetApproverUserId"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formData.taskId) {
      setFormError("Please select a task.");
      setSubmitting(false);
      return;
    }

    if (!formData.targetApproverUserId) {
      setFormError("Please select a target approver.");
      setSubmitting(false);
      return;
    }

    try {
      await createApprovalRequest({
        taskId: Number(formData.taskId),
        targetApproverUserId: Number(formData.targetApproverUserId),
        requestReason: formData.requestReason,
      });

      showToast("Approval request submitted successfully.");
      setShowModal(false);
      setFormData({
        taskId: "",
        targetApproverUserId: "",
        requestReason: "",
      });
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to create approval request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (approvalId, approve) => {
    try {
      await reviewApprovalRequest(approvalId, { approve });
      showToast(`Approval request ${approve ? "approved" : "rejected"} successfully.`);
      fetchPendingApprovals();
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to review approval request."
      );
    }
  };

  return (
    <DashboardShell user={user} title="Approvals Center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            style={{
              ...styles.toast,
              ...(toast.type === "error" ? styles.toastError : styles.toastSuccess),
            }}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.sectionTitle}>Approval Workflow</h2>
          <p style={styles.sectionSubtitle}>
            Manage request approvals and keep major task changes under control.
          </p>
        </div>

        {canCreateRequest && (
          <motion.button
            style={styles.primaryButton}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
          >
            + Request Approval
          </motion.button>
        )}
      </div>

      {pageError && <div style={styles.errorBox}>{pageError}</div>}

      {canReview && (
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <h3 style={styles.cardTitle}>My Pending Approvals</h3>
            <p style={styles.cardSubtitle}>
              Requests currently assigned to you for review.
            </p>
          </div>

          {loading ? (
            <div style={styles.loadingText}>Loading approvals...</div>
          ) : pendingApprovals.length === 0 ? (
            <div style={styles.emptyText}>No pending approvals assigned to you.</div>
          ) : (
            <div style={styles.grid}>
              {pendingApprovals.map((approval) => (
                <motion.div
                  key={approval.id}
                  style={styles.approvalCard}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  whileHover={{ y: -4 }}
                >
                  <div style={styles.cardTop}>
                    <div>
                      <h4 style={styles.approvalTitle}>{approval.taskTitle}</h4>
                      <p style={styles.approvalMeta}>
                        Requested by: {approval.requestedBy}
                      </p>
                    </div>

                    <span style={styles.pendingBadge}>{approval.approvalStatus}</span>
                  </div>

                  <div style={styles.reasonBox}>
                    <p style={styles.reasonLabel}>Reason</p>
                    <p style={styles.reasonText}>{approval.requestReason}</p>
                  </div>

                  <div style={styles.actionRow}>
                    <motion.button
                      style={styles.approveButton}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleReview(approval.id, true)}
                    >
                      Approve
                    </motion.button>

                    <motion.button
                      style={styles.rejectButton}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleReview(approval.id, false)}
                    >
                      Reject
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={styles.modal}
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
            >
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Create Approval Request</h3>
                <motion.button
                  type="button"
                  style={styles.closeButton}
                  whileHover={{ scale: 1.08, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowModal(false)}
                >
                  ×
                </motion.button>
              </div>

              {formError && <div style={styles.errorBox}>{formError}</div>}

              <form onSubmit={handleCreateRequest} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Task</label>
                  <motion.select
                    whileHover={{ y: -1 }}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.18 }}
                    style={styles.input}
                    name="taskId"
                    value={formData.taskId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select task</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </motion.select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Target Approver</label>
                  <motion.select
                    whileHover={{ y: -1 }}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.18 }}
                    style={styles.input}
                    name="targetApproverUserId"
                    value={formData.targetApproverUserId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select approver</option>
                    {approvers.map((approver) => (
                      <option key={approver.id} value={approver.id}>
                        {approver.fullName} ({approver.role})
                      </option>
                    ))}
                  </motion.select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Request Reason</label>
                  <motion.textarea
                    whileHover={{ y: -1 }}
                    whileFocus={{ scale: 1.01 }}
                    transition={{ duration: 0.18 }}
                    style={styles.textarea}
                    name="requestReason"
                    value={formData.requestReason}
                    onChange={handleChange}
                    placeholder="Explain why this approval is needed..."
                    required
                  />
                </div>

                <motion.button
                  type="submit"
                  style={styles.primaryButton}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
};

const styles = {
  toast: {
    position: "fixed",
    top: "22px",
    right: "22px",
    zIndex: 2000,
    minWidth: "260px",
    padding: "14px 16px",
    borderRadius: "16px",
    color: "#fff",
    fontWeight: "800",
    boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
  },
  toastSuccess: {
    background: "linear-gradient(135deg, #10b981, #059669)",
  },
  toastError: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
  },
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "18px",
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
  card: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "22px",
    backdropFilter: "blur(14px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  cardHeader: {
    marginBottom: "18px",
  },
  cardTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#fff",
    marginBottom: "6px",
  },
  cardSubtitle: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
  },
  approvalCard: {
    padding: "22px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.07)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "16px",
  },
  approvalTitle: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "800",
    lineHeight: 1.35,
    marginBottom: "6px",
  },
  approvalMeta: {
    color: "rgba(255,255,255,0.68)",
    fontSize: "13px",
  },
  pendingBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(250,204,21,0.18)",
    color: "#fde68a",
    border: "1px solid rgba(250,204,21,0.28)",
    fontSize: "12px",
    fontWeight: "800",
  },
  reasonBox: {
    padding: "14px",
    borderRadius: "18px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    marginBottom: "16px",
  },
  reasonLabel: {
    color: "rgba(255,255,255,0.66)",
    fontSize: "12px",
    marginBottom: "8px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  reasonText: {
    color: "#fff",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  actionRow: {
    display: "flex",
    gap: "12px",
  },
  primaryButton: {
    padding: "14px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #2563eb)",
    color: "#fff",
    fontWeight: "800",
    boxShadow: "0 14px 28px rgba(79,70,229,0.25)",
  },
  approveButton: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: "800",
  },
  rejectButton: {
    flex: 1,
    padding: "12px 14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontWeight: "800",
  },
  loadingText: {
    color: "#fff",
    padding: "16px 6px",
    fontWeight: "600",
  },
  emptyText: {
    color: "rgba(255,255,255,0.72)",
    padding: "16px 6px",
    fontWeight: "600",
  },
  overlay: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: `${SIDEBAR_OFFSET}px`,
    background: "rgba(2,6,23,0.58)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 1000,
    padding: "72px 20px 28px",
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: "720px",
    background: "rgba(255,255,255,0.98)",
    borderRadius: "30px",
    padding: "30px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.30)",
    border: "1px solid rgba(226,232,240,0.9)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "#0f172a",
    letterSpacing: "-0.02em",
  },
  closeButton: {
    border: "none",
    background: "#f8fafc",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    fontSize: "24px",
    cursor: "pointer",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#334155",
  },
  input: {
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
    background: "#ffffff",
    transition: "all 0.22s ease",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  },
  textarea: {
    minHeight: "120px",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    background: "#ffffff",
    transition: "all 0.22s ease",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
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

export default ApprovalsPage;