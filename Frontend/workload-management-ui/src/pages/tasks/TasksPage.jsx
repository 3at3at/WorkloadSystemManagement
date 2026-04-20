import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import {
  completeTaskRequest,
  createTaskRequest,
  deleteTaskRequest,
  getAllTasksRequest,
  getMyTasksRequest,
  getTaskByIdRequest,
  updateMyTaskStatusRequest,
  updateTaskRequest,
} from "../../api/tasksApi";
import { getAllUsersRequest } from "../../api/usersApi";

const initialFormData = {
  title: "",
  description: "",
  assignedToUserId: "",
  priority: 2,
  complexity: 2,
  estimatedHours: "",
  startDate: "",
  dueDate: "",
};

const SIDEBAR_OFFSET = 388;

const TasksPage = () => {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [assignableUsers, setAssignableUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [loadingTaskDetails, setLoadingTaskDetails] = useState(false);
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: "",
    message: "",
    action: null,
    danger: false,
  });
  const [toast, setToast] = useState(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState(null);

  const [formData, setFormData] = useState(initialFormData);

  const isAdmin = user?.role === "Admin";
  const isTeamLeader = user?.role === "TeamLeader";
  const isMember = user?.role === "Member";

  const showToast = (message, type = "success") => {
    setToast({ id: Date.now(), message, type });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const activeTasks = useMemo(
    () => tasks.filter((task) => normalizeStatus(task.status) !== "Completed"),
    [tasks]
  );

  const canManageTask = (task) => {
    if (isAdmin) return true;

    if (isTeamLeader) {
      return task.createdByUserId === user?.id && task.assignedToUserId !== user?.id;
    }

    return false;
  };

  const canChangeOwnStatus = (task) => {
    return task.assignedToUserId === user?.id;
  };

  const canCompleteTask = (task) => {
    return task.assignedToUserId === user?.id;
  };

  const fetchTasks = async () => {
    setLoading(true);
    setPageError("");

    try {
      let data = [];

      if (isMember) {
        data = await getMyTasksRequest();
      } else {
        data = await getAllTasksRequest();

        if (isTeamLeader) {
          data = (data || []).filter(
            (task) =>
              task.assignedToUserId === user?.id ||
              task.createdByUserId === user?.id
          );
        }
      }

      setTasks((data || []).map((task) => ({ ...task, status: normalizeStatus(task.status) })));
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load tasks."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignableUsers = async () => {
    if (isMember) {
      setAssignableUsers([]);
      return;
    }

    try {
      const data = await getAllUsersRequest();

      if (isAdmin) {
        const filtered = (data || []).filter(
          (item) =>
            item.isActive &&
            (item.role === "Member" || item.role === "TeamLeader")
        );
        setAssignableUsers(filtered);
        return;
      }

      if (isTeamLeader) {
        const filtered = (data || []).filter((item) => {
          const isOwnMember =
            item.role === "Member" &&
            item.teamLeaderId === user?.id &&
            item.isActive;

          return isOwnMember;
        });

        setAssignableUsers(filtered);
        return;
      }

      setAssignableUsers([]);
    } catch {
      setAssignableUsers([]);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchAssignableUsers();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        ["assignedToUserId", "priority", "complexity", "estimatedHours"].includes(name)
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const resetModalState = () => {
    setEditingTask(null);
    setFormError("");
    setFormData(initialFormData);
    setLoadingTaskDetails(false);
  };

  const openCreateModal = () => {
    resetModalState();
    setShowModal(true);
  };

  const openEditModal = async (task) => {
    setShowModal(true);
    setEditingTask(task);
    setFormError("");
    setLoadingTaskDetails(true);

    try {
      const fullTask = await getTaskByIdRequest(task.id);

      setFormData({
        title: fullTask.title || "",
        description: fullTask.description || "",
        assignedToUserId: fullTask.assignedToUserId || "",
        priority: priorityStringToValue(fullTask.priority),
        complexity: complexityStringToValue(fullTask.complexity),
        estimatedHours: fullTask.estimatedHours || "",
        startDate: toDateTimeLocal(fullTask.startDate),
        dueDate: toDateTimeLocal(fullTask.dueDate),
      });
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load task details."
      );
    } finally {
      setLoadingTaskDetails(false);
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    if (!formData.assignedToUserId) {
      setFormError("Please select a user to assign the task to.");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        assignedToUserId: Number(formData.assignedToUserId),
        estimatedHours: Number(formData.estimatedHours),
        priority: Number(formData.priority),
        complexity: Number(formData.complexity),
      };

      if (editingTask) {
        await updateTaskRequest(editingTask.id, payload);
        showToast("Task updated successfully.");
      } else {
        await createTaskRequest(payload);
        showToast("Task created successfully.");
      }

      setShowModal(false);
      resetModalState();
      fetchTasks();
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to save task."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const askDeleteTask = (task) => {
    setConfirmState({
      open: true,
      title: "Delete Task",
      message: `Are you sure you want to delete "${task.title}"?`,
      danger: true,
      action: async () => {
        await deleteTaskRequest(task.id);
        showToast("Task deleted successfully.");
        fetchTasks();
      },
    });
  };

  const askCompleteTask = (task) => {
    setConfirmState({
      open: true,
      title: "Mark Task as Done",
      message: `Mark "${task.title}" as completed?`,
      danger: false,
      action: async () => {
        await completeTaskRequest(task.id);
        showToast("Task marked as completed.");
        setOpenStatusMenuId(null);
        fetchTasks();
      },
    });
  };

  const handleChangeOwnStatus = async (taskId, statusValue) => {
    try {
      await updateMyTaskStatusRequest(taskId, { status: statusValue });
      showToast("Task status updated successfully.");
      setOpenStatusMenuId(null);
      fetchTasks();
    } catch (err) {
      showToast(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to update task status.",
        "error"
      );
    }
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

  return (
    <DashboardShell user={user} title={isMember ? "My Tasks" : "Tasks Management"}>
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
          <h2 style={styles.sectionTitle}>
            {isMember ? "My Active Tasks" : "Project Tasks"}
          </h2>
          <p style={styles.sectionSubtitle}>
            {isMember
              ? "Track and complete your assigned work."
              : "Create, assign, update, and monitor task details with workload visibility."}
          </p>
        </div>

        {!isMember && (
          <motion.button
            style={styles.primaryButton}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={openCreateModal}
          >
            + Create Task
          </motion.button>
        )}
      </div>

      {pageError && <div style={styles.errorBox}>{pageError}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingText}>Loading tasks...</div>
        ) : activeTasks.length === 0 ? (
          <div style={styles.emptyText}>No active tasks found.</div>
        ) : (
          <div style={styles.grid}>
            {activeTasks.map((task) => (
              <motion.div
                key={task.id}
                style={styles.taskCard}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                whileHover={{ y: -5 }}
              >
                <div style={styles.cardTopRow}>
                  <h3 style={styles.taskTitle}>{task.title}</h3>
                  <span style={getStatusBadgeStyle(normalizeStatus(task.status))}>
                    {normalizeStatus(task.status)}
                  </span>
                </div>

                <div style={styles.metaRow}>
                  <span style={getPriorityBadgeStyle(task.priority)}>{task.priority}</span>
                  <span style={getComplexityBadgeStyle(task.complexity)}>{task.complexity}</span>
                </div>

                <div style={styles.infoBlock}>
                  <p style={styles.infoText}><strong>Assigned To:</strong> {task.assignedTo}</p>
                  <p style={styles.infoText}><strong>Created By:</strong> {task.createdBy}</p>
                  <p style={styles.infoText}><strong>Estimated Hours:</strong> {task.estimatedHours}</p>
                  <p style={styles.infoText}><strong>Weight:</strong> {task.weight}</p>
                  <p style={styles.infoText}>
                    <strong>Due Date:</strong>{" "}
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                  </p>
                </div>

                <div style={styles.actionsRow}>
                  {canManageTask(task) && (
                    <>
                      <button style={styles.secondaryButton} onClick={() => openEditModal(task)}>
                        Edit
                      </button>
                      <button style={styles.dangerButton} onClick={() => askDeleteTask(task)}>
                        Delete
                      </button>
                    </>
                  )}

                  {canChangeOwnStatus(task) && (
                    <div style={styles.statusMenuWrapper}>
                      <button
                        style={styles.optionsButton}
                        onClick={() =>
                          setOpenStatusMenuId(openStatusMenuId === task.id ? null : task.id)
                        }
                      >
                        Options
                      </button>

                      {openStatusMenuId === task.id && (
  <div style={styles.statusMenu}>
    <button
      style={styles.statusMenuItem}
      onClick={() => handleChangeOwnStatus(task.id, 1)}
    >
      Set New
    </button>
    <button
      style={styles.statusMenuItem}
      onClick={() => handleChangeOwnStatus(task.id, 2)}
    >
      Set In Progress
    </button>
    <button
      style={styles.statusMenuItem}
      onClick={() => handleChangeOwnStatus(task.id, 3)}
    >
      Set Blocked
    </button>
  </div>
)}
                    </div>
                  )}

                  {canCompleteTask(task) && (
                    <button style={styles.successButton} onClick={() => askCompleteTask(task)}>
                      Mark Done
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
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
              initial={{ opacity: 0, y: 40, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
              transition={{ duration: 0.24 }}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>
                    {editingTask ? "Edit Task" : "Create New Task"}
                  </h3>
                  <p style={styles.modalSubtitle}>
                    {editingTask
                      ? "Update task details professionally."
                      : "Create and assign a new task."}
                  </p>
                </div>

                <button
                  type="button"
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

              {loadingTaskDetails ? (
                <div style={styles.loadingTaskBox}>Loading task details...</div>
              ) : (
                <form onSubmit={handleSubmitTask} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Title</label>
                    <input
                      style={styles.input}
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="Enter task title"
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      style={styles.textarea}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter task description"
                      required
                    />
                  </div>

                  <div style={styles.twoCol}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Assign To</label>
                      <select
                        style={styles.input}
                        name="assignedToUserId"
                        value={formData.assignedToUserId}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select user</option>
                        {assignableUsers.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.fullName} ({item.role})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Estimated Hours</label>
                      <input
                        style={styles.input}
                        type="number"
                        name="estimatedHours"
                        value={formData.estimatedHours}
                        onChange={handleChange}
                        placeholder="e.g. 5"
                        required
                      />
                    </div>
                  </div>

                  <div style={styles.twoCol}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Priority</label>
                      <select
                        style={styles.input}
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                      >
                        <option value={1}>Low</option>
                        <option value={2}>Medium</option>
                        <option value={3}>High</option>
                        <option value={4}>Critical</option>
                      </select>
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Complexity</label>
                      <select
                        style={styles.input}
                        name="complexity"
                        value={formData.complexity}
                        onChange={handleChange}
                      >
                        <option value={1}>Easy</option>
                        <option value={2}>Medium</option>
                        <option value={3}>Hard</option>
                      </select>
                    </div>
                  </div>

                  <div style={styles.twoCol}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Start Date</label>
                      <input
                        style={styles.input}
                        type="datetime-local"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Due Date</label>
                      <input
                        style={styles.input}
                        type="datetime-local"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleChange}
                        required
                      />
                    </div>
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
                      {submitting
                        ? editingTask
                          ? "Saving..."
                          : "Creating..."
                        : editingTask
                        ? "Save Changes"
                        : "Create Task"}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmState.open && (
          <motion.div style={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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

const toDateTimeLocal = (value) => {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const adjusted = new Date(date.getTime() - offset * 60000);
  return adjusted.toISOString().slice(0, 16);
};

const priorityStringToValue = (value) => {
  if (value === "Low") return 1;
  if (value === "Medium") return 2;
  if (value === "High") return 3;
  if (value === "Critical") return 4;
  return 2;
};

const complexityStringToValue = (value) => {
  if (value === "Easy") return 1;
  if (value === "Medium") return 2;
  if (value === "Hard") return 3;
  return 2;
};

const normalizeStatus = (value) => {
  if (value === 1 || value === "1" || value === "New") return "New";
  if (value === 2 || value === "2" || value === "InProgress" || value === "In Progress") return "In Progress";
  if (value === 3 || value === "3" || value === "Blocked") return "Blocked";
  if (value === 4 || value === "4" || value === "Completed") return "Completed";
  return String(value);
};

const getStatusBadgeStyle = (status) => {
  const base = {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-block",
  };

  if (status === "Completed") {
    return { ...base, background: "rgba(16,185,129,0.18)", color: "#86efac", border: "1px solid rgba(16,185,129,0.28)" };
  }

  if (status === "In Progress") {
    return { ...base, background: "rgba(59,130,246,0.18)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.28)" };
  }

  if (status === "Blocked") {
    return { ...base, background: "rgba(239,68,68,0.18)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.28)" };
  }

  return { ...base, background: "rgba(250,204,21,0.18)", color: "#fde68a", border: "1px solid rgba(250,204,21,0.28)" };
};

const getPriorityBadgeStyle = (priority) => {
  const base = { padding: "6px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700" };

  if (priority === "Critical") return { ...base, background: "rgba(239,68,68,0.18)", color: "#fca5a5" };
  if (priority === "High") return { ...base, background: "rgba(249,115,22,0.18)", color: "#fdba74" };
  if (priority === "Medium") return { ...base, background: "rgba(59,130,246,0.18)", color: "#93c5fd" };

  return { ...base, background: "rgba(16,185,129,0.18)", color: "#86efac" };
};

const getComplexityBadgeStyle = (complexity) => {
  const base = { padding: "6px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "700" };

  if (complexity === "Hard") return { ...base, background: "rgba(139,92,246,0.18)", color: "#c4b5fd" };
  if (complexity === "Medium") return { ...base, background: "rgba(14,165,233,0.18)", color: "#7dd3fc" };

  return { ...base, background: "rgba(16,185,129,0.18)", color: "#86efac" };
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
  toastSuccess: { background: "linear-gradient(135deg, #10b981, #059669)" },
  toastError: { background: "linear-gradient(135deg, #ef4444, #dc2626)" },
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
    padding: "20px",
    backdropFilter: "blur(14px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
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
    minHeight: "220px",
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
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
  actionsRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
    marginTop: "18px",
    alignItems: "center",
  },
  statusMenuWrapper: {
    position: "relative",
  },
  statusMenu: {
    position: "absolute",
    top: "48px",
    left: 0,
    minWidth: "170px",
    background: "rgba(15,23,42,0.96)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    padding: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    zIndex: 20,
    boxShadow: "0 18px 34px rgba(0,0,0,0.28)",
  },
  statusMenuItem: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "none",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: "700",
    textAlign: "left",
  },
  optionsButton: {
    padding: "11px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: "700",
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
  secondaryButton: {
    padding: "11px 14px",
    borderRadius: "14px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: "700",
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
    background: "rgba(15,23,42,0.6)",
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
  loadingTaskBox: {
    padding: "18px",
    borderRadius: "18px",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: "700",
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
    maxWidth: "900px",
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
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "16px",
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
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "6px",
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

export default TasksPage;