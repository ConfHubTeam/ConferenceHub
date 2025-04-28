import { useContext, useState } from "react";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import { Navigate, useParams } from "react-router-dom";
import api from "../utils/api";
import AccountNav from "../components/AccountNav";

export default function ProfilePage({}) {
  const [redirect, setRedirect] = useState(); // control the redirect after logout
  const { isReady, user, setUser, setReady } = useContext(UserContext); // check the user data loading status
  const { notify } = useNotification();

  if (!isReady) {
    return <div className="px-14"><p>Loading...</p></div>;
  }

  if (isReady && !user && !redirect) {
    // check if user logined
    return <Navigate to={"/login"} />;
  }

  async function logout() {
    await api.post("/logout");
    notify("Successfully logged out", "success");
    setRedirect("/");
    setUser(null);
  }

  if (redirect) {
    return <Navigate to={redirect} />;
  }

  return (
    <div>
      <AccountNav />
      <div className="text-center max-w-lg mx-auto mt-8">
        {/* User info card */}
        <div className="bg-white shadow p-6 rounded-lg">
          <div className="mb-5">
            <div className="text-3xl font-bold mb-1">{user.name}</div>
            <div className="text-gray-500">{user.email}</div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h3 className="font-semibold text-lg mb-3">Account Information</h3>
            <div className="grid grid-cols-1 gap-3 text-left">
              <div>
                <span className="text-gray-600">Account Type:</span> 
                <span className="font-medium ml-2">
                  {user.userType === 'host' ? 
                    'Host (can create and manage conference rooms)' : 
                    'Client (can browse and book conference rooms)'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Member Since:</span>
                <span className="font-medium ml-2">
                  {new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long'})}
                </span>
              </div>
            </div>
          </div>

          <button onClick={logout} className="primary max-w-sm mt-6">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
