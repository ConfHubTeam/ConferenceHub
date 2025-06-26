import Header from "./Header";
import { Outlet, useLocation } from "react-router-dom";

export default function Layout() {
  const location = useLocation();
  const isLandingPage = location.pathname === "/landingpage";

  if (isLandingPage) {
    return (
      <div className="min-h-screen">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="py-5 flex flex-col min-h-screen">
      <Header />
      <hr className="mt-5 mb-10 w-full"/>
      <Outlet />
    </div>
  );
}
