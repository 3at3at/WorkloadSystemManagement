import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  getMyNotificationsRequest,
  getUnreadNotificationsCountRequest,
  markAllNotificationsAsReadRequest,
  markNotificationAsReadRequest,
} from "../../api/notificationsApi";

const DashboardShell = ({ user, title, children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isTabletOrMobile = windowWidth < 1100;
  const isMobile = windowWidth < 768;

  useEffect(() => {
    if (!isTabletOrMobile) {
      setMobileSidebarOpen(false);
    }
  }, [isTabletOrMobile]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getInitial = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  const isAdmin = user?.role === "Admin";
  const isLeader = user?.role === "TeamLeader";

  const navItems = isAdmin
    ? [
        { label: "Dashboard", path: "/admin/dashboard" },
        { label: "Users", path: "/admin/users" },
        { label: "Tasks", path: "/admin/tasks" },
        { label: "Workload", path: "/admin/workload" },
        { label: "Approvals", path: "/admin/approvals" },
        { label: "Notifications", path: "/admin/notifications" },
      ]
    : isLeader
    ? [
        { label: "Dashboard", path: "/leader/dashboard" },
        { label: "Tasks", path: "/leader/tasks" },
        { label: "Workload", path: "/leader/workload" },
        { label: "Approvals", path: "/leader/approvals" },
        { label: "Notifications", path: "/leader/notifications" },
      ]
    : [
        { label: "Dashboard", path: "/member/dashboard" },
        { label: "My Tasks", path: "/member/tasks" },
        { label: "My Workload", path: "/member/workload" },
        { label: "My Approvals", path: "/member/approvals" },
        { label: "Notifications", path: "/member/notifications" },
      ];

  const notificationsPath = isAdmin
    ? "/admin/notifications"
    : isLeader
    ? "/leader/notifications"
    : "/member/notifications";

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const [items, unread] = await Promise.all([
        getMyNotificationsRequest(),
        getUnreadNotificationsCountRequest(),
      ]);

      setNotifications((items || []).slice(0, 5));
      setUnreadCount(unread?.unreadCount ?? 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [user?.id, location.pathname]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    setNotificationsOpen(false);
  }, [location.pathname]);

  const sidebarContent = (
    <div style={styles.sidebarInner}>
      <div style={styles.brandCard}>
        <div style={styles.brandIcon}>W</div>
        <div>
          <h2 style={styles.brandTitle}>Workload Pro</h2>
          <p style={styles.brandSubtitle}>Team Management</p>
        </div>
      </div>

      <div style={styles.profileCard}>
        <div style={styles.avatar}>{getInitial(user?.fullName)}</div>
        <div style={{ minWidth: 0 }}>
          <h3 style={styles.profileName}>{user?.fullName || "User"}</h3>
          <p style={styles.profileRole}>{user?.role || "Role"}</p>
        </div>
      </div>

      <nav className="dashboard-sidebar-nav" style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={{ textDecoration: "none" }}
            onClick={() => setMobileSidebarOpen(false)}
          >
            {({ isActive }) => (
              <motion.div
                whileHover={{ x: 6, scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                transition={{ duration: 0.2 }}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                }}
              >
                <span>{item.label}</span>
                {!isActive && <span style={styles.navArrow}>→</span>}
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>

      <motion.button
        style={styles.logoutButton}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
      >
        Logout
      </motion.button>
    </div>
  );

  const handleOpenNotification = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationAsReadRequest(notification.id);
      }
    } catch {
      // Keep navigation responsive even if marking read fails.
    }

    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - (notification.isRead ? 0 : 1)));
    setNotificationsOpen(false);
    navigate(notification.actionUrl || notificationsPath);
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await markAllNotificationsAsReadRequest();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore transient failures in the shell dropdown.
    }
  };

  return (
    <>
      <style>
        {`
          * {
            box-sizing: border-box;
          }

          html, body, #root {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          .dashboard-main-scroll {
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.24) transparent;
          }

          .dashboard-main-scroll::-webkit-scrollbar {
            width: 10px;
          }

          .dashboard-main-scroll::-webkit-scrollbar-track {
            background: transparent;
          }

          .dashboard-main-scroll::-webkit-scrollbar-thumb {
            background: rgba(255,255,255,0.18);
            border-radius: 999px;
          }

          .dashboard-sidebar-nav {
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: rgba(255,255,255,0.24) transparent;
          }

          .dashboard-sidebar-nav::-webkit-scrollbar {
            width: 8px;
          }

          .dashboard-sidebar-nav::-webkit-scrollbar-track {
            background: transparent;
          }

          .dashboard-sidebar-nav::-webkit-scrollbar-thumb {
            background: linear-gradient(
              180deg,
              rgba(99, 102, 241, 0.75),
              rgba(56, 189, 248, 0.55)
            );
            border-radius: 999px;
          }
        `}
      </style>

      <div style={styles.page}>
        <div style={styles.backgroundGlowOne} />
        <div style={styles.backgroundGlowTwo} />

        {!isTabletOrMobile && (
          <aside style={styles.desktopSidebar}>
            {sidebarContent}
          </aside>
        )}

        <AnimatePresence>
          {isTabletOrMobile && mobileSidebarOpen && (
            <>
              <motion.div
                style={styles.mobileOverlay}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSidebarOpen(false)}
              />
              <motion.aside
                style={styles.mobileSidebar}
                initial={{ x: -360 }}
                animate={{ x: 0 }}
                exit={{ x: -360 }}
                transition={{ duration: 0.24 }}
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <main
          className="dashboard-main-scroll"
          style={{
            ...styles.main,
            ...(isTabletOrMobile ? styles.mainTablet : styles.mainDesktop),
          }}
        >
          <div style={styles.topBar}>
            <div style={styles.topBarLeft}>
              {isTabletOrMobile && (
                <button
                  style={styles.menuButton}
                  onClick={() => setMobileSidebarOpen(true)}
                >
                  ☰
                </button>
              )}

              <div>
                <p style={styles.welcomeText}>Welcome back</p>
                <h1
                  style={{
                    ...styles.pageTitle,
                    ...(isMobile ? styles.pageTitleMobile : {}),
                  }}
                >
                  {title}
                </h1>
              </div>
            </div>

            <div style={styles.topBarRight}>
              <div style={styles.notificationWrapper}>
                <button
                  style={styles.notificationButton}
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                >
                  <span style={styles.notificationIcon}>🔔</span>
                  {unreadCount > 0 && (
                    <span style={styles.notificationCount}>
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      style={styles.notificationDropdown}
                      initial={{ opacity: 0, y: -12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    >
                      <div style={styles.notificationHeader}>
                        <div>
                          <h3 style={styles.notificationTitle}>Notifications</h3>
                          <p style={styles.notificationSubtitle}>
                            {unreadCount} unread update{unreadCount === 1 ? "" : "s"}
                          </p>
                        </div>
                        <button
                          style={styles.notificationLinkButton}
                          onClick={handleMarkAllNotificationsAsRead}
                        >
                          Mark all
                        </button>
                      </div>

                      <div style={styles.notificationList}>
                        {notifications.length === 0 ? (
                          <div style={styles.notificationEmpty}>
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <button
                              key={notification.id}
                              style={{
                                ...styles.notificationItem,
                                ...(notification.isRead ? styles.notificationItemRead : {}),
                              }}
                              onClick={() => handleOpenNotification(notification)}
                            >
                              <div style={styles.notificationItemTop}>
                                <span style={styles.notificationItemType}>
                                  {formatNotificationType(notification.type)}
                                </span>
                                {!notification.isRead && <span style={styles.notificationItemDot} />}
                              </div>
                              <strong style={styles.notificationItemTitle}>
                                {notification.title}
                              </strong>
                              <p style={styles.notificationItemMessage}>
                                {notification.message}
                              </p>
                              <span style={styles.notificationItemTime}>
                                {formatRelativeTime(notification.createdAt)}
                              </span>
                            </button>
                          ))
                        )}
                      </div>

                      <button
                        style={styles.notificationFooterButton}
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate(notificationsPath);
                        }}
                      >
                        View all notifications
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={styles.roleBadge}>{user?.role}</div>
            </div>
          </div>

          <div style={styles.content}>{children}</div>
        </main>
      </div>
    </>
  );
};

const SIDEBAR_WIDTH = 320;
const PAGE_GAP = 28;
const PAGE_PADDING = 20;
const MAIN_LEFT_OFFSET = SIDEBAR_WIDTH + PAGE_GAP + PAGE_PADDING;

const styles = {
  page: {
    width: "100vw",
    height: "100vh",
    position: "relative",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,0.16), transparent 28%), radial-gradient(circle at top right, rgba(99,102,241,0.18), transparent 26%), linear-gradient(135deg, #0b1220 0%, #09111f 38%, #0f172a 100%)",
    overflow: "hidden",
  },
  backgroundGlowOne: {
    position: "fixed",
    top: "-120px",
    right: "-100px",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background: "rgba(79,70,229,0.18)",
    filter: "blur(80px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  backgroundGlowTwo: {
    position: "fixed",
    bottom: "-120px",
    left: "-80px",
    width: "280px",
    height: "280px",
    borderRadius: "50%",
    background: "rgba(14,165,233,0.14)",
    filter: "blur(80px)",
    pointerEvents: "none",
    zIndex: 0,
  },
  desktopSidebar: {
    position: "fixed",
    top: PAGE_PADDING,
    left: PAGE_PADDING,
    width: `${SIDEBAR_WIDTH}px`,
    height: `calc(100vh - ${PAGE_PADDING * 2}px)`,
    zIndex: 10,
  },
  mobileOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(2,6,23,0.54)",
    backdropFilter: "blur(4px)",
    zIndex: 40,
  },
  mobileSidebar: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "min(86vw, 340px)",
    height: "100vh",
    zIndex: 50,
    padding: "16px",
  },
  sidebarInner: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "18px",
    padding: "22px",
    borderRadius: "28px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(16px)",
    boxShadow: "0 20px 50px rgba(0,0,0,0.22)",
    overflow: "hidden",
  },
  brandCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    flexShrink: 0,
  },
  brandIcon: {
    width: "68px",
    height: "68px",
    borderRadius: "22px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    fontWeight: "900",
    color: "#fff",
    background: "linear-gradient(135deg, #38bdf8, #4f46e5)",
    boxShadow: "0 14px 28px rgba(59,130,246,0.28)",
    flexShrink: 0,
  },
  brandTitle: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "800",
    margin: 0,
  },
  brandSubtitle: {
    color: "rgba(255,255,255,0.68)",
    fontSize: "14px",
    marginTop: "6px",
  },
  profileCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  avatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "34px",
    fontWeight: "900",
    color: "#fff",
    background: "linear-gradient(135deg, #38bdf8, #4f46e5)",
    flexShrink: 0,
  },
  profileName: {
    color: "#fff",
    fontSize: "18px",
    fontWeight: "800",
    margin: 0,
    wordBreak: "break-word",
  },
  profileRole: {
    color: "rgba(255,255,255,0.7)",
    fontSize: "15px",
    marginTop: "6px",
  },
  nav: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    paddingRight: "4px",
  },
  navLink: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "rgba(255,255,255,0.9)",
    fontSize: "18px",
    fontWeight: "700",
    padding: "18px 20px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.02)",
    border: "1px solid transparent",
    flexShrink: 0,
  },
  navLinkActive: {
    background:
      "linear-gradient(135deg, rgba(79,70,229,0.45), rgba(14,165,233,0.28))",
    boxShadow:
      "inset 0 0 0 1px rgba(255,255,255,0.08), 0 12px 24px rgba(0,0,0,0.16)",
  },
  navArrow: {
    color: "rgba(255,255,255,0.45)",
    fontSize: "16px",
    fontWeight: "800",
  },
  logoutButton: {
    flexShrink: 0,
    marginTop: "4px",
    padding: "18px 20px",
    borderRadius: "20px",
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "800",
    boxShadow: "0 16px 30px rgba(239,68,68,0.24)",
  },
  main: {
    position: "fixed",
    top: 0,
    height: "100vh",
    zIndex: 1,
    overflowX: "hidden",
  },
  mainDesktop: {
    left: `${MAIN_LEFT_OFFSET}px`,
    width: `calc(100vw - ${MAIN_LEFT_OFFSET + PAGE_PADDING}px)`,
    paddingTop: "56px",
    paddingRight: "20px",
    paddingBottom: "28px",
  },
  mainTablet: {
    left: 0,
    width: "100vw",
    paddingTop: "28px",
    paddingLeft: "16px",
    paddingRight: "16px",
    paddingBottom: "24px",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
    flexWrap: "wrap",
  },
  topBarLeft: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
  },
  topBarRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    position: "relative",
    flexWrap: "wrap",
  },
  menuButton: {
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    fontSize: "22px",
    fontWeight: "800",
    flexShrink: 0,
  },
  welcomeText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: "16px",
    marginBottom: "8px",
  },
  pageTitle: {
    color: "#fff",
    fontSize: "34px",
    fontWeight: "900",
    letterSpacing: "-0.03em",
    margin: 0,
    lineHeight: 1.15,
  },
  pageTitleMobile: {
    fontSize: "28px",
  },
  roleBadge: {
    padding: "14px 20px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#fff",
    fontWeight: "800",
    fontSize: "16px",
    flexShrink: 0,
  },
  notificationWrapper: {
    position: "relative",
  },
  notificationButton: {
    position: "relative",
    width: "54px",
    height: "54px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 24px rgba(0,0,0,0.16)",
    cursor: "pointer",
  },
  notificationIcon: {
    fontSize: "24px",
    lineHeight: 1,
  },
  notificationCount: {
    position: "absolute",
    top: "-4px",
    right: "-4px",
    minWidth: "22px",
    height: "22px",
    padding: "0 6px",
    borderRadius: "999px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 8px 16px rgba(239,68,68,0.28)",
  },
  notificationDropdown: {
    position: "absolute",
    top: "64px",
    right: 0,
    width: "min(92vw, 400px)",
    padding: "18px",
    borderRadius: "24px",
    background: "rgba(10,18,32,0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 28px 70px rgba(0,0,0,0.34)",
    backdropFilter: "blur(18px)",
    zIndex: 20,
  },
  notificationHeader: {
    display: "flex",
    justifyContent: "space-between",
    gap: "12px",
    alignItems: "flex-start",
    marginBottom: "14px",
  },
  notificationTitle: {
    margin: 0,
    color: "#fff",
    fontSize: "18px",
    fontWeight: "800",
  },
  notificationSubtitle: {
    marginTop: "5px",
    color: "rgba(255,255,255,0.68)",
    fontSize: "13px",
  },
  notificationLinkButton: {
    border: "none",
    background: "transparent",
    color: "#93c5fd",
    fontWeight: "800",
  },
  notificationList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    maxHeight: "360px",
    overflowY: "auto",
    paddingRight: "4px",
  },
  notificationItem: {
    textAlign: "left",
    padding: "14px",
    borderRadius: "18px",
    border: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    color: "#fff",
  },
  notificationItemRead: {
    opacity: 0.74,
  },
  notificationItemTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "8px",
  },
  notificationItemType: {
    color: "#67e8f9",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  notificationItemDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#38bdf8",
    boxShadow: "0 0 16px rgba(56,189,248,0.6)",
  },
  notificationItemTitle: {
    display: "block",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "800",
    marginBottom: "6px",
  },
  notificationItemMessage: {
    margin: 0,
    color: "rgba(255,255,255,0.76)",
    fontSize: "13px",
    lineHeight: 1.55,
  },
  notificationItemTime: {
    display: "inline-block",
    marginTop: "8px",
    color: "rgba(255,255,255,0.55)",
    fontSize: "12px",
    fontWeight: "700",
  },
  notificationFooterButton: {
    marginTop: "14px",
    width: "100%",
    padding: "13px 14px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.06)",
    color: "#fff",
    fontWeight: "800",
  },
  notificationEmpty: {
    padding: "14px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.68)",
    fontWeight: "700",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    width: "100%",
    minWidth: 0,
    paddingBottom: "12px",
  },
};

const formatNotificationType = (type) => {
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

export default DashboardShell;
