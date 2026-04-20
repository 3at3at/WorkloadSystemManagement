import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const DashboardShell = ({ user, title, children }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
      ]
    : isLeader
    ? [
        { label: "Dashboard", path: "/leader/dashboard" },
        { label: "Tasks", path: "/leader/tasks" },
        { label: "Workload", path: "/leader/workload" },
        { label: "Approvals", path: "/leader/approvals" },
      ]
    : [
        { label: "Dashboard", path: "/member/dashboard" },
        { label: "My Tasks", path: "/member/tasks" },
        { label: "My Workload", path: "/member/workload" },
        { label: "My Approvals", path: "/member/approvals" },
      ];

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

        <aside style={styles.sidebar}>
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
              <div>
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
        </aside>

        <main className="dashboard-main-scroll" style={styles.main}>
          <div style={styles.topBar}>
            <div>
              <p style={styles.welcomeText}>Welcome back</p>
              <h1 style={styles.pageTitle}>{title}</h1>
            </div>

            <div style={styles.roleBadge}>{user?.role}</div>
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
  sidebar: {
    position: "fixed",
    top: PAGE_PADDING,
    left: PAGE_PADDING,
    width: `${SIDEBAR_WIDTH}px`,
    height: `calc(100vh - ${PAGE_PADDING * 2}px)`,
    zIndex: 10,
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
    left: `${MAIN_LEFT_OFFSET}px`,
    width: `calc(100vw - ${MAIN_LEFT_OFFSET + PAGE_PADDING}px)`,
    height: "100vh",
    zIndex: 1,
    paddingTop: "56px",
    paddingRight: "20px",
    paddingBottom: "28px",
    overflowX: "hidden",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "22px",
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
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "22px",
    width: "100%",
    minWidth: 0,
    paddingBottom: "12px",
  },
};

export default DashboardShell;