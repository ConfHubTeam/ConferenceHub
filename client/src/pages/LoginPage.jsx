import { useContext, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import api from "../utils/api";
import { validateForm } from "../utils/formUtils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [error, setError] = useState("");
  const [showAdminHint, setShowAdminHint] = useState(false);

  const {setUser} = useContext(UserContext);
  const { notify } = useNotification();

  async function loginUser(event) {
    event.preventDefault();
    setError("");
    
    // Validate form
    const { isValid, errorMessage } = validateForm(
      { email, password },
      {
        email: { required: true, errorMessage: "Email is required" },
        password: { required: true, errorMessage: "Password is required" }
      }
    );
    
    if (!isValid) {
      setError(errorMessage);
      return;
    }
    
    try {
      const {data} = await api.post("/login", {email, password});
      setUser(data); // get the user data
      
      // Show appropriate notification based on user type
      if (data.userType === 'agent') {
        notify("Welcome, Administrator", "success");
      } else {
        notify("Successfully logged in", "success");
      }
      
      setRedirect(true);
    } catch (e) {
      setError(e.response?.data?.error || "Login failed. Please check your credentials.");
    }
  }

  // Toggle admin hint when the title is clicked
  const handleTitleClick = () => {
    setShowAdminHint(prev => !prev);
  };

  if (redirect) {
    return <Navigate to={"/"}/>
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12 md:pt-14">
      <div className="w-full max-w-sm mx-auto">
        <h1 
          className="text-2xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 cursor-pointer" 
          onClick={handleTitleClick}
        >
          Login
        </h1>
        <p className="text-center text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">
          Welcome back!
          {showAdminHint && (
            <span className="block text-xs text-gray-400 mt-1">
              Administrators can also login here
            </span>
          )}
        </p>
        
        <form className="bg-white p-3 sm:p-6 rounded-xl shadow-sm" onSubmit={loginUser}>
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-1.5 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <button className="w-full bg-primary text-white py-1.5 sm:py-2 px-4 rounded-md hover:bg-primary-dark transition-colors font-medium">
            Login
          </button>
          
          <div className="text-center py-2 text-gray-500 text-xs sm:text-sm">
            Don't have an account?{" "}
            <Link className="text-primary font-medium hover:underline" to={"/register"}>
              Register now
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
