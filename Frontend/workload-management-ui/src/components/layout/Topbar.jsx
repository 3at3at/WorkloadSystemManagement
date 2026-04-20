import { motion } from "framer-motion";

const Topbar = ({ user, title }) => {
  return (
    <motion.header
      style={styles.topbar}
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        <p style={styles.smallText}>Welcome back</p>
        <h1 style={styles.title}>{title}</h1>
      </div>

      <div style={styles.rightSection}>
        <div style={styles.badge}>{user?.role}</div>
      </div>
    </motion.header>
  );
};

const styles = {
  topbar: {
    padding: "22px 28px 0 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  smallText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: "14px",
    marginBottom: "4px",
  },
  title: {
    fontSize: "30px",
    fontWeight: "800",
  },
  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  badge: {
    padding: "10px 14px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontWeight: "700",
    fontSize: "14px",
  },
};

export default Topbar;