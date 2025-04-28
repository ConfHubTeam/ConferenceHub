import "./App.css";
import { Route, Routes } from "react-router-dom";
import IndexPage from "./pages/IndexPage.jsx";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Layout from "./components/Layout";
import { UserContextProvider } from "./components/UserContext";
import { NotificationProvider } from "./components/NotificationContext";
import PlacesPage from "./pages/PlacesPage";
import ProfilePage from "./pages/ProfilePage";
import PlacesFormPage from "./pages/PlacesFormPage";
import BookingsPage from "./pages/BookingsPage";
import PlaceDetailPage from "./pages/PlaceDetailPage";

function App() {

  return (
    <UserContextProvider>
      <NotificationProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<IndexPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/account" element={<ProfilePage />}/>
            <Route path="/account/user-places" element={<PlacesPage />}/>
            <Route path="/account/places/new" element={<PlacesFormPage />}/>
            <Route path="/account/places/:id" element={<PlacesFormPage />}/>
            <Route path="/place/:placeId" element={<PlaceDetailPage />}/>
            <Route path="/place/:placeId/:bookingId" element={<PlaceDetailPage />}/>
            <Route path="/account/bookings" element={<BookingsPage />}/>
          </Route>
        </Routes>
      </NotificationProvider>
    </UserContextProvider>
  );
}

export default App;
