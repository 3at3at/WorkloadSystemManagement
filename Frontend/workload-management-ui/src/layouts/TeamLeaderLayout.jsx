import { Outlet } from "react-router-dom";

const TeamLeaderLayout = () => {
  return (
    <div>
      <h2>Team Leader Layout</h2>
      <Outlet />
    </div>
  );
};

export default TeamLeaderLayout;