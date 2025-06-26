import { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "./UserContext";
import IndexPage from "../pages/IndexPage";

export default function AuthenticatedRoute() {
  const { user, isReady } = useContext(UserContext);
  const navigate = useNavigate();

  // Redirect unauthenticated users to landing page
  useEffect(() => {
    if (isReady && !user) {
      navigate("/landingpage");
    }
  }, [user, isReady, navigate]);

  // Show loading while checking authentication
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render the main page if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Render the main places page for authenticated users
  return <IndexPage />;
}
