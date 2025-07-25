import { useContext, useState, useEffect } from "react";
import { Link, Navigate, useSearchParams, useLocation } from "react-router-dom";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import api, { getPasswordRequirements } from "../utils/api";
import { validateForm } from "../utils/formUtils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/account");
  const [error, setError] = useState("");
  const [showAdminHint, setShowAdminHint] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [passwordRequirements, setPasswordRequirements] = useState({
    allowedSpecialChars: "@$!%*?&"
  });

  const {setUser} = useContext(UserContext);
  const { notify } = useNotification();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(String(email).toLowerCase());
  };

  // Update email validity when email changes
  useEffect(() => {
    if (email) {
      setEmailValid(validateEmail(email));
    } else {
      setEmailValid(true); // Don't show error for empty email
    }
  }, [email]);
  
  // Fetch password requirements when component mounts
  useEffect(() => {
    const fetchPasswordRequirements = async () => {
      try {
        const requirements = await getPasswordRequirements();
        setPasswordRequirements(requirements);
      } catch (error) {
        console.error("Error fetching password requirements:", error);
      }
    };
    
    fetchPasswordRequirements();
    
    // Check for Telegram auth errors
    const telegramAuthError = localStorage.getItem('telegram_auth_error');
    if (telegramAuthError) {
      setError(telegramAuthError);
      notify(telegramAuthError, "error");
      localStorage.removeItem('telegram_auth_error');
    }

    // Check for redirect URL in search params
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      setRedirectTo(decodeURIComponent(redirectUrl));
    }
  }, [notify, searchParams]);

  async function loginUser(event) {
    event.preventDefault();
    setError("");
    
    // Validate email format
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }
    
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
      const {data} = await api.post("/auth/login", {email, password});
      setUser(data); // get the user data
      
      // Show appropriate notification based on user type
      if (data.userType === 'agent') {
        notify("Welcome, Administrator", "success");
      } else {
        notify("Successfully logged in", "success");
      }
      
      setRedirect(true);
    } catch (e) {
      if (e.response?.data?.error && e.response.data.error.includes("special characters")) {
        // Format password error message to highlight allowed special characters
        setError(`${e.response.data.error}. Allowed special characters: ${passwordRequirements.allowedSpecialChars}`);
      } else {
        setError(e.response?.data?.error || "Login failed. Please check your credentials.");
      }
    }
  }

  // Toggle admin hint when the title is clicked
  const handleTitleClick = () => {
    setShowAdminHint(prev => !prev);
  };

  if (redirect) {
    return <Navigate to={redirectTo}/>
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
              className={`w-full px-3 py-1.5 sm:py-2 border ${emailValid ? 'border-gray-300' : 'border-red-500'} rounded-md focus:outline-none focus:ring-2 ${emailValid ? 'focus:ring-primary' : 'focus:ring-red-500'}`}
              required
            />
            {!emailValid && email && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid email address</p>
            )}
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
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm mb-3">or continue with</p>
            <Link 
              to="/telegram-auth" 
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#0088cc] text-white rounded-md hover:bg-[#0077b5] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 240 240">
                <path fill="white" d="M66.964 134.874s-32.08-10.062-51.344-16.002c-17.542-6.693-1.57-14.928 6.015-17.59 7.585-2.66 186.38-71.948 194.94-75.233 8.94-4.147 19.884-.35 14.767 18.656-4.416 20.407-30.166 142.874-33.827 158.812-3.66 15.937-18.447 6.844-18.447 6.844l-83.21-61.442z" />
                <path fill="none" stroke="white" strokeWidth="8" d="M86.232 157.428c-12.023 12.024-22.92 6.417-22.92 6.417l-20.158-27.902 89.261-71.267c7.585-6.067 2.799-7.586 2.799-7.586s-4.447 1.519-9.383 6.455c-4.936 4.935-82.733 74.293-82.733 74.293" />
              </svg>
              Login with Telegram
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
