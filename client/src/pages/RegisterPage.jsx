import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../utils/api";
import { useNotification } from "../components/NotificationContext";
import { validateForm } from "../utils/formUtils";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState("client");
  const [error, setError] = useState("");
  const { notify } = useNotification();

  async function registerUser(event) {
    event.preventDefault(); // avoid reloading from form
    setError("");
    
    // Validate form
    const { isValid, errorMessage } = validateForm(
      { name, email, password },
      {
        name: { required: true, errorMessage: "Name is required" },
        email: { required: true, errorMessage: "Email is required" },
        password: { 
          required: true, 
          errorMessage: "Password is required",
          pattern: /^.{6,}$/, 
          patternErrorMessage: "Password must be at least 6 characters long"
        }
      }
    );
    
    if (!isValid) {
      setError(errorMessage);
      return;
    }
    
    try {
      await api.post("/register", { // Using the configured api instance instead of axios directly
        name,
        email,
        password,
        userType,
      });
      notify("Registration successful, you can go to login.", "success");
      // Clear the form after successful registration
      setName("");
      setEmail("");
      setPassword("");
    } catch (e) {
      setError(e.response?.data?.error || "Registration failed. Please try again later.");
      notify("Registration failed. Please try again later.", "error");
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-0.5 sm:mb-1">Register</h1>
        <p className="text-center text-gray-500 text-xs sm:text-sm mb-2 sm:mb-3">Create your account</p>
        
        <form className="bg-white p-3 sm:p-4 lg:p-5 rounded-xl shadow-sm" onSubmit={registerUser}>
          {error && (
            <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          
          <div className="grid md:grid-cols-2 gap-x-4">
            <div className="mb-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-0.5">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Jane Doe"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            
            <div className="mb-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-0.5">Email</label>
              <input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>
          
          <div className="mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-0.5">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-0.5">Account Type</label>
            
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
                  <span className="font-medium text-sm">Client</span>
                  <span className="text-xs text-gray-500 hidden md:inline ml-1">(Book rooms)</span>
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
                  <span className="font-medium text-sm">Host</span>
                  <span className="text-xs text-gray-500 hidden md:inline ml-1">(Manage spaces)</span>
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
              Register
            </button>
            
            <div className="text-gray-500 text-xs">
              Already have an account?{" "}
              <Link className="text-primary font-medium hover:underline" to={"/login"}>
                Login
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
