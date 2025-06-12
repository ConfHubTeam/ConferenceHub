import React from "react";

/**
 * UserRoleNotification Component
 * 
 * Shows appropriate notifications based on user role
 */
export default function UserRoleNotification({ isOwner, isAgent, isHost }) {
  // Return appropriate notification based on user role
  if (isOwner) {
    return (
      <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-green-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.563.563 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          <p className="text-green-800 font-medium">You own this conference room</p>
        </div>
        <p className="text-green-700 text-sm mt-1">You can view the calendar to see availability, but booking is for clients only.</p>
      </div>
    );
  }
  
  if (isAgent) {
    return (
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-blue-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-blue-800 font-medium">Agent View</p>
        </div>
        <p className="text-blue-700 text-sm mt-1">You can view the calendar to see availability, but booking is for clients only.</p>
      </div>
    );
  }
  
  if (isHost) {
    return (
      <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-purple-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <p className="text-purple-800 font-medium">Host View</p>
        </div>
        <p className="text-purple-700 text-sm mt-1">You can view the calendar to see availability, but booking is for clients only.</p>
      </div>
    );
  }
  
  return null;
}
