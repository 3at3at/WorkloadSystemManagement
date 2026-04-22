import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import {
  createUserRequest,
  deleteUserRequest,
  getAllUsersRequest,
  getUserByIdRequest,
  updateUserRequest,
  updateUserStatusRequest,
} from "../../api/usersApi";

const initialFormData = {
  fullName: "",
  email: "",
  password: "",
  roleId: 3,
  teamLeaderId: "",
};

const SIDEBAR_OFFSET = 388;

const UsersPage = () => {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
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
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [formData, setFormData] = useState(initialFormData);

  const isMemberRole = Number(formData.roleId) === 3;
  const isCompact = windowWidth < 980;

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

  const fetchUsers = async () => {
    setLoading(true);
    setPageError("");

    try {
      const data = await getAllUsersRequest();
      const filteredUsers = (data || []).filter((item) => item.id !== user?.id);
      setUsers(filteredUsers);

      const teamLeaders = (data || []).filter(
        (item) => item.role === "TeamLeader" && item.isActive
      );
      setLeaders(teamLeaders);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter((item) => {
      const matchesSearch =
        item.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.teamLeaderName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "All" || item.role === roleFilter;

      const matchesStatus =
        statusFilter === "All" ||
        (statusFilter === "Active" && item.isActive) ||
        (statusFilter === "Inactive" && !item.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const resetModalState = () => {
    setEditingUser(null);
    setFormError("");
    setLoadingUserDetails(false);
    setFormData(initialFormData);
  };

  const openCreateModal = () => {
    resetModalState();
    setShowModal(true);
  };

  const openEditModal = async (userItem) => {
    setShowModal(true);
    setEditingUser(userItem);
    setFormError("");
    setLoadingUserDetails(true);

    try {
      const fullUser = await getUserByIdRequest(userItem.id);

      setFormData({
        fullName: fullUser.fullName || "",
        email: fullUser.email || "",
        password: "",
        roleId: roleStringToValue(fullUser.role),
        teamLeaderId: fullUser.teamLeaderId ?? "",
      });
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load user details."
      );
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "roleId"
          ? Number(value)
          : name === "teamLeaderId"
          ? value === ""
            ? ""
            : Number(value)
          : value,
    }));
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError("");

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password?.trim() ? formData.password : null,
        roleId: Number(formData.roleId),
        teamLeaderId:
          Number(formData.roleId) === 3
            ? formData.teamLeaderId === ""
              ? null
              : Number(formData.teamLeaderId)
            : null,
      };

      if (editingUser) {
        await updateUserRequest(editingUser.id, payload);
        showToast("User updated successfully.");
      } else {
        await createUserRequest({
          ...payload,
          password: formData.password,
        });
        showToast("User created successfully.");
      }

      setShowModal(false);
      resetModalState();
      fetchUsers();
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to save user."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await updateUserStatusRequest(id, { isActive: !currentStatus });
      showToast(`User ${currentStatus ? "deactivated" : "activated"} successfully.`);
      fetchUsers();
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to update user status."
      );
    }
  };

  const askDeleteUser = (item) => {
    setConfirmState({
      open: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${item.fullName}"? This action cannot be undone.`,
      danger: true,
      action: async () => {
        await deleteUserRequest(item.id);
        showToast("User deleted successfully.");
        fetchUsers();
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

  return (
    <DashboardShell user={user} title="Users Management">
      <style>{`
        input::placeholder {
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
          <h2 style={styles.sectionTitle}>Team Users</h2>
          <p style={styles.sectionSubtitle}>
            Create, edit, delete, and manage Admin, Team Leader, and Member accounts.
          </p>
        </div>

        <motion.button
          style={styles.primaryButton}
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreateModal}
        >
          + Create User
        </motion.button>
      </div>

      <div style={styles.filtersCard}>
        <input
          style={{ ...styles.filterInput, flex: 1 }}
          type="text"
          placeholder="Search by name, email, or leader..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          style={styles.filterInput}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option style={styles.selectOption} value="All">All Roles</option>
          <option style={styles.selectOption} value="TeamLeader">Team Leaders</option>
          <option style={styles.selectOption} value="Member">Members</option>
        </select>

        <select
          style={styles.filterInput}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option style={styles.selectOption} value="All">All Statuses</option>
          <option style={styles.selectOption} value="Active">Active</option>
          <option style={styles.selectOption} value="Inactive">Inactive</option>
        </select>
      </div>

      {pageError && <div style={styles.errorBox}>{pageError}</div>}

      <div style={styles.tableCard}>
        {loading ? (
          <div style={styles.loadingText}>Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={styles.emptyText}>No users match your filters.</div>
        ) : !isCompact ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Leader</th>
                  <th style={styles.th}>Status</th>
                  <th style={{ ...styles.th, minWidth: "280px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    style={styles.tr}
                  >
                    <td style={styles.td}>{item.fullName}</td>
                    <td style={styles.td}>{item.email}</td>
                    <td style={styles.td}>
                      <span style={getRoleBadgeStyle(item.role)}>{item.role}</span>
                    </td>
                    <td style={styles.td}>{item.teamLeaderName || "-"}</td>
                    <td style={styles.td}>
                      <span style={item.isActive ? styles.activeBadge : styles.inactiveBadge}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ ...styles.td, minWidth: "280px" }}>
                      <div style={styles.actionRow}>
                        <button style={styles.editButton} onClick={() => openEditModal(item)}>
                          Edit
                        </button>

                        <button
                          style={item.isActive ? styles.deactivateButton : styles.activateButton}
                          onClick={() => handleToggleStatus(item.id, item.isActive)}
                        >
                          {item.isActive ? "Deactivate" : "Activate"}
                        </button>

                        <button style={styles.deleteButton} onClick={() => askDeleteUser(item)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={styles.mobileGrid}>
            {filteredUsers.map((item) => (
              <motion.div
                key={item.id}
                style={styles.userCard}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div style={styles.userCardTop}>
                  <div>
                    <h3 style={styles.userCardName}>{item.fullName}</h3>
                    <p style={styles.userCardEmail}>{item.email}</p>
                  </div>
                  <span style={item.isActive ? styles.activeBadge : styles.inactiveBadge}>
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div style={styles.userMetaRow}>
                  <span style={getRoleBadgeStyle(item.role)}>{item.role}</span>
                  <span style={styles.leaderText}>
                    Leader: {item.teamLeaderName || "-"}
                  </span>
                </div>

                <div style={styles.mobileActionRow}>
                  <button style={styles.editButton} onClick={() => openEditModal(item)}>
                    Edit
                  </button>
                  <button
                    style={item.isActive ? styles.deactivateButton : styles.activateButton}
                    onClick={() => handleToggleStatus(item.id, item.isActive)}
                  >
                    {item.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button style={styles.deleteButton} onClick={() => askDeleteUser(item)}>
                    Delete
                  </button>
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
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.96 }}
            >
              <div style={styles.modalHeader}>
                <div>
                  <h3 style={styles.modalTitle}>
                    {editingUser ? "Edit User" : "Create New User"}
                  </h3>
                  <p style={styles.modalSubtitle}>
                    {editingUser
                      ? "Update user details and role mapping."
                      : "Create a new team user professionally."}
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

              {loadingUserDetails ? (
                <div style={styles.loadingUserBox}>Loading user details...</div>
              ) : (
                <form onSubmit={handleSubmitUser} style={styles.form}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Full Name</label>
                    <input
                      style={styles.input}
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Email</label>
                    <input
                      style={styles.input}
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>
                      {editingUser ? "New Password (optional)" : "Password"}
                    </label>
                    <input
                      style={styles.input}
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder={editingUser ? "Leave empty to keep current password" : "Enter password"}
                      required={!editingUser}
                    />
                  </div>

                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Role</label>
                    <select
                      style={styles.input}
                      name="roleId"
                      value={formData.roleId}
                      onChange={handleChange}
                    >
                      <option style={styles.selectOption} value={2}>Team Leader</option>
                      <option style={styles.selectOption} value={3}>Member</option>
                    </select>
                  </div>

                  {isMemberRole && (
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Team Leader</label>
                      <select
                        style={styles.input}
                        name="teamLeaderId"
                        value={formData.teamLeaderId}
                        onChange={handleChange}
                        required
                      >
                        <option style={styles.selectOption} value="">Select team leader</option>
                        {leaders.map((leader) => (
                          <option style={styles.selectOption} key={leader.id} value={leader.id}>
                            {leader.fullName}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                        ? editingUser
                          ? "Saving..."
                          : "Creating..."
                        : editingUser
                        ? "Save Changes"
                        : "Create User"}
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
                  style={confirmState.danger ? styles.deleteButton : styles.primaryButton}
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

const roleStringToValue = (role) => {
  if (role === "TeamLeader") return 2;
  if (role === "Member") return 3;
  return 3;
};

const getRoleBadgeStyle = (role) => {
  const base = {
    padding: "8px 12px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-block",
  };

  if (role === "Admin") {
    return {
      ...base,
      background: "rgba(244,114,182,0.18)",
      color: "#f9a8d4",
      border: "1px solid rgba(244,114,182,0.28)",
    };
  }

  if (role === "TeamLeader") {
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
    gridTemplateColumns: "minmax(220px, 1fr) 180px 180px",
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
  selectOption: {
    color: "#0f172a",
    background: "#ffffff",
  },
  tableCard: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "20px",
    backdropFilter: "blur(14px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    padding: "16px",
    color: "rgba(255,255,255,0.74)",
    fontSize: "13px",
    fontWeight: "700",
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  },
  tr: {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
  },
  td: {
    padding: "18px 16px",
    color: "#fff",
    fontSize: "14px",
    verticalAlign: "middle",
  },
  actionRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flexWrap: "nowrap",
    whiteSpace: "nowrap",
  },
  mobileGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px",
  },
  userCard: {
    padding: "18px",
    borderRadius: "22px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  userCardTop: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  userCardName: {
    margin: 0,
    color: "#fff",
    fontSize: "18px",
    fontWeight: "800",
  },
  userCardEmail: {
    marginTop: "6px",
    color: "rgba(255,255,255,0.72)",
    fontSize: "14px",
    wordBreak: "break-word",
  },
  userMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    flexWrap: "wrap",
    marginBottom: "16px",
  },
  leaderText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: "14px",
  },
  mobileActionRow: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
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
  editButton: {
    minWidth: "72px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #0ea5e9, #2563eb)",
    color: "#fff",
    fontWeight: "700",
  },
  activateButton: {
    minWidth: "108px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    fontWeight: "700",
  },
  deactivateButton: {
    minWidth: "108px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    fontWeight: "700",
  },
  deleteButton: {
    minWidth: "82px",
    padding: "10px 14px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontWeight: "700",
  },
  activeBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(16,185,129,0.18)",
    color: "#86efac",
    border: "1px solid rgba(16,185,129,0.28)",
    fontSize: "12px",
    fontWeight: "700",
  },
  inactiveBadge: {
    padding: "8px 12px",
    borderRadius: "999px",
    background: "rgba(239,68,68,0.18)",
    color: "#fca5a5",
    border: "1px solid rgba(239,68,68,0.28)",
    fontSize: "12px",
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
    background: "rgba(2,6,23,0.54)",
    backdropFilter: "blur(6px)",
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "center",
    zIndex: 1000,
    padding: "40px 24px 24px",
    overflowY: "auto",
  },
  modal: {
    width: "100%",
    maxWidth: "620px",
    background: "#ffffff",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
    marginBottom: "24px",
  },
  confirmModal: {
    width: "100%",
    maxWidth: "520px",
    background: "#ffffff",
    borderRadius: "28px",
    padding: "28px",
    boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
    marginTop: "70px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "18px",
  },
  modalTitle: {
    fontSize: "24px",
    fontWeight: "800",
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
    color: "#4338ca",
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    fontSize: "24px",
    cursor: "pointer",
    flexShrink: 0,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
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
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #cbd5e1",
    fontSize: "15px",
    outline: "none",
    color: "#0f172a",
    background: "#ffffff",
  },
  loadingUserBox: {
    padding: "16px",
    borderRadius: "16px",
    background: "#f8fafc",
    color: "#334155",
    fontWeight: "700",
  },
  modalActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "8px",
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

export default UsersPage;