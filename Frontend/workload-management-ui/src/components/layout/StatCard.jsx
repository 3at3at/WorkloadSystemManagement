const StatCard = ({ title, value, subtitle }) => {
  return (
    <div style={styles.card}>
      <p style={styles.title}>{title}</p>
      <h3 style={styles.value}>{value}</h3>
      <p style={styles.subtitle}>{subtitle}</p>
    </div>
  );
};

const styles = {
  card: {
    padding: "26px",
    borderRadius: "24px",
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(14px)",
    minHeight: "190px",
    boxShadow: "0 20px 40px rgba(0,0,0,0.16)",
  },
  title: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "16px",
    fontWeight: "700",
    marginBottom: "18px",
  },
  value: {
    color: "#ffffff",
    fontSize: "44px",
    fontWeight: "900",
    lineHeight: 1.05,
    marginBottom: "16px",
    letterSpacing: "-0.03em",
    textShadow: "0 6px 20px rgba(255,255,255,0.08)",
  },
  subtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: "15px",
    lineHeight: 1.7,
  },
};

export default StatCard;