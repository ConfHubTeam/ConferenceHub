import { useContext, useState, useEffect } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { withTranslationLoading } from "../i18n/hoc/withTranslationLoading";
import api, { getPasswordRequirements } from "../utils/api";
import { useNotification } from "../components/NotificationContext";
import { validateForm, checkPasswordSpecialChars } from "../utils/formUtils";
import { UserContext } from "../components/UserContext";

function RegisterPage() {
  const { t, ready } = useTranslation(["auth", "common"]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("client");
  const [error, setError] = useState("");
  const [redirect, setRedirect] = useState(false);
  const [redirectTo, setRedirectTo] = useState("/account");
  const [emailValid, setEmailValid] = useState(true);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: 8,
    requiresUppercase: true,
    requiresLowercase: true,
    requiresNumber: true,
    requiresSpecialChar: true,
    allowedSpecialChars: "@$!%*?&"
  });
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: ""
  });
  const [passwordChecklist, setPasswordChecklist] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
    validSpecialChars: true
  });
  const { notify } = useNotification();
  const { setUser } = useContext(UserContext);
  const [searchParams] = useSearchParams();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return emailRegex.test(String(email).toLowerCase());
  };

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let score = 0;
    let feedback = "";

    if (!password) {
      return { score: 0, feedback: "" };
    }

    // Length check
    if (password.length < 6) {
      feedback = "Password is too short";
    } else if (password.length >= 8) {
      score += 1;
    }

    // Check for uppercase letters
    if (/[A-Z]/.test(password)) {
      score += 1;
    }

    // Check for lowercase letters
    if (/[a-z]/.test(password)) {
      score += 1;
    }

    // Check for numbers
    if (/\d/.test(password)) {
      score += 1;
    }

    // Check for special characters
    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }

    // Determine feedback based on score
    if (score < 2) {
      feedback = "Very weak password";
    } else if (score < 3) {
      feedback = "Weak password - add numbers or special characters";
    } else if (score < 4) {
      feedback = "Medium strength - add uppercase or special characters";
    } else if (score < 5) {
      feedback = "Strong password";
    } else {
      feedback = "Very strong password";
    }

    return { score, feedback };
  };

  // Update email validity when email changes
  useEffect(() => {
    if (email) {
      setEmailValid(validateEmail(email));
    } else {
      setEmailValid(true); // Don't show error for empty email
    }
  }, [email]);

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(checkPasswordStrength(password));
  }, [password]);
  
  // Fetch password requirements from API when component mounts
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

    // Check for redirect URL in search params
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      setRedirectTo(decodeURIComponent(redirectUrl));
    }
  }, [searchParams]);
  
  // Update password checklist when password changes
  useEffect(() => {
    if (password) {
      const specialCharCheck = checkPasswordSpecialChars(password, passwordRequirements.allowedSpecialChars);
      setPasswordChecklist({
        length: password.length >= passwordRequirements.minLength,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        specialChar: specialCharCheck.hasRequiredSpecialChar,
        validSpecialChars: specialCharCheck.isValid
      });
    } else {
      setPasswordChecklist({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        specialChar: false,
        validSpecialChars: true
      });
    }
  }, [password, passwordRequirements]);

  async function registerUser(event) {
    event.preventDefault(); // avoid reloading from form
    setError("");
    
    // Validate email format
    if (!validateEmail(email)) {
      setError(ready ? t("auth:validation.emailInvalid") : "Please enter a valid email address");
      return;
    }
    
    // Check if password meets all requirements
    const { length, uppercase, lowercase, number, specialChar, validSpecialChars } = passwordChecklist;
    if (!length || !uppercase || !lowercase || !number || !specialChar || !validSpecialChars) {
      let specificError = "";
      
      // Check for invalid special characters
      if (!validSpecialChars) {
        const specialCharCheck = checkPasswordSpecialChars(password, passwordRequirements.allowedSpecialChars);
        specificError = ready ? 
          t("auth:register.passwordInvalidSpecialChars", { 
            invalidChars: specialCharCheck.invalidChars,
            allowedChars: passwordRequirements.allowedSpecialChars 
          }) :
          `Password contains invalid special characters: ${specialCharCheck.invalidChars}. Only these special characters are allowed: ${passwordRequirements.allowedSpecialChars}`;
      }
      // Check for missing special characters
      else if (!specialChar) {
        specificError = ready ? 
          t("auth:register.passwordMissingSpecialChars", { allowedChars: passwordRequirements.allowedSpecialChars }) :
          `Password must include at least one of these special characters: ${passwordRequirements.allowedSpecialChars}`;
      } 
      // General error message
      else {
        specificError = ready ? t("auth:register.passwordRequirementsNotMet") : "Password must meet all requirements listed below";
      }
      
      setError(specificError);
      return;
    }
    
    // Validate form using the existing validation function
    const { isValid, errorMessage } = validateForm(
      { name, email, password },
      {
        name: { required: true, errorMessage: ready ? t("auth:validation.nameRequired") : "Name is required" },
        email: { required: true, errorMessage: ready ? t("auth:validation.emailRequired") : "Email is required" },
        password: { 
          required: true, 
          errorMessage: ready ? t("auth:validation.passwordRequired") : "Password is required",
          pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, 
          patternErrorMessage: ready ? t("auth:validation.passwordPattern") : "Password must be at least 8 characters with uppercase, lowercase, number and special character"
        }
      }
    );
    
    if (!isValid) {
      setError(errorMessage);
      return;
    }
    
    try {
      // Check if user already exists
      try {
        const checkResponse = await api.post("/auth/check-user", { email });
        
        if (checkResponse.data.exists) {
          setError(ready ? t("auth:register.emailExists") : "An account with this email already exists. Please use a different email or login instead.");
          return;
        }
      } catch (checkError) {
        // If there's an error checking the user, we'll proceed with registration
        // as it's likely an API endpoint issue, not a user existence issue
        console.error("Error checking user existence:", checkError);
      }
      
      // Register the user
      const registerResponse = await api.post("/auth/register", {
        name,
        email,
        password,
        userType,
      });
      
      // Auto login after registration
      try {
        const loginResponse = await api.post("/auth/login", { email, password });
        setUser(loginResponse.data);
        
        // Show success notification
        notify(ready ? t("auth:register.successMessage") : "Registration successful! Welcome to your account.", "success");
        
        // Redirect to profile page
        setRedirect(true);
      } catch (loginError) {
        // If auto-login fails, still consider registration successful
        notify(ready ? t("auth:register.successButLoginFailed") : "Registration successful, but automatic login failed. Please log in manually.", "info");
        setRedirect(true);
      }
      
      // Clear the form
      setName("");
      setEmail("");
      setPassword("");
    } catch (e) {
      if (e.response?.data?.name === 'SequelizeUniqueConstraintError') {
        setError(ready ? t("auth:register.emailAlreadyRegistered") : "This email is already registered. Please use a different email or login instead.");
      } else {
        setError(e.response?.data?.error || (ready ? t("auth:register.generalError") : "Registration failed. Please try again later."));
      }
    }
  }

  if (redirect) {
    return <Navigate to={redirectTo} />;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
      <div className="w-full max-w-md lg:max-w-lg mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-0.5 sm:mb-1">
          {ready ? t("auth:register.title") : "Register"}
        </h1>
        
        <form className="bg-white p-3 sm:p-4 lg:p-5 rounded-xl shadow-sm" onSubmit={registerUser}>
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-x-4">
            <div className="mb-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-0.5">
                {ready ? t("auth:register.fullName") : "Full Name"}
              </label>
              <input
                id="name"
                type="text"
                placeholder={ready ? t("auth:register.fullNamePlaceholder") : "Jane Doe"}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div className="mb-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-0.5">
                {ready ? t("auth:register.email") : "Email"}
              </label>
              <input
                id="email"
                type="email"
                placeholder={ready ? t("auth:register.emailPlaceholder") : "your@email.com"}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`w-full px-3 py-1 border ${emailValid ? 'border-gray-300' : 'border-red-500'} rounded-md focus:outline-none focus:ring-2 ${emailValid ? 'focus:ring-primary' : 'focus:ring-red-500'}`}
                required
              />
              {!emailValid && email && (
                <p className="text-red-500 text-xs mt-1">
                  {ready ? t("auth:validation.emailInvalid") : "Please enter a valid email address"}
                </p>
              )}
            </div>
          </div>
          
          <div className="mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-0.5">
              {ready ? t("auth:register.password") : "Password"}
            </label>
            <input
              id="password"
              type="password"
              placeholder={ready ? t("auth:register.passwordPlaceholder") : "••••••••"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`w-full px-3 py-1 border ${
                password ? (
                  Object.values(passwordChecklist).every(v => v) ? 'border-green-500' : 'border-yellow-400'
                ) : 'border-gray-300'
              } rounded-md focus:outline-none focus:ring-2 focus:ring-primary`}
              required
            />
            {password && (
              <div className="mt-1">
                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      passwordStrength.score === 0 ? 'bg-red-500' : 
                      passwordStrength.score === 1 ? 'bg-red-400' : 
                      passwordStrength.score === 2 ? 'bg-yellow-400' : 
                      passwordStrength.score === 3 ? 'bg-yellow-300' : 
                      passwordStrength.score === 4 ? 'bg-green-400' : 
                      'bg-green-500'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                
                {/* Password Requirements Checklist */}
                <div className="mt-2 text-xs space-y-1">
                  <p className="font-medium mb-1">
                    {ready ? t("auth:register.passwordRequirements") : "Password requirements:"}
                  </p>
                  <div className={`flex items-start gap-1 ${passwordChecklist.length ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{passwordChecklist.length ? '✓' : '✗'}</span>
                    <span>
                      {ready ? 
                        t("auth:register.passwordRequirement.length", { minLength: passwordRequirements.minLength }) : 
                        `At least ${passwordRequirements.minLength} characters`
                      }
                    </span>
                  </div>
                  <div className={`flex items-start gap-1 ${passwordChecklist.lowercase ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{passwordChecklist.lowercase ? '✓' : '✗'}</span>
                    <span>
                      {ready ? t("auth:register.passwordRequirement.lowercase") : "At least one lowercase letter"}
                    </span>
                  </div>
                  <div className={`flex items-start gap-1 ${passwordChecklist.uppercase ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{passwordChecklist.uppercase ? '✓' : '✗'}</span>
                    <span>
                      {ready ? t("auth:register.passwordRequirement.uppercase") : "At least one uppercase letter"}
                    </span>
                  </div>
                  <div className={`flex items-start gap-1 ${passwordChecklist.number ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{passwordChecklist.number ? '✓' : '✗'}</span>
                    <span>
                      {ready ? t("auth:register.passwordRequirement.number") : "At least one number"}
                    </span>
                  </div>
                  <div className={`flex items-start gap-1 ${passwordChecklist.specialChar ? 'text-green-600' : 'text-red-500'}`}>
                    <span>{passwordChecklist.specialChar ? '✓' : '✗'}</span>
                    <span>
                      {ready ? 
                        t("auth:register.passwordRequirement.specialChar", { allowedChars: passwordRequirements.allowedSpecialChars }) :
                        `At least one special character from: `
                      }
                      {!ready && <span className="font-mono bg-gray-100 px-1 rounded">{passwordRequirements.allowedSpecialChars}</span>}
                    </span>
                  </div>
                  {!passwordChecklist.validSpecialChars && (
                    <div className="text-red-500 flex items-start gap-1">
                      <span>✗</span>
                      <span>
                        {ready ? 
                          t("auth:register.passwordRequirement.invalidSpecialChars", { allowedChars: passwordRequirements.allowedSpecialChars }) :
                          "Contains invalid special characters. Only these are allowed: "
                        }
                        {!ready && <span className="font-mono bg-gray-100 px-1 rounded">{passwordRequirements.allowedSpecialChars}</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-0.5">
              {ready ? t("auth:register.accountType") : "Account Type"}
            </label>
            
            <div className="grid grid-cols-2 gap-2">
              {/* Client Option */}
              <label 
                className={`flex items-center justify-center p-1.5 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50
                  ${userType === 'client' 
                    ? 'border-primary bg-red-100 bg-opacity-60' 
                    : 'border-gray-200'}`}
              >
                <input 
                  type="radio" 
                  name="userType" 
                  value="client" 
                  checked={userType === "client"}
                  onChange={(ev) => setUserType(ev.target.value)}
                  className="hidden" 
                />
                <div className="text-primary mr-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">
                    {ready ? t("auth:register.userType.client") : "Client"}
                  </span>
                  <span className="text-xs text-gray-500 hidden md:inline ml-1">
                    ({ready ? t("auth:register.userType.clientDescription") : "Book rooms"})
                  </span>
                </div>
                {userType === 'client' && (
                  <div className="ml-1 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
              
              {/* Host Option */}
              <label 
                className={`flex items-center justify-center p-1.5 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 relative
                  ${userType === 'host' 
                    ? 'border-primary bg-red-100 bg-opacity-60' 
                    : 'border-gray-200'}`}
              >
                <input 
                  type="radio" 
                  name="userType" 
                  value="host" 
                  checked={userType === "host"}
                  onChange={(ev) => setUserType(ev.target.value)}
                  className="hidden" 
                />
                <div className="text-primary mr-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <div>
                  <span className="font-medium text-sm">
                    {ready ? t("auth:register.userType.host") : "Host"}
                  </span>
                  <span className="text-xs text-gray-500 hidden md:inline ml-1">
                    ({ready ? t("auth:register.userType.hostDescription") : "Manage spaces"})
                  </span>
                </div>
                {userType === 'host' && (
                  <div className="ml-1 text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 sm:w-4 sm:h-4">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button className="bg-primary text-white py-1 px-4 rounded-md hover:bg-primary-dark transition-colors font-medium">
              {ready ? t("auth:register.registerButton") : "Register"}
            </button>
            
            <div className="text-gray-500 text-xs">
              {ready ? t("auth:register.alreadyHaveAccount") : "Already have an account?"}{" "}
              <Link className="text-primary font-medium hover:underline" to={"/login"}>
                {ready ? t("auth:register.loginLink") : "Login"}
              </Link>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-center text-gray-600 text-sm mb-3">
              {ready ? t("auth:register.orContinueWith") : "or continue with"}
            </p>
            <Link 
              to="/telegram-auth" 
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-[#0088cc] text-white rounded-md hover:bg-[#0077b5] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 240 240">
                <path fill="white" d="M66.964 134.874s-32.08-10.062-51.344-16.002c-17.542-6.693-1.57-14.928 6.015-17.59 7.585-2.66 186.38-71.948 194.94-75.233 8.94-4.147 19.884-.35 14.767 18.656-4.416 20.407-30.166 142.874-33.827 158.812-3.66 15.937-18.447 6.844-18.447 6.844l-83.21-61.442z" />
                <path fill="none" stroke="white" strokeWidth="8" d="M86.232 157.428c-12.023 12.024-22.92 6.417-22.92 6.417l-20.158-27.902 89.261-71.267c7.585-6.067 2.799-7.586 2.799-7.586s-4.447 1.519-9.383 6.455c-4.936 4.935-82.733 74.293-82.733 74.293" />
              </svg>
              {ready ? t("auth:register.telegramRegister") : "Register with Telegram"}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withTranslationLoading(RegisterPage, ["auth", "common"]);
