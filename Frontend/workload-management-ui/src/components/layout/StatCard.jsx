const StatCard = ({ title, value, subtitle, loading = false, accent }) => {
  return (
    <div style={{ ...styles.card, ...(accent ? { borderTop: `3px solid ${accent}` } : {}) }}>
      <style>{`
        @keyframes statCardShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <p style={styles.title}>{title}</p>
      {loading ? (
        <div style={styles.loadingGroup}>
          <div style={{ ...styles.skeleton, ...styles.valueSkeleton }} />
          <div style={{ ...styles.skeleton, ...styles.subtitleSkeleton }} />
          <div style={{ ...styles.skeleton, ...styles.subtitleSkeletonShort }} />
        </div>
      ) : (
        <>
          <h3 style={{ ...styles.value, ...(accent ? { color: accent, textShadow: `0 6px 24px ${accent}55` } : {}) }}>{value}</h3>
          <p style={styles.subtitle}>{subtitle}</p>
        </>
      )}
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
    wordBreak: "break-word",
  },
  subtitle: {
    color: "rgba(255,255,255,0.78)",
    fontSize: "15px",
    lineHeight: 1.7,
  },
  loadingGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  skeleton: {
    borderRadius: "999px",
    background:
      "linear-gradient(90deg, rgba(255,255,255,0.08) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.08) 75%)",
    backgroundSize: "200% 100%",
    animation: "statCardShimmer 1.5s ease-in-out infinite",
  },
  valueSkeleton: {
    width: "42%",
    height: "46px",
    borderRadius: "14px",
    marginBottom: "2px",
  },
  subtitleSkeleton: {
    width: "90%",
    height: "14px",
  },
  subtitleSkeletonShort: {
    width: "68%",
    height: "14px",
  },
};

export default StatCard;
