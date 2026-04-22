import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import {
  createApprovalRequest,
  getMyPendingApprovalsRequest,
  reviewApprovalRequest,
} from "../../api/approvalsApi";
import { getMyTasksRequest } from "../../api/tasksApi";
import { getAllUsersRequest } from "../../api/usersApi";

const initialFormData = {
  taskId: "",
  targetApproverUserId: "",
  reason: "",
};

const SIDEBAR_OFFSET = 388;

const ApprovalsPage = () => {
  const { user } = useAuth();

  const [approvals, setApprovals] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [approverOptions, setApproverOptions] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
    danger: false,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState(initialFormData);

  const isAdmin = user?.role === "Admin";
  const isTeamLeader = user?.role === "TeamLeader";
  const isMember = user?.role === "Member";
  const canCreateApproval = isMember || isTeamLeader;
  const isCompact = windowWidth < 860;

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const filteredApprovals = useMemo(() => {
    return approvals.filter((item) => {
      return (
        (item.taskTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.requestedBy || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.targetApprover || item.targetApproverName || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (item.requestReason || item.reason || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    });
  }, [approvals, searchTerm]);

  const resetModalState = () => {
    setFormError("");
    setFormData({
      taskId: "",
      targetApproverUserId: isMember ? user?.teamLeaderId ?? "" : "",
      reason: "",
    });
  };

  const fetchApprovals = async () => {
    if (!isAdmin && !isTeamLeader) {
      setApprovals([]);
      setLoading(false);
      return;
    }

    try {
      const data = await getMyPendingApprovalsRequest();
      setApprovals(data || []);
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

  const fetchCreateModalData = async () => {
    if (!canCreateApproval) return;

    try {
      const [tasksData, usersData] = await Promise.all([
        getMyTasksRequest(),
        getAllUsersRequest(),
      ]);

      const activeTasks = (tasksData || []).filter(
        (task) => normalizeTaskStatus(task.status) !== "Completed"
      );
      setMyTasks(activeTasks);

      if (isMember) {
        setApproverOptions(
          user?.teamLeaderId
            ? [
                {
                  id: user.teamLeaderId,
                  fullName: user.teamLeaderName || "My Team Leader",
                  role: "TeamLeader",
                },
              ]
            : []
        );
      } else if (isTeamLeader) {
        const admins = (usersData || []).filter(
          (item) => item.role === "Admin" && item.isActive
        );
        setApproverOptions(admins);
      }
    } catch {
      setMyTasks([]);
      setApproverOptions([]);
    }
  };

  useEffect(() => {
    fetchApprovals();
    fetchCreateModalData();
  }, []);

  useEffect(() => {
    if (isMember) {
      setFormData((prev) => ({
        ...prev,
        targetApproverUserId: user?.teamLeaderId ?? "",
      }));
    }
  }, [isMember, user?.teamLeaderId]);

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

  const handleSubmitApproval = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        taskId: Number(formData.taskId),
        targetApproverUserId: Number(formData.targetApproverUserId),
        requestReason: formData.reason.trim(),
      };

      await createApprovalRequest(payload);
      showToast("Approval request submitted successfully.");
      setShowModal(false);
      resetModalState();
      fetchApprovals();
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

  const askReviewApproval = (approvalId, approve) => {
    setConfirmState({
      open: true,
      title: approve ? "Approve Request" : "Reject Request",
      message: approve
        ? "Are you sure you want to approve this request?"
        : "Are you sure you want to reject this request?",
      danger: !approve,
      action: async () => {
        await reviewApprovalRequest(approvalId, { approve });
        showToast(
          approve
            ? "Approval request approved successfully."
            : "Approval request rejected successfully."
        );
        fetchApprovals();
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmState.action) return;

    try {
      await confirmState.action();
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Action failed.",
        "error"
      );
    } finally {
      setConfirmState({
        open: false,
        title: "",
        message: "",
        action: null,
        danger: false,
      });
    }
  };

  const getApprovalsTitle = () => {
    if (isAdmin) return "My Pending Approvals";
    if (isTeamLeader) return "Pending Team Requests";
    return "Request Approval";
  };

  const getApprovalsSubtitle = () => {
    if (isAdmin) return "Requests currently assigned to you for review.";
    if (isTeamLeader) return "Review requests submitted to you by your members.";
    return "Create and submit approval requests for your assigned tasks.";
  };

  return (
    <DashboardShell user={user} title="Approvals Center">
      <style>{`
        input::placeholder,
        textarea::placeholder {
          color: rgba(255,255,255,0.55);
        }
      `}</style>

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

        {canCreateApproval && (
          <motion.button
            style={styles.primaryButton}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              resetModalState();
              setShowModal(true);
            }}
          >
            + Request Approval
          </motion.button>
        )}
      </div>

      {(isAdmin || isTeamLeader) && (
        <div style={styles.filtersCard}>
          <input
            style={{ ...styles.filterInput, flex: 1 }}
            type="text"
            placeholder="Search by task, requester, approver, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {pageError && <div style={styles.errorBox}>{pageError}</div>}

      <div style={styles.card}>
        <div style={styles.panelHeader}>
          <div>
            <h3 style={styles.panelTitle}>{getApprovalsTitle()}</h3>
            <p style={styles.panelSubtitle}>{getApprovalsSubtitle()}</p>
          </div>
        </div>

        {isAdmin || isTeamLeader ? (
          loading ? (
            <div style={styles.loadingText}>Loading approvals...</div>
          ) : filteredApprovals.length === 0 ? (
            <div style={styles.emptyText}>No pending approvals assigned to you.</div>
          ) : (
            <div
              style={{
                ...styles.grid,
                ...(isCompact ? styles.gridCompact : {}),
              }}
            >
              {filteredApprovals.map((approval) => (
                <motion.div
                  key={approval.id}
                  style={styles.approvalCard}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4 }}
                >
                  <div style={styles.cardTopRow}>
                    <h3 style={styles.approvalTitle}>{approval.taskTitle || "Task Request"}</h3>
                    <span style={styles.pendingBadge}>Pending</span>
                  </div>

                  <div style={styles.infoBlock}>
                    <p style={styles.infoText}>
                      <strong>Requested By:</strong> {approval.requestedBy || "-"}
                    </p>
                    <p style={styles.infoText}>
                      <strong>Approver:</strong> {approval.targetApprover || approval.targetApproverName || "-"}
                    </p>
                    <p style={styles.infoText}>
                      <strong>Reason:</strong> {approval.requestReason || approval.reason || "-"}
                    </p>
                    {approval.requestedAt && (
                      <p style={styles.infoText}>
                        <strong>Requested At:</strong>{" "}
                        {new Date(approval.requestedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <div style={styles.actionsRow}>
                    <button
                      style={styles.successButton}
                      onClick={() => askReviewApproval(approval.id, true)}
                    >
                      Approve
                    </button>
                    <button
                      style={styles.dangerButton}
                      onClick={() => askReviewApproval(approval.id, false)}
                    >
                      Reject
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )
        ) : (
          <div style={styles.memberEmptyBox}>
            <p style={styles.memberEmptyText}>
              Use the button above to create a new approval request for one of your assigned tasks.
            </p>
          </div>
        )}
      </div>

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
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>Create Approval Request</h3>
                  <p style={styles.modalSubtitle}>
                    Submit a request for task approval with a clear reason.
                  </p>
                </div>

                <button
                  style={styles.closeButton}
                  onClick={() => {
                    setShowModal(false);
                    resetModalState();
                  }}
                >
                  ×
                </button>
              </div>

              {formError && <div style={styles.errorBox}>{formError}</div>}

              <form onSubmit={handleSubmitApproval} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Task</label>
                  <select
                    style={styles.input}
                    name="taskId"
                    value={formData.taskId}
                    onChange={handleChange}
                    required
                  >
                    <option style={styles.selectOption} value="">
                      Select task
                    </option>
                    {myTasks.map((task) => (
                      <option style={styles.selectOption} key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Target Approver</label>
                  <select
                    style={styles.input}
                    name="targetApproverUserId"
                    value={formData.targetApproverUserId}
                    onChange={handleChange}
                    required
                    disabled={isMember && !!user?.teamLeaderId}
                  >
                    <option style={styles.selectOption} value="">
                      Select approver
                    </option>
                    {approverOptions.map((item) => (
                      <option style={styles.selectOption} key={item.id} value={item.id}>
                        {item.fullName} ({item.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Reason</label>
                  <textarea
                    style={styles.textarea}
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    placeholder="Explain why this approval is needed..."
                    required
                  />
                </div>

                <div style={styles.modalActions}>
                  <button
                    type="button"
                    style={styles.cancelButtonDark}
                    onClick={() => {
                      setShowModal(false);
                      resetModalState();
                    }}
                  >
                    Cancel
                  </button>

                  <button type="submit" style={styles.primaryButton} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmState.open && (
          <motion.div
            style={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              style={styles.confirmModal}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.96 }}
            >
              <h3 style={styles.confirmTitle}>{confirmState.title}</h3>
              <p style={styles.confirmText}>{confirmState.message}</p>

              <div style={styles.confirmActions}>
                <button
                  style={styles.cancelButton}
                  onClick={() =>
                    setConfirmState({
                      open: false,
                      title: "",
                      message: "",
                      action: null,
                      danger: false,
                    })
                  }
                >
                  Cancel
                </button>

                <button
                  style={confirmState.danger ? styles.dangerButton : styles.successButton}
                  onClick={handleConfirmAction}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
};

const normalizeTaskStatus = (value) => {
  if (value === 1 || value === "1" || value === "New") return "New";
  if (value === 2 || value === "2" || value === "InProgress" || value === "In Progress") return "In Progress";
  if (value === 3 || value === "3" || value === "Blocked") return "Blocked";
  if (value === 4 || value === "4" || value === "Completed") return "Completed";
  return String(value);
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
  filtersCard: {
    display: "grid",
    gridTemplateColumns: "minmax(240px, 1fr)",
    gap: "12px",
  },
  filterInput: {
    padding: "14px 16px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    minHeight: "50px",
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "20px",
    backdropFilter: "blur(14px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "16px",
    alignItems: "flex-start",
    marginBottom: "18px",
  },
  panelTitle: {
    color: "#fff",
    fontSize: "22px",
    fontWeight: "800",
    margin: 0,
  },
  panelSubtitle: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "14px",
    marginTop: "6px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
  },
  gridCompact: {
    gridTemplateColumns: "1fr",
  },
  approvalCard: {
    padding: "22px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.07)",
    minHeight: "220px",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
    marginBottom: "14px",
    flexWrap: "wrap",
  },
  approvalTitle: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
    lineHeight: 1.35,
  },
  pendingBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    background: "rgba(250,204,21,0.18)",
    color: "#fde68a",
    border: "1px solid rgba(250,204,21,0.28)",
  },
  infoBlock: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  infoText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "14px",
    lineHeight: 1.6,
  },
  actionsRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
    alignItems: "center",
  },
  memberEmptyBox: {
    padding: "16px 4px 6px",
  },
  memberEmptyText: {
    color: "rgba(255,255,255,0.74)",
    fontSize: "15px",
    lineHeight: 1.7,
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
  successButton: {
    padding: "11px 14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: "800",
  },
  dangerButton: {
    padding: "11px 14px",
    borderRadius: "14px",
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontWeight: "800",
  },
  cancelButton: {
    padding: "11px 14px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    color: "#334155",
    fontWeight: "700",
  },
  cancelButtonDark: {
    padding: "14px 18px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(15,23,42,0.72)",
    color: "#fff",
    fontWeight: "700",
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
  overlay: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    left: `${SIDEBAR_OFFSET}px`,
    background: "rgba(2,6,23,0.50)",
    backdropFilter: "blur(8px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 1000,
    padding: "36px 24px 24px",
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: "720px",
    background: "linear-gradient(180deg, #ffffff, #f8fafc)",
    borderRadius: "30px",
    padding: "30px",
    boxShadow: "0 35px 90px rgba(0,0,0,0.34)",
    border: "1px solid rgba(226,232,240,0.95)",
    marginBottom: "24px",
  },
  confirmModal: {
    width: "100%",
    maxWidth: "520px",
    background: "rgba(255,255,255,0.98)",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.30)",
    border: "1px solid rgba(226,232,240,0.9)",
    marginTop: "70px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
  },
  modalTitle: {
    fontSize: "28px",
    fontWeight: "900",
    color: "#0f172a",
    margin: 0,
  },
  modalSubtitle: {
    color: "#64748b",
    fontSize: "14px",
    marginTop: "6px",
  },
  closeButton: {
    border: "none",
    background: "#eef2ff",
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    fontSize: "24px",
    cursor: "pointer",
    color: "#4338ca",
    flexShrink: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "18px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "800",
    color: "#334155",
  },
  input: {
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
    background: "#ffffff",
    color: "#0f172a",
    minHeight: "54px",
  },
  textarea: {
    minHeight: "130px",
    padding: "15px 16px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
    resize: "vertical",
    background: "#ffffff",
    color: "#0f172a",
  },
  selectOption: {
    color: "#0f172a",
    background: "#ffffff",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "6px",
  },
  confirmTitle: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "12px",
  },
  confirmText: {
    color: "#475569",
    fontSize: "15px",
    lineHeight: 1.7,
    marginBottom: "20px",
  },
  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
  },
  errorBox: {
    marginBottom: "14px",
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
