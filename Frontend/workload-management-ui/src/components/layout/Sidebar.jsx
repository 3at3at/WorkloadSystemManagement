import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Sidebar = ({ user }) => {
  const { logout } = useAuth();

  const linksByRole = {
    Admin: [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Users", path: "/admin/users" },
      { label: "Tasks", path: "/admin/tasks" },
      { label: "Workload", path: "/admin/workload" },
      { label: "Approvals", path: "/admin/approvals" },
    ],
    TeamLeader: [
      { label: "Dashboard", path: "/leader/dashboard" },
      { label: "Tasks", path: "/leader/tasks" },
      { label: "Workload", path: "/leader/workload" },
      { label: "Approvals", path: "/leader/approvals" },
    ],
    Member: [
      { label: "Dashboard", path: "/member/dashboard" },
      { label: "My Tasks", path: "/member/tasks" },
      { label: "My Workload", path: "/member/workload" },
      { label: "My Approvals", path: "/member/approvals" },
    ],
  };

  const links = linksByRole[user?.role] || [];

  return (
    <motion.aside
      style={styles.sidebar}
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.45 }}
    >
      <div>
        <div style={styles.brandBox}>
          <div style={styles.logo}>W</div>
          <div>
            <h2 style={styles.brandTitle}>Workload Pro</h2>
            <p style={styles.brandSubtitle}>Team Management</p>
          </div>
        </div>

        <div style={styles.profileBox}>
          <div style={styles.avatar}>
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>
          <div>
            <h3 style={styles.profileName}>{user?.fullName}</h3>
            <p style={styles.profileRole}>{user?.role}</p>
          </div>
        </div>

        <nav style={styles.nav}>
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              style={({ isActive }) => ({
                ...styles.link,
                ...(isActive ? styles.activeLink : {}),
              })}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <motion.button
        style={styles.logoutButton}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={logout}
      >
        Logout
      </motion.button>
    </motion.aside>
  );
};

const styles = {
  sidebar: {
    width: "280px",
    padding: "24px 18px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    borderRight: "1px solid rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(18px)",
  },
  brandBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    marginBottom: "28px",
  },
  logo: {
    width: "52px",
    height: "52px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #4f46e5, #06b6d4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "22px",
    boxShadow: "0 10px 30px rgba(79,70,229,0.35)",
  },
  brandTitle: {
    fontSize: "20px",
    fontWeight: "800",
    marginBottom: "4px",
  },
  brandSubtitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
  },
  profileBox: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "16px",
    borderRadius: "20px",
    background: "rgba(255,255,255,0.06)",
    marginBottom: "26px",
  },
  avatar: {
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #38bdf8, #4f46e5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "20px",
  },
  profileName: {
    fontSize: "15px",
    fontWeight: "700",
  },
  profileRole: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.72)",
    marginTop: "3px",
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  link: {
    padding: "14px 16px",
    borderRadius: "16px",
    color: "#fff",
    fontWeight: "600",
    background: "transparent",
    transition: "0.25s ease",
  },
  activeLink: {
    background: "linear-gradient(135deg, rgba(79,70,229,0.34), rgba(6,182,212,0.22))",
    boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)",
  },
  logoutButton: {
    padding: "14px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    fontWeight: "700",
  },
};

export default Sidebar;