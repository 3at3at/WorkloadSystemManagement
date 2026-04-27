import { useEffect } from "react";
import AppRoutes from "./routes/AppRoutes";
import { useAuth } from "./context/AuthContext";

const formatRoleLabel = (role) => {
  if (!role) return "";
  if (role === "TeamLeader") return "Team Leader";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

function App() {
  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role) {
      document.title = `Workload Pro - ${formatRoleLabel(user.role)}`;
    } else {
      document.title = "Workload Pro";
    }
  }, [user]);

  return <AppRoutes />;
}

export default App;