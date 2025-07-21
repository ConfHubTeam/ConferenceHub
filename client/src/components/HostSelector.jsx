import { useState, useEffect, useRef } from "react";
import api from "../utils/api";

/**
 * HostSelector Component
 * 
 * Allows agents to select a host on whose behalf they want to create a place
 */
export default function HostSelector({ selectedHost, onHostSelect, compact = false }) {
  const [hosts, setHosts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef(null);

  // Fetch hosts on component mount
  useEffect(() => {
    const fetchHosts = async () => {
      setIsLoading(true);
      try {
        const response = await api.get("/users/all");
        if (response.data && response.data.length > 0) {
          // Filter only hosts
          const hostUsers = response.data.filter(user => user.userType === 'host');
          setHosts(hostUsers);
        }
      } catch (error) {
        console.error("Error fetching hosts:", error);
        setHosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHosts();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        // Navigation would be implemented here if needed
      }
    }
    
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (host) => {
    onHostSelect(host);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-full" ref={dropdownRef} id="host-selector">
      {/* Host selector button */}
      <div 
        className={`border rounded-xl p-3 cursor-pointer bg-white hover:border-gray-400 transition-colors ${
          isOpen ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'
        }`}
        onClick={toggleDropdown}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleDropdown();
          }
        }}
      >
        {selectedHost ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900">{selectedHost.name}</div>
                <div className="text-sm text-gray-500">{selectedHost.email}</div>
              </div>
            </div>
            <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" 
                   className="h-5 w-5" fill="none" 
                   viewBox="0 0 24 24" stroke="currentColor"
                   style={{ opacity: 0.7 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center text-gray-500">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <span>Select a host...</span>
            </div>
            <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" 
                   className="h-5 w-5" fill="none" 
                   viewBox="0 0 24 24" stroke="currentColor"
                   style={{ opacity: 0.7 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
        )}
      </div>
      
      {/* Dropdown options */}
      {isOpen && (
        <div 
          id="host-listbox"
          role="listbox"
          className={`absolute z-[65] mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto`}
          style={{ 
            borderRadius: "0.75rem"
          }}
        >
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Loading hosts...</div>
          ) : hosts.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No hosts found</div>
          ) : (
            hosts.map((host) => (
              <div
                key={host.id}
                role="option"
                aria-selected={selectedHost?.id === host.id}
                className={`p-3 hover:bg-gray-100 cursor-pointer flex items-center ${
                  selectedHost && selectedHost.id === host.id ? 'bg-blue-50 font-medium' : ''
                }`}
                onClick={() => handleSelect(host)}
              >
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-green-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{host.name}</div>
                  <div className="text-sm text-gray-500 truncate">{host.email}</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
