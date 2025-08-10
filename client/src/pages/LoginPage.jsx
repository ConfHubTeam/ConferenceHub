import { useContext, useState, useEffect } from "react";
import { Link, Navigate, useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { UserContext } from "../components/UserContext";
import { useNotification } from "../components/NotificationContext";
import api, { getPasswordRequirements } from "../utils/api";
import { validateForm } from "../utils/formUtils";
import { withTranslationLoading } from "../i18n/hoc/withTranslationLoading";

function LoginPageBase() {
  const { t, ready } = useTranslation(["auth", "common"]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/account");
  const [error, setError] = useState("");
  const [showAdminHint, setShowAdminHint] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
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

  // Custom validation messages for HTML5 validation
  useEffect(() => {
    if (ready) {
      // Override browser's default validation messages
      const emailInput = document.getElementById('email');
      const passwordInput = document.getElementById('password');
      
      if (emailInput) {
        emailInput.setCustomValidity('');
        emailInput.oninvalid = function(e) {
          if (emailInput.validity.valueMissing) {
            emailInput.setCustomValidity(t("auth:validation.emailRequired"));
          } else if (emailInput.validity.typeMismatch) {
            emailInput.setCustomValidity(t("auth:validation.emailInvalid"));
          } else {
            emailInput.setCustomValidity('');
          }
        };
        emailInput.oninput = function() {
          emailInput.setCustomValidity('');
        };
      }
      
      if (passwordInput) {
        passwordInput.setCustomValidity('');
        passwordInput.oninvalid = function(e) {
          if (passwordInput.validity.valueMissing) {
            passwordInput.setCustomValidity(t("auth:validation.passwordRequired"));
          } else {
            passwordInput.setCustomValidity('');
          }
        };
        passwordInput.oninput = function() {
          passwordInput.setCustomValidity('');
        };
      }
    }
  }, [ready, t]);
  
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
    const isValid = validateForm(
      { email, password },
      {
        email: { required: true, errorMessage: ready ? t("auth:validation.emailInvalid") : "Email is required" },
        password: { required: true, errorMessage: ready ? t("auth:validation.required") : "Password is required" }
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
        notify(ready ? t("auth:login.adminWelcome", "Welcome, Administrator") : "Welcome, Administrator", "success");
      } else {
        notify(ready ? t("auth:login.loginSuccess") : "Successfully logged in", "success");
      }
      
      setRedirect(true);
    } catch (e) {
      if (e.response?.data?.error && e.response.data.error.includes("special characters")) {
        // Format password error message to highlight allowed special characters
        setError(`${e.response?.data?.error}. ${ready ? t("auth:validation.allowedSpecialChars", "Allowed special characters") : "Allowed special characters"}: ${passwordRequirements.allowedSpecialChars}`);
      } else {
        setError(e.response?.data?.error || (ready ? t("auth:login.loginError") : "Login failed. Please check your credentials."));
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
    <div className="spacing-container pt-8 sm:pt-10 md:pt-12">
      <div className="w-full max-w-sm mx-auto">
        <h1 
          className="text-2xl sm:text-3xl font-bold text-center mb-1 sm:mb-2 cursor-pointer" 
          onClick={handleTitleClick}
        >
          {ready ? t("auth:login.title") : "Login"}
        </h1>
        <p className="text-center text-gray-500 text-xs sm:text-sm mb-3 sm:mb-4">
          {ready ? t("auth:login.subtitle") : "Welcome back!"}
          {showAdminHint && (
            <span className="block text-xs text-gray-400 mt-1">
              {ready ? t("auth:login.adminHint", "Administrators can also login here") : "Administrators can also login here"}
            </span>
          )}
        </p>
        
        <form className="bg-white p-3 sm:p-6 rounded-xl shadow-sm" onSubmit={loginUser}>
          {error && (
            <div className="bg-error-100 text-error-800 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="mb-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {ready ? t("auth:login.email") : "Email"}
            </label>
            <input
              id="email"
              type="email"
              placeholder={ready ? t("auth:login.emailPlaceholder") : "your@email.com"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={`w-full px-3 py-1.5 sm:py-2 border ${emailValid ? 'border-gray-300' : 'border-error-500'} rounded-md focus:outline-none focus:ring-2 ${emailValid ? 'focus:ring-primary' : 'focus:ring-error-500'}`}
              required
            />
            {!emailValid && email && (
              <p className="text-error-500 text-xs mt-1">
                {ready ? t("auth:validation.emailInvalid") : "Please enter a valid email address"}
              </p>
            )}
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              {ready ? t("auth:login.password") : "Password"}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={ready ? t("auth:login.passwordPlaceholder") : "••••••••"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full px-3 py-1.5 sm:py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <button className="w-full bg-primary text-white py-1.5 sm:py-2 px-4 rounded-md hover:bg-primary-dark transition-colors font-medium">
            {ready ? t("auth:login.loginButton") : "Login"}
          </button>
          
          <div className="text-center py-2 text-gray-500 text-xs sm:text-sm">
            {ready ? t("auth:login.noAccount") : "Don't have an account?"}{" "}
            <Link className="text-primary font-medium hover:underline" to={"/register"}>
              {ready ? t("auth:login.registerLink") : "Register now"}
            </Link>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm mb-3">
              {ready ? t("auth:login.orContinueWith") : "or continue with"}
            </p>
            <Link 
              to="/telegram-auth" 
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#0088cc] text-white rounded-md hover:bg-[#0077b5] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 240 240">
                <path fill="white" d="M66.964 134.874s-32.08-10.062-51.344-16.002c-17.542-6.693-1.57-14.928 6.015-17.59 7.585-2.66 186.38-71.948 194.94-75.233 8.94-4.147 19.884-.35 14.767 18.656-4.416 20.407-30.166 142.874-33.827 158.812-3.66 15.937-18.447 6.844-18.447 6.844l-83.21-61.442z" />
                <path fill="none" stroke="white" strokeWidth="8" d="M86.232 157.428c-12.023 12.024-22.92 6.417-22.92 6.417l-20.158-27.902 89.261-71.267c7.585-6.067 2.799-7.586 2.799-7.586s-4.447 1.519-9.383 6.455c-4.936 4.935-82.733 74.293-82.733 74.293" />
              </svg>
              {ready ? t("auth:login.telegramLogin") : "Login with Telegram"}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withTranslationLoading(LoginPageBase, ["auth", "common"]);
