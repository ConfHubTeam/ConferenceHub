import { Link, useLocation } from "react-router-dom";
import DateDuration from "./DateDuration";
import { useContext } from "react";
import { UserContext } from "./UserContext";
import CloudinaryImage from "./CloudinaryImage";
import { useTranslation } from "react-i18next";

export default function List(props) {
  const { pathname } = useLocation();
  const { user } = useContext(UserContext);
  const { t } = useTranslation("places");
  let subpage = pathname.split("/")?.[2];
  const isHostViewingOwnRooms = user?.userType === 'host' && subpage === "user-places";

  return (
    <div className="mt-4 px-4 md:px-8 lg:px-14">
      {/* Create a grid for desktop view when host is viewing own rooms */}
      <div className={isHostViewingOwnRooms ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}>
        {props.places.length > 0 &&
          props.places.map((place) => (
            <div 
              key={place.id || place._id} 
              className="py-4 px-4 sm:px-5 m-2 mt-4 bg-gray-100 rounded-2xl"
            >
              {/* For mobile and desktop layouts */}
              <div className={`${isHostViewingOwnRooms ? 'flex flex-col sm:flex-row sm:gap-4' : 'flex gap-4'}`}>
                {/* Room title - at top for mobile, side by side with image on desktop */}
                <div className={`${isHostViewingOwnRooms ? 'order-1 sm:hidden mb-3' : 'hidden'}`}>
                  <Link 
                    to={`/place/${place.id || place._id}`}
                    className="block"
                  >
                    <h2 className="text-xl font-medium">{place.title?.substring(0, 50)}</h2>
                  </Link>
                </div>
                
                {/* Room image with link - full width on mobile */}
                <Link 
                  to={
                    isHostViewingOwnRooms
                      ? `/place/${place.id || place._id}`
                      : props.booking
                        ? `/place/${place.id || place._id}/${props.booking.id || props.booking._id}`
                        : `/place/${place.id || place._id}`
                  }
                  className={`${isHostViewingOwnRooms ? 'order-2 w-full h-48 sm:w-32 sm:h-32 block' : 'flex w-32 h-32'} bg-gray-200 rounded-lg overflow-hidden`}
                >
                  {place.photos?.length > 0 && (
                    <CloudinaryImage
                      photo={place.photos[0]}
                      alt={place.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </Link>
                
                {/* Room details */}
                <div className={`${isHostViewingOwnRooms ? 'order-3 mt-3 sm:mt-0' : ''} grow`}>
                  {/* Title - hidden on mobile, visible on desktop for host view */}
                  {isHostViewingOwnRooms && (
                    <Link 
                      to={`/place/${place.id || place._id}`}
                      className="hidden sm:block"
                    >
                      <h2 className="text-xl -mt-1">{place.title?.substring(0, 50)}</h2>
                    </Link>
                  )}
                  
                  {!isHostViewingOwnRooms && (
                    <Link 
                      to={
                        props.booking
                          ? `/place/${place.id || place._id}/${props.booking.id || props.booking._id}`
                          : `/place/${place.id || place._id}`
                      }
                    >
                      <h2 className="text-xl -mt-1">{place.title?.substring(0, 50)}</h2>
                    </Link>
                  )}

                  {/* Address */}
                  <Link 
                    to={
                      isHostViewingOwnRooms
                        ? `/place/${place.id || place._id}`
                        : props.booking
                          ? `/place/${place.id || props.booking._id}/${props.booking.id || props.booking._id}`
                          : `/place/${place.id || place._id}`
                    }
                  >
                    <p className="flex items-center mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-5 h-5 mr-1 flex-shrink-0"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                        />
                      </svg>
                      <span className="line-clamp-1">{place.address?.substring(0, 50)}</span>
                    </p>
                  </Link>

                  <div className={subpage === "bookings" ? "mt-7" : "mt-3"}>
                    {props.checkInDate && props.checkOutDate && (
                      <DateDuration
                        checkInDate={props.checkInDate}
                        checkOutDate={props.checkOutDate}
                      />
                    )}

                    {/* Check-in and Check-out times side by side evenly */}
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <p className="flex items-center text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 mr-1 flex-shrink-0"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
                          />
                        </svg>
                        <span className="truncate">{t("list.check_in")}: {place.checkIn}</span>
                      </p>
                      <p className="flex items-center text-sm">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4 mr-1 flex-shrink-0"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="truncate">{t("list.check_out")}: {place.checkOut}</span>
                      </p>
                    </div>
                    
                    {props.totalPrice && (
                      <div className="flex gap-1 items-center mt-2">
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
                            d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"
                          />
                        </svg>
                        {t("list.total_price")}: ${props.totalPrice}
                      </div>
                    )}
                  </div>
                  
                  {/* Management buttons for hosts - side by side with equal width */}
                  {isHostViewingOwnRooms && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <Link 
                        to={`/account/places/${place.id || place._id}`}
                        className="bg-green-500 text-white py-2 px-3 rounded-lg text-center text-sm hover:bg-green-600"
                      >
                        {t("list.actions.edit")}
                      </Link>
                      <Link 
                        to={`/place/${place.id || place._id}`}
                        className="bg-blue-500 text-white py-2 px-3 rounded-lg text-center text-sm hover:bg-blue-600"
                      >
                        {t("list.actions.view_details")}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
