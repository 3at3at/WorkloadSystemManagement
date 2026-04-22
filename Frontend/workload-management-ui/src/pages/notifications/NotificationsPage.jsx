import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DashboardShell from "../../components/layout/DashboardShell";
import { useAuth } from "../../context/AuthContext";
import {
  getMyNotificationsRequest,
  markAllNotificationsAsReadRequest,
  markNotificationAsReadRequest,
} from "../../api/notificationsApi";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setPageError("");
      const data = await getMyNotificationsRequest();
      setNotifications(data || []);
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeFilter === "Unread") return !item.isRead;
      if (activeFilter === "Tasks") return item.type?.startsWith("Task");
      if (activeFilter === "Approvals") return item.type?.startsWith("Approval");
      return true;
    });
  }, [activeFilter, notifications]);

  const handleOpenNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsReadRequest(notification.id);
      } catch {
        // Keep navigation responsive even if mark-read fails.
      }
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item
      )
    );

    navigate(notification.actionUrl || getDefaultNotificationsPath(user?.role));
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsReadRequest();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err) {
      setPageError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to mark all notifications as read."
      );
    }
  };

  return (
    <DashboardShell user={user} title="Notifications">
      <div style={styles.headerRow}>
        <div>
          <h2 style={styles.sectionTitle}>Notification Dashboard</h2>
          <p style={styles.sectionSubtitle}>
            Stay on top of task changes, approvals, and important updates.
          </p>
        </div>

        <button
          style={styles.primaryButton}
          onClick={handleMarkAllAsRead}
          disabled={!notifications.some((item) => !item.isRead)}
        >
          Mark All Read
        </button>
      </div>

      <div style={styles.filterRow}>
        {["All", "Unread", "Tasks", "Approvals"].map((filter) => (
          <button
            key={filter}
            style={{
              ...styles.filterButton,
              ...(activeFilter === filter ? styles.filterButtonActive : {}),
            }}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      {pageError && <div style={styles.errorBox}>{pageError}</div>}

      <div style={styles.card}>
        {loading ? (
          <div style={styles.loadingText}>Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div style={styles.emptyText}>No notifications in this view.</div>
        ) : (
          <div style={styles.list}>
            {filteredNotifications.map((notification) => (
              <motion.div
                key={notification.id}
                style={{
                  ...styles.notificationCard,
                  ...(notification.isRead ? styles.notificationRead : styles.notificationUnread),
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -3 }}
              >
                <div style={styles.cardTopRow}>
                  <div>
                    <div style={styles.cardTitleRow}>
                      <span style={getTypeBadgeStyle(notification.type)}>
                        {formatType(notification.type)}
                      </span>
                      {!notification.isRead && <span style={styles.unreadDot} />}
                    </div>
                    <h3 style={styles.notificationTitle}>{notification.title}</h3>
                  </div>
                  <span style={styles.timeText}>
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </div>

                <p style={styles.notificationMessage}>{notification.message}</p>

                <div style={styles.cardFooter}>
                  <button
                    type="button"
                    style={styles.openButton}
                    onClick={() => handleOpenNotification(notification)}
                  >
                    Open
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
};

const getDefaultNotificationsPath = (role) => {
  if (role === "Admin") return "/admin/notifications";
  if (role === "TeamLeader") return "/leader/notifications";
  return "/member/notifications";
};

const formatType = (type) => {
  return String(type || "System").replace(/([A-Z])/g, " $1").trim();
};

const formatRelativeTime = (value) => {
  const date = parseApiDate(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));

  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

const parseApiDate = (value) => {
  if (!value) return new Date();

  if (typeof value === "string" && !value.endsWith("Z") && !/[+-]\d{2}:\d{2}$/.test(value)) {
    return new Date(`${value}Z`);
  }

  return new Date(value);
};

const getTypeBadgeStyle = (type) => {
  const base = {
    padding: "7px 11px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "800",
    display: "inline-flex",
    alignItems: "center",
  };

  if (type?.startsWith("Task")) {
    return {
      ...base,
      background: "rgba(59,130,246,0.18)",
      color: "#93c5fd",
      border: "1px solid rgba(59,130,246,0.28)",
    };
  }

  if (type?.startsWith("Approval")) {
    return {
      ...base,
      background: "rgba(250,204,21,0.18)",
      color: "#fde68a",
      border: "1px solid rgba(250,204,21,0.28)",
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
  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
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
  primaryButton: {
    padding: "14px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #2563eb)",
    color: "#fff",
    fontWeight: "800",
    boxShadow: "0 14px 28px rgba(79,70,229,0.25)",
  },
  filterRow: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  filterButton: {
    padding: "11px 14px",
    borderRadius: "999px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: "700",
  },
  filterButtonActive: {
    background: "linear-gradient(135deg, rgba(79,70,229,0.45), rgba(14,165,233,0.28))",
    border: "1px solid rgba(255,255,255,0.16)",
  },
  card: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "26px",
    padding: "20px",
    backdropFilter: "blur(14px)",
    boxShadow: "0 20px 40px rgba(0,0,0,0.18)",
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  notificationCard: {
    padding: "20px",
    borderRadius: "22px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
  },
  notificationUnread: {
    boxShadow: "inset 0 0 0 1px rgba(96,165,250,0.22)",
  },
  notificationRead: {
    opacity: 0.82,
  },
  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "14px",
    alignItems: "flex-start",
    marginBottom: "12px",
  },
  cardTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "10px",
  },
  unreadDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#38bdf8",
    boxShadow: "0 0 16px rgba(56,189,248,0.6)",
  },
  notificationTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "20px",
    fontWeight: "800",
  },
  notificationMessage: {
    margin: 0,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 1.7,
    fontSize: "15px",
  },
  cardFooter: {
    marginTop: "14px",
    display: "flex",
    justifyContent: "flex-end",
  },
  openButton: {
    border: "none",
    background: "transparent",
    color: "#93c5fd",
    fontWeight: "800",
    fontSize: "15px",
    cursor: "pointer",
  },
  timeText: {
    color: "rgba(255,255,255,0.62)",
    fontSize: "13px",
    whiteSpace: "nowrap",
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

export default NotificationsPage;
