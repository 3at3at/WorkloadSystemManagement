import { Outlet } from "react-router-dom";

const MemberLayout = () => {
  return (
    <div>
      <h2>Member Layout</h2>
      <Outlet />
    </div>
  );
};

export default MemberLayout;