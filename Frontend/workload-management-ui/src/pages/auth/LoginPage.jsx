import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const floatingTransition = {
  duration: 6,
  repeat: Infinity,
  ease: "easeInOut",
};

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loading, initializing } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (initializing) {
    return <div>Loading...</div>;
  }

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const redirectByRole = (role) => {
    if (role === "Admin") return navigate("/admin/dashboard");
    if (role === "TeamLeader") return navigate("/leader/dashboard");
    if (role === "Member") return navigate("/member/dashboard");
    navigate("/unauthorized");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    try {
      const loggedInUser = await login(formData);
      redirectByRole(loggedInUser.role);
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    }
  };

  return (
    <div style={styles.page}>
      <motion.div
        style={styles.orbOne}
        animate={{ x: [0, 30, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ ...floatingTransition, duration: 7 }}
      />
      <motion.div
        style={styles.orbTwo}
        animate={{ x: [0, -25, 0], y: [0, 25, 0], scale: [1, 1.12, 1] }}
        transition={{ ...floatingTransition, duration: 8 }}
      />
      <motion.div
        style={styles.orbThree}
        animate={{ x: [0, 20, 0], y: [0, 18, 0], rotate: [0, 12, 0] }}
        transition={{ ...floatingTransition, duration: 9 }}
      />

      <motion.div
        style={styles.gridGlow}
        animate={{ opacity: [0.16, 0.28, 0.16] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        style={styles.card}
        initial={{ opacity: 0, y: 36, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        whileHover={{ y: -4 }}
      >
        <div style={styles.leftSection}>
          <motion.div
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            style={styles.badge}
            whileHover={{ scale: 1.05 }}
          >
            Smart Team Workflow
          </motion.div>

          <motion.h1
            style={styles.title}
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            Manage <span style={styles.italicAccent}>Tasks</span>.
            <br />
            Balance <span style={styles.thinAccent}>Workload</span>.
            <br />
            Approve <span style={styles.connectedAccent}>Smarter</span>.
          </motion.h1>

          <motion.div
            style={styles.subtitleWrapper}
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.28, duration: 0.5 }}
          >
            <p style={styles.subtitle}>
              A modern system for software teams to manage assignments,
              approvals, and weekly workload with
              <span style={styles.subtitleThin}> clarity</span> and
              <span style={styles.subtitleItalic}> fairness</span>.
            </p>
            <div style={styles.subtitleLine} />
          </motion.div>

          <motion.div
            style={styles.featureList}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <motion.div style={styles.featureItem} whileHover={{ x: 6 }}>
              • Track weighted workload
            </motion.div>
            <motion.div style={styles.featureItem} whileHover={{ x: 6 }}>
              • Role-based approvals
            </motion.div>
            <motion.div style={styles.featureItem} whileHover={{ x: 6 }}>
              • Clean team visibility
            </motion.div>
          </motion.div>
        </div>

        <motion.form
          style={styles.form}
          onSubmit={handleSubmit}
          initial={{ opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              Welcome <span style={styles.formItalic}>Back</span>
            </h2>
            <p style={styles.formSubtitle}>
              Sign in to continue to your dashboard
            </p>
          </div>

          {error && (
            <motion.div
              style={styles.errorBox}
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
            >
              <div style={styles.errorIcon}>!</div>
              <span>{error}</span>
            </motion.div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <motion.input
              whileFocus={{ scale: 1.015 }}
              whileHover={{ y: -1 }}
              transition={{ duration: 0.18 }}
              style={styles.input}
              type="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>

            <div style={styles.passwordWrapper}>
              <motion.input
                whileFocus={{ scale: 1.015 }}
                whileHover={{ y: -1 }}
                transition={{ duration: 0.18 }}
                style={styles.passwordInput}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                style={styles.eyeButton}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "🔒" : "👁"}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            style={{
              ...styles.button,
              ...(loading ? styles.buttonDisabled : {}),
            }}
            whileHover={
              loading
                ? {}
                : {
                    scale: 1.03,
                    y: -2,
                    boxShadow: "0 22px 38px rgba(59,130,246,0.34)",
                  }
            }
            whileTap={loading ? {} : { scale: 0.98 }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: "24px",
    background:
      "radial-gradient(circle at top left, #1e3a8a 0%, #0f172a 35%, #111827 70%, #050816 100%)",
  },
  orbOne: {
    position: "absolute",
    top: "7%",
    left: "6%",
    width: "260px",
    height: "260px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(59,130,246,0.35), rgba(59,130,246,0.04))",
    filter: "blur(18px)",
  },
  orbTwo: {
    position: "absolute",
    bottom: "6%",
    right: "7%",
    width: "320px",
    height: "320px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(139,92,246,0.3), rgba(139,92,246,0.04))",
    filter: "blur(20px)",
  },
  orbThree: {
    position: "absolute",
    top: "28%",
    right: "18%",
    width: "150px",
    height: "150px",
    borderRadius: "30px",
    background:
      "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(79,70,229,0.12))",
    filter: "blur(8px)",
  },
  gridGlow: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
    backgroundSize: "48px 48px",
    maskImage:
      "linear-gradient(to bottom, rgba(0,0,0,1), rgba(0,0,0,0.2))",
  },
  card: {
    width: "100%",
    maxWidth: "1120px",
    display: "grid",
    gridTemplateColumns: "1.1fr 0.9fr",
    borderRadius: "32px",
    overflow: "hidden",
    border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(24px)",
    boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
    position: "relative",
    zIndex: 2,
  },
  leftSection: {
    padding: "58px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    color: "#fff",
    background:
      "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))",
  },
  badge: {
    alignSelf: "flex-start",
    padding: "10px 16px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.08)",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "22px",
    color: "#dbeafe",
  },
  title: {
    fontSize: "48px",
    fontWeight: "800",
    lineHeight: 1.08,
    letterSpacing: "-0.03em",
    marginBottom: "20px",
  },
  italicAccent: {
    fontStyle: "italic",
    color: "#c4b5fd",
  },
  thinAccent: {
    fontWeight: "300",
    color: "#bfdbfe",
  },
  connectedAccent: {
    position: "relative",
    fontWeight: "800",
    color: "#67e8f9",
    textShadow: "0 0 18px rgba(103,232,249,0.25)",
  },
  subtitleWrapper: {
    maxWidth: "500px",
    marginBottom: "24px",
  },
  subtitle: {
    fontSize: "17px",
    lineHeight: 1.8,
    color: "rgba(255,255,255,0.84)",
    marginBottom: "12px",
  },
  subtitleThin: {
    fontWeight: "300",
    color: "#e0f2fe",
  },
  subtitleItalic: {
    fontStyle: "italic",
    color: "#ddd6fe",
  },
  subtitleLine: {
    width: "120px",
    height: "3px",
    borderRadius: "999px",
    background: "linear-gradient(90deg, #38bdf8, #8b5cf6)",
  },
  featureList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  featureItem: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "15px",
    fontWeight: "600",
  },
  form: {
    background: "rgba(255,255,255,0.96)",
    padding: "56px 44px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  },
  formHeader: {
    marginBottom: "24px",
  },
  formTitle: {
    fontSize: "32px",
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: "8px",
    letterSpacing: "-0.02em",
  },
  formItalic: {
    fontStyle: "italic",
    fontWeight: "300",
    color: "#4f46e5",
  },
  formSubtitle: {
    fontSize: "14px",
    color: "#64748b",
    fontWeight: "500",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    marginBottom: "18px",
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
    background: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.22s ease",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  },
  passwordWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  passwordInput: {
    width: "100%",
    padding: "15px 52px 15px 16px",
    borderRadius: "16px",
    border: "1px solid #cbd5e1",
    background: "#fff",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.22s ease",
    boxShadow: "0 4px 14px rgba(15,23,42,0.04)",
  },
  eyeButton: {
    position: "absolute",
    right: "12px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontSize: "18px",
    color: "#475569",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
  },
  button: {
    marginTop: "14px",
    padding: "15px 18px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #2563eb, #06b6d4)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "800",
    boxShadow: "0 16px 32px rgba(59,130,246,0.28)",
    cursor: "pointer",
  },
  buttonDisabled: {
    opacity: 0.72,
    cursor: "not-allowed",
    boxShadow: "none",
  },
  errorBox: {
    marginBottom: "16px",
    padding: "12px 14px",
    borderRadius: "16px",
    background: "linear-gradient(135deg, #fff1f2, #ffe4e6)",
    color: "#b91c1c",
    fontSize: "14px",
    fontWeight: "700",
    border: "1px solid #fecdd3",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    boxShadow: "0 10px 24px rgba(239,68,68,0.08)",
  },
  errorIcon: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#ef4444",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: "800",
    flexShrink: 0,
  },
};

export default LoginPage;