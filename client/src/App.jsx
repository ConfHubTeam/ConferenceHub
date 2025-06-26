import "./App.css";
import "./styles/touch-actions.css";
import "react-phone-number-input/style.css";
import { Route, Routes } from "react-router-dom";
import IndexPage from "./pages/IndexPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./components/Layout";
import AuthenticatedRoute from "./components/AuthenticatedRoute";
import { UserContextProvider } from "./components/UserContext";
import { NotificationProvider } from "./components/NotificationContext";
import { BookingNotificationProvider } from "./contexts/BookingNotificationContext";
import { CurrencyProvider } from "./contexts/CurrencyContext";
import PlacesPage from "./pages/PlacesPage";
import ProfilePage from "./pages/ProfilePage";
import PlacesFormPage from "./pages/PlacesFormPage";
import BookingsPage from "./pages/BookingsPage";
import PlaceDetailPage from "./pages/PlaceDetailPage";
import DashboardPage from "./pages/DashboardPage";
import UsersPage from "./pages/UsersPage";
import AllPlacesPage from "./pages/AllPlacesPage";
import HostBookingManagementPage from "./pages/HostBookingManagementPage";
import TelegramAuth from "./components/TelegramAuth";
import TelegramCallbackHandler from "./components/TelegramCallbackHandler";
import LoginSuccessPage from "./pages/LoginSuccessPage";
import { usePreventPageZoom } from "./hooks/useMapTouchHandler";
import { useEffect } from "react";
import { initIOSSafariFixes } from "./utils/iosUtils";

function App() {
  // Apply global page zoom prevention
  usePreventPageZoom();

  // Initialize iOS Safari fixes
  useEffect(() => {
    initIOSSafariFixes();
  }, []);

  return (
    <UserContextProvider>
      <CurrencyProvider>
        <NotificationProvider>
          <BookingNotificationProvider>
            <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<AuthenticatedRoute />} />
            <Route path="/landingpage" element={<LandingPage />} />
            <Route path="/places" element={<IndexPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/admin" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/telegram-auth" element={<TelegramAuth />} />
            <Route path="/telegram-callback" element={<TelegramCallbackHandler />} />
            <Route path="/login-success" element={<LoginSuccessPage />} />
            <Route path="/account" element={<ProfilePage />}/>
            <Route path="/account/user-places" element={<PlacesPage />}/>
            <Route path="/account/places/new" element={<PlacesFormPage />}/>
            <Route path="/account/places/:id" element={<PlacesFormPage />}/>
            <Route path="/place/:placeId" element={<PlaceDetailPage />}/>
            <Route path="/place/:placeId/:bookingId" element={<PlaceDetailPage />}/>
            <Route path="/account/bookings" element={<BookingsPage />}/>
            <Route path="/account/host-management" element={<HostBookingManagementPage />}/>
            
            {/* Agent-specific routes */}
            <Route path="/account/dashboard" element={<DashboardPage />}/>
            <Route path="/account/users" element={<UsersPage />}/>
            <Route path="/account/all-places" element={<AllPlacesPage />}/>
          </Route>
        </Routes>
        </BookingNotificationProvider>
      </NotificationProvider>
      </CurrencyProvider>
    </UserContextProvider>
  );
}

export default App;
