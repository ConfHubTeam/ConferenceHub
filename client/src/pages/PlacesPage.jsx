import { Link, Navigate, useParams } from "react-router-dom";
import { useContext, useEffect, useState } from "react";
import AccountNav from "../components/AccountNav";
import api from "../utils/api";
import List from "../components/List";
import { UserContext } from "../components/UserContext";

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);
  const { user } = useContext(UserContext);
  
  useEffect(() => {
    api.get("/places/user-places").then(({ data }) => {
      setPlaces(data);
    });
  }, []);

  if (user && user.userType !== 'host') {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <AccountNav />
      <div className="text-center">
        {user && user.userType === 'host' && (
          <Link
            // inline-flex: put elements inline and shrink the button to fit the text
            className="inline-flex gap-1 bg-primary text-white py-2 px-4 rounded-full"
            to={"/account/places/new"}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add new conference room
          </Link>
        )}
      </div>
      <List places={places} bookings={[]}/>
    </div>
  );
}
