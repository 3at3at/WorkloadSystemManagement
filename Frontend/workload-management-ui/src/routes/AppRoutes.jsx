import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import ProtectedRoute from "./ProtectedRoute";

import LoginPage from "../pages/auth/LoginPage";
import AdminDashboard from "../pages/dashboard/AdminDashboard";
import TeamLeaderDashboard from "../pages/dashboard/TeamLeaderDashboard";
import MemberDashboard from "../pages/dashboard/MemberDashboard";
import UnauthorizedPage from "../pages/common/UnauthorizedPage";
import NotFoundPage from "../pages/common/NotFoundPage";
import UsersPage from "../pages/users/UsersPage";
import TasksPage from "../pages/tasks/TasksPage";
import WorkloadPage from "../pages/workload/WorkloadPage";
import ApprovalsPage from "../pages/approvals/ApprovalsPage";
import NotificationsPage from "../pages/notifications/NotificationsPage";

const pageVariants = {
  initial: { opacity: 0, y: 18, scale: 0.992, filter: "blur(6px)" },
  animate: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
  exit: { opacity: 0, y: -12, scale: 0.992, filter: "blur(4px)" },
};

const pageTransition = {
  duration: 0.34,
  ease: [0.22, 1, 0.36, 1],
};

const AnimatedPage = ({ children }) => (
  <motion.div
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
    style={{ minHeight: "100%" }}
  >
    {children}
  </motion.div>
);

const RouteProgress = ({ routeKey }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={routeKey}
      initial={{ scaleX: 0, opacity: 1 }}
      animate={{ scaleX: 1, opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: "3px",
        transformOrigin: "left",
        zIndex: 9999,
        background: "linear-gradient(90deg, #38bdf8, #4f46e5, #8b5cf6)",
        boxShadow: "0 0 18px rgba(99,102,241,0.55)",
      }}
    />
  </AnimatePresence>
);

const AppRoutes = () => {
  const location = useLocation();

  return (
    <>
      <RouteProgress routeKey={location.pathname} />

      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedPage><Navigate to="/login" replace /></AnimatedPage>} />
          <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
          <Route path="/unauthorized" element={<AnimatedPage><UnauthorizedPage /></AnimatedPage>} />

          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["Admin"]}><AnimatedPage><AdminDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["Admin"]}><AnimatedPage><UsersPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/tasks" element={<ProtectedRoute allowedRoles={["Admin"]}><AnimatedPage><TasksPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/workload" element={<ProtectedRoute allowedRoles={["Admin"]}><AnimatedPage><WorkloadPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/approvals" element={<ProtectedRoute allowedRoles={["Admin"]}><AnimatedPage><ApprovalsPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/admin/notifications" element={<ProtectedRoute allowedRoles={["Admin"]}><AnimatedPage><NotificationsPage /></AnimatedPage></ProtectedRoute>} />

          <Route path="/leader/dashboard" element={<ProtectedRoute allowedRoles={["TeamLeader"]}><AnimatedPage><TeamLeaderDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/leader/tasks" element={<ProtectedRoute allowedRoles={["TeamLeader"]}><AnimatedPage><TasksPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/leader/workload" element={<ProtectedRoute allowedRoles={["TeamLeader"]}><AnimatedPage><WorkloadPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/leader/approvals" element={<ProtectedRoute allowedRoles={["TeamLeader"]}><AnimatedPage><ApprovalsPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/leader/notifications" element={<ProtectedRoute allowedRoles={["TeamLeader"]}><AnimatedPage><NotificationsPage /></AnimatedPage></ProtectedRoute>} />

          <Route path="/member/dashboard" element={<ProtectedRoute allowedRoles={["Member"]}><AnimatedPage><MemberDashboard /></AnimatedPage></ProtectedRoute>} />
          <Route path="/member/tasks" element={<ProtectedRoute allowedRoles={["Member"]}><AnimatedPage><TasksPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/member/workload" element={<ProtectedRoute allowedRoles={["Member"]}><AnimatedPage><WorkloadPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/member/approvals" element={<ProtectedRoute allowedRoles={["Member"]}><AnimatedPage><ApprovalsPage /></AnimatedPage></ProtectedRoute>} />
          <Route path="/member/notifications" element={<ProtectedRoute allowedRoles={["Member"]}><AnimatedPage><NotificationsPage /></AnimatedPage></ProtectedRoute>} />

          <Route path="*" element={<AnimatedPage><NotFoundPage /></AnimatedPage>} />
        </Routes>
      </AnimatePresence>
    </>
  );
};

export default AppRoutes;
