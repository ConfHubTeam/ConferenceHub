## Database

1. **User Accounts**  
   As the system, I need a **Users** table capturing clients, agents, and owners with fields for name, email, phone, password hash, role, company (for owners), and status, so that all three user types can authenticate and manage their profiles.

2. **Rooms**  
   As the system, I need a **Rooms** table with fields for room ID, owner ID, name, description, capacity, type, price per hour, minimum/maximum booking duration, location (city, coordinates), and language/currency settings, so that rooms can be listed, searched, and managed.

3. **Media Assets**  
   As the system, I need a **Media** table linking photos (up to 10), videos (standard and 360°) to rooms, storing file URLs, formats, sizes, and upload timestamps, so that room galleries can be displayed.

4. **Bookings & Cooldown**  
   As the system, I need a **Bookings** table recording client ID, room ID, date, start/end times, status (pending/confirmed/rejected/cancelled), and applied cooldown before/after, so that availability and cooldowns are enforced.

5. **Blocked Slots**  
   As the system, I need a **BlockedSlots** table for owner‑initiated blocks (date, start/end, reason), so that unavailable periods show correctly on calendars.

6. **Payments & Refunds**  
   As the system, I need a **Payments** table tracking booking ID, amount, currency, payment method (bank, Click, Payme), status, transaction ID, and refund records, so that financial flows and refunds can be audited.

7. **Notifications**  
   As the system, I need a **Notifications** table (user ID, type, medium, message, read status, timestamp), so that in‑app or SMS notifications to clients, owners, and agents are stored and tracked.

8. **Reviews & Ratings**  
   As the system, I need a **Reviews** table (client ID, room ID, rating, comment, timestamp, moderated status), so that post‑booking feedback is collected and average ratings computed.

9. **Localization & Currency**  
   As the system, I need **Locales** and **Currencies** tables to store supported languages (RU, UZ, EN) and currencies (UZS, RUB, USD, EUR) with conversion rates, so that the platform can render in different languages and convert prices.

10. **Filters & Recommendations**  
    As the system, I need **Tags** (equipment, services) and **Recommendations** tables (room ID, related room IDs, algorithm metadata), so that users can filter by features and see similar or nearby rooms.

11. **Statistics**  
    As the system, I need **Statistics** tables (aggregated bookings, revenues per owner/room/status by period), so the agent panel can display analytics without heavy live queries.

---

## API

1. **User Registration & Authentication**  
   - **POST** `/api/auth/register` for clients, agents, and owners  
   - **POST** `/api/auth/login` & **POST** `/api/auth/logout`  
   - **GET** `/api/users/me` & **PUT** `/api/users/me` for profile and password updates

2. **Room Management**  
   - **GET** `/api/rooms` with filters (date, time, type, price, location, tags)  
   - **GET** `/api/rooms/{id}` for details (description, capacity, media, map coords)  
   - **POST/PUT/DELETE** `/api/owners/{ownerId}/rooms` for adding/editing/deleting rooms

3. **Media Uploads**  
   - **POST** `/api/rooms/{id}/media/photos` (up to 10)  
   - **POST** `/api/rooms/{id}/media/videos` (standard + 360°)  
   - **DELETE** `/api/media/{mediaId}`

4. **Availability & Booking**  
   - **GET** `/api/rooms/{id}/availability?date=YYYY-MM-DD`  
   - **POST** `/api/bookings` to create a booking request  
   - **GET/PUT** `/api/bookings/{id}` for status updates (confirm/reject/cancel)  
   - **POST** `/api/bookings/{id}/block` for owner‑initiated blocking

5. **Cooldown Configuration**  
   - **GET/PUT** `/api/owners/{ownerId}/cooldown` to view/set before/after durations  
   - Automatically applied once a booking is confirmed

6. **Payment Processing**  
   - **POST** `/api/payments` to initiate payment  
   - **GET** `/api/payments/{id}/status` (webhook endpoints for bank, Click, Payme)  
   - **POST** `/api/payments/{id}/refund` for cancellations

7. **Notifications**  
   - **GET** `/api/notifications` & **PUT** `/api/notifications/{id}/read`  
   - Triggered on booking events and payment status changes

8. **Reviews & Ratings**  
   - **POST** `/api/rooms/{id}/reviews` (rating 1–5, comment, requires completed booking)  
   - **GET** `/api/rooms/{id}/reviews` with moderation flags

9. **Filters & Search**  
   - **GET** `/api/search` combining text, date/time availability, tags, price range, location radius  
   - **GET** `/api/rooms/{id}/recommendations` for similar/nearby rooms

10. **Statistics & Reporting**  
    - **GET** `/api/agents/{agentId}/stats` (bookings, revenues by owner/room/status)

11. **Localization & Currency**  
    - **GET** `/api/locales` & **GET** `/api/currencies`  
    - **GET** `/api/exchange-rate?from=&to=` for real‑time conversion

12. **Support & FAQ**  
    - **POST** `/api/support/tickets` & **GET** `/api/support/tickets/{id}`  
    - **GET** `/api/faq` for static FAQ entries

13. **Coworking Bookings**  
    - **GET** `/api/coworking/availability?date=&duration=`  
    - **POST** `/api/coworking/bookings` for daily/weekly/monthly seats

---

## UI/UX

### Client

1. **Home / Search**  
   As a client, I want a search bar (date picker, hall type, city) on the landing page so I can quickly find available rooms.

2. **Room Listings**  
   As a client, I want to see room cards (photo, name, owner, price/hour, rating) in a 3–4‑column grid, with busy slots in red and free in green.

3. **Booking Calendar**  
   As a client, I want an hourly grid (09:00–22:00) with color‑coding (green=free, red=booked, gray=cooldown) and range selection highlighting, so I can choose my slot.

4. **Booking Form**  
   As a client, I want a form showing selected hours, cost calculation, name/phone fields, and a “I agree to terms” checkbox before submitting my request.

5. **Payment Flow**  
   As a client, I want to be redirected to a payment screen after confirmation, see status (success/fail), and receive in‑app/SMS notifications.

6. **Dashboard / My Bookings**  
   As a client, I want a personal cabinet with a table of my booking history (date, hours, hall, status) and editable profile fields.

7. **Reviews**  
   As a client, I want to leave a 1–5‑star review with comments after my event and see average ratings on room pages.

8. **Localization Toggle**  
   As a client, I want a language switcher (RU/UZ/EN) and currency selector in the header.

### Agent

9. **Agent Dashboard**  
   As an agent, I want a sidebar (“Requests”, “Owners”, “Rooms”, “Statistics”) and header with “Logout” to navigate.

10. **Requests Table & Mini‑Calendar**  
    As an agent, I want a table of all bookings (date, hours, client, room, owner, status) with filters, plus a mini calendar color‑coded by status.

11. **Owners Section**  
    As an agent, I want a table of owners (name, #rooms, #requests) and the ability to drill into each owner’s room list and calendar.

12. **Statistics View**  
    As an agent, I want graphs of confirmed vs. rejected requests and revenue summaries, with filters by owner/room.

### Owner

13. **Owner Dashboard**  
    As an owner, I want a sidebar listing my rooms and a header with “Logout” to switch contexts.

14. **Room Schedule**  
    As an owner, I want a full‑width hourly grid per room (green=free, yellow=pending, red=booked/blocked, gray=cooldown) and buttons under each request to confirm or reject (with reason).

15. **Cooldown & Blocking Controls**  
    As an owner, I want dropdowns to set cooldown before/after and a “Block hours” tool to manually mark slots unavailable.

16. **Room Management**  
    As an owner, I want forms to add/edit room details (name, price, min/max duration, description, tags), upload photos/videos, set map location, and save.

### Global / Technical

17. **Responsive Design**  
    As any user, I want the UI to adapt to desktop, tablet, and mobile screens (including a dedicated mobile app in Stage 3).

18. **Styling & Accessibility**  
    As any user, I want a clean minimalist look (Roboto/Open Sans 14–16 px), consistent color scheme (green/red/gray/white), keyboard navigation, and clear focus indicators.

19. **Animations & Feedback**  
    As any user, I want subtle animations (blue outline on selection, loading spinners) and immediate visual feedback on interactions.

20. **Map & Recommendations**  
    As any user, I want embedded maps on room pages and “Recommended” carousels showing similar or nearby halls.
