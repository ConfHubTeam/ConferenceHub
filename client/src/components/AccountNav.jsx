import { Link, useLocation } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import api from "../utils/api";

export default function AccountNav() {
  const { pathname } = useLocation(); // /account/:subpage
  const { user } = useContext(UserContext);
  const [pendingCount, setPendingCount] = useState(0);
  let subpage = pathname.split("/")?.[2]; 
  if (subpage === undefined) {
    subpage = "profile";
  }
  
  // Fetch pending booking count for hosts
  useEffect(() => {
    if (user?.userType === 'host') {
      api.get('/bookings/counts')
        .then(({data}) => {
          setPendingCount(data.pendingCount);
        })
        .catch(err => {
          console.error('Error fetching pending count:', err);
        });
    }
  }, [user]);

  function linkClasses(type = null) {
    let classes = "py-2 px-3 sm:px-4 flex items-center justify-center gap-1 rounded-full transition-all whitespace-nowrap";
    if (type === subpage) {
      classes += " bg-primary text-white";
    } else {
      classes += " bg-gray-200 text-gray-800 hover:bg-gray-300"
    }
    return classes;
  }
  
  return (
    <div>
      <nav className="w-full flex flex-row mt-4 mb-6 sm:mb-10 gap-2 sm:gap-4 items-center justify-center">
        <Link className={linkClasses("profile")} to={"/account"}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <span className="text-sm font-medium">Profile</span>
        </Link>
        
        {/* Bookings link with notification badge for hosts */}
        <Link className={linkClasses("bookings")} to={"/account/bookings"}>
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
            {user?.userType === 'host' && pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-sm font-medium">
            {user?.userType === 'host' ? 'Bookings' : 'Bookings'}
          </span>
        </Link>
        
        {/* Conference Rooms link - Only for hosts */}
        {user?.userType === 'host' && (
          <Link className={linkClasses("user-places")} to={"/account/user-places"}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
              />
            </svg>
            <span className="text-sm font-medium">Space</span>
          </Link>
        )}
      </nav>
      
      {/* Show user type indicator */}
      {user && (
        <div className="text-center mb-6">
          <span className={`px-3 py-1 rounded-full text-sm ${
            user.userType === 'host' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {user.userType === 'host' ? 'Host Account' : 'Client Account'}
          </span>
        </div>
      )}
    </div>
  );
}
