import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const dashboardPath =
    user?.role === "Admin"
      ? "/admin/dashboard"
      : user?.role === "TeamLeader"
      ? "/leader/dashboard"
      : user?.role === "Member"
      ? "/member/dashboard"
      : "/login";

  return (
    <>
      <style>{`
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .notfound-back-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
        .notfound-dash-btn:hover {
          opacity: 0.88;
          transform: translateY(-1px);
        }
      `}</style>

      <div style={styles.page}>
        <div style={styles.glowOne} />
        <div style={styles.glowTwo} />

        <div style={styles.card}>
          <div style={styles.iconWrapper}>
            <span style={styles.icon}>🌌</span>
          </div>

          <div style={styles.codeTag}>404 — Not Found</div>

          <h1 style={styles.title}>Page Not Found</h1>

          <p style={styles.message}>
            The page you're looking for doesn't exist, was moved, or the URL
            might be typed incorrectly.
          </p>

          <div style={styles.divider} />

          <p style={styles.hint}>
            Double-check the address or head back to safety using the buttons
            below.
          </p>

          <div style={styles.actions}>
            <button
              className="notfound-back-btn"
              style={styles.backBtn}
              onClick={() => navigate(-1)}
            >
              ← Go Back
            </button>
            <button
              className="notfound-dash-btn"
              style={styles.dashBtn}
              onClick={() => navigate(dashboardPath)}
            >
              My Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

const styles = {
  page: {
    width: "100vw",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "radial-gradient(circle at top left, rgba(59,130,246,0.14), transparent 28%), radial-gradient(circle at bottom right, rgba(99,102,241,0.16), transparent 26%), linear-gradient(135deg, #0b1220 0%, #09111f 38%, #0f172a 100%)",
    position: "relative",
    overflow: "hidden",
  },
  glowOne: {
    position: "absolute",
    top: "-100px",
    right: "-80px",
    width: "340px",
    height: "340px",
    borderRadius: "50%",
    background: "rgba(99,102,241,0.14)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  glowTwo: {
    position: "absolute",
    bottom: "-100px",
    left: "-80px",
    width: "300px",
    height: "300px",
    borderRadius: "50%",
    background: "rgba(56,189,248,0.12)",
    filter: "blur(90px)",
    pointerEvents: "none",
  },
  card: {
    position: "relative",
    zIndex: 1,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    backdropFilter: "blur(20px)",
    borderRadius: "32px",
    padding: "56px 52px",
    maxWidth: "520px",
    width: "90%",
    textAlign: "center",
    boxShadow: "0 30px 80px rgba(0,0,0,0.3)",
  },
  iconWrapper: {
    marginBottom: "24px",
    animation: "floatIcon 3s ease-in-out infinite",
    display: "inline-block",
  },
  icon: {
    fontSize: "72px",
    lineHeight: 1,
  },
  codeTag: {
    display: "inline-block",
    padding: "6px 18px",
    borderRadius: "999px",
    background: "rgba(99,102,241,0.15)",
    border: "1px solid rgba(99,102,241,0.35)",
    color: "#a5b4fc",
    fontSize: "13px",
    fontWeight: "700",
    letterSpacing: "0.06em",
    marginBottom: "20px",
  },
  title: {
    color: "#fff",
    fontSize: "36px",
    fontWeight: "900",
    margin: "0 0 18px",
    letterSpacing: "-0.03em",
  },
  message: {
    color: "rgba(255,255,255,0.78)",
    fontSize: "15px",
    lineHeight: 1.75,
    margin: "0 0 24px",
  },
  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.08)",
    marginBottom: "24px",
  },
  hint: {
    color: "rgba(255,255,255,0.5)",
    fontSize: "13px",
    lineHeight: 1.7,
    margin: "0 0 36px",
  },
  actions: {
    display: "flex",
    gap: "14px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  backBtn: {
    padding: "14px 28px",
    borderRadius: "16px",
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.08)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "opacity 0.18s, transform 0.18s",
  },
  dashBtn: {
    padding: "14px 28px",
    borderRadius: "16px",
    border: "none",
    background: "linear-gradient(135deg, #4f46e5, #38bdf8)",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 10px 28px rgba(79,70,229,0.3)",
    transition: "opacity 0.18s, transform 0.18s",
  },
};

export default NotFoundPage;
