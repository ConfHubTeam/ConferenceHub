## Project Overview & Milestones  
This is a booking platform for conference rooms.  We deliver in 6 milestones (each ~2 weeks), each driven by one core epic:

### Milestone 1 (Weeks 1–2)  
**Title:** Core Data & Authentication Foundation  
**Epics & Stories:**  
1. **Database Schema & Migrations**  
   - Create `Users`, `Locales`, `Currencies` tables  
   - Seed master data for languages & currencies  
2. **Auth & User Management API**  
   - `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`  
   - `GET/PUT /api/users/me`  
3. **Role-Based Access Control**  
   - Middleware to enforce client/agent/owner roles  
   - Unit tests for auth flows  
**Dependencies:** None

---

### Milestone 2 (Weeks 3–4)  
**Title:** Room Management & Search  
**Epics & Stories:**  
1. **Rooms Table & API**  
   - Migrate `Rooms` with owner, location, pricing, duration  
   - `GET /api/rooms`, `GET /api/rooms/{id}`  
   - Owner CRUD: `POST/PUT/DELETE /api/owners/{ownerId}/rooms`  
2. **Search & Filters**  
   - `/api/search` combining text, tags, date/time  
   - `Tags` table + filter support  
3. **Frontend Skeleton**  
   - Basic React pages for listing & detail  
**Dependencies:** Auth, Locales/Currencies

---

### Milestone 3 (Weeks 5–6)  
**Title:** Booking Core & Availability  
**Epics & Stories:**  
1. **Availability Engine**  
   - `GET /api/rooms/{id}/availability?date=`  
   - Enforce bookings + cooldown via `Bookings` & `BlockedSlots`  
2. **Bookings API**  
   - `POST /api/bookings`, `GET/PUT /api/bookings/{id}`  
   - `POST /api/bookings/{id}/block`  
3. **Client Booking UI**  
   - Calendar grid (09:00–22:00) with color coding  
   - Booking form + cost calculation  
**Dependencies:** Rooms API, Auth

---

### Milestone 4 (Weeks 7–8)  
**Title:** Media, Reviews & Notifications  
**Epics & Stories:**  
1. **Media Uploads**  
   - `Media` table + link to Rooms  
   - `POST /api/rooms/{id}/media`, delete endpoint  
   - Gallery carousel component  
2. **Reviews & Ratings**  
   - `Reviews` table + moderation flag  
   - `POST/GET /api/rooms/{id}/reviews`  
3. **Notifications Framework**  
   - `Notifications` table + triggers  
   - `GET /api/notifications`, mark-read endpoint  
   - In-app toast / SMS stubs  
**Dependencies:** Rooms & Bookings, Auth

---

### Milestone 5 (Weeks 9–10)  
**Title:** Payments & Agent/Owner Dashboards  
**Epics & Stories:**  
1. **Octo Payment Integration**  
   - `Payments`, `PaymentSettings` tables  
   - `/payments/initialize`, `/payments/:id/status`, webhook, `/refund`  
   - Pay-Now flow + result pages  
2. **Agent Dashboard MVP**  
   - Sidebar + requests table + mini-calendar  
   - `/api/agents/{agentId}/stats` stub  
3. **Owner Dashboard MVP**  
   - Room list + schedule grid + controls  
   - Cooldown/Block UI  
**Dependencies:** Bookings, Notifications, Media

---

### Milestone 6 (Weeks 11–12)  
**Title:** Analytics, Localization & Polish  
**Epics & Stories:**  
1. **Statistics & Reporting**  
   - `Statistics` tables for bookings/revenue  
   - Enhanced `/api/agents/{agentId}/stats` with chart data  
   - React charts in dashboards  
2. **Localization & Currency Switcher**  
   - `/api/locales`, `/api/currencies`, `/api/exchange-rate`  
   - UI toggle & dynamic price rerender  
3. **Responsive Design & Accessibility**  
   - Mobile/tablet breakpoints, keyboard navigation  
   - Final accessibility audit & fixes  
4. **QA & Deployment**  
   - E2E & performance tests  
   - CI/CD pipeline, staging → production  
**Dependencies:** All previous functionality

---

## How to Work Against Milestones

When Copilot generates code, or documentation, it should:

1. **Scope to Current Sprint**  
   - Prefix suggestions with `(M#)` (e.g. `(M3: Booking Core & Availability)`)  
   - Omit features outside this milestone’s epics.

2. **Break Epics into Stories**  
   - Suggest user-story–style breakdowns (“As a … I can …”)  
   - Map each story to API endpoints, DB migrations, service logic, and UI components.

3. **Follow Project Conventions**  
   - Use existing folder structure:  
     ```
     src/
       controllers/
       routes/
       models/
       services/
       hooks/
       components/
       styles/
     ```  
   - Adhere to PERN, Look into copilot-instructions.md for best practices
4. **Respect Dependencies**  
   - Mention upstream requirements (e.g. “requires Auth from M1”)  

5. **Deliver Complete Units**  
   - For each story generate:  
     - SQL migration  
     - Express route & controller  
     - Service/helper logic  
     - React hook & component  
     - Unit/integration tests  
   - Include inline comments and update README or CHANGELOG.

6. **Keep It Incremental**  
   - Propose minimal viable implementations first, with TODOs for enhancements.  
   - Suggest follow-up tasks when edge-cases or optimizations are identified.
