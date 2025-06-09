We use the PERN stack: PostgreSQL for data storage, Express.js for the REST API, React with functional components for the UI, and Node.js as the runtime environment.  
All database migrations use snake_case naming and node-pg-migrate for schema changes.  
Our API follows REST conventions under /api with endpoints such as /api/rooms, /api/bookings, and /api/users, returning standard HTTP status codes.  
Authentication is JWT-based with role-based access control; include JWT handling and token validation in code samples.  
React code uses CommonJS JSX with hooks, Context API, and React Query for fetching server state.  
We style components using Tailwind CSS and follow a mobile-first responsive design approach.  
JavaScript code must adhere to the Airbnb style guide with ESLint + Prettier integration.  
Use double quotes for strings, 2-space indentation, and always include semicolons in JS code.  
Include unit tests using Jest for backend logic and React Testing Library for UI components.  
When suggesting new files, include proper folder structure: src/controllers, src/routes, src/models, src/hooks, src/components, and src/styles.  

## React Best Practices  
- Organize React code with a feature-based folder structure to maximize scalability and reuse :contentReference[oaicite:0]{index=0}.  
- Prefer function components with Hooks (useState, useEffect, custom hooks) for cleaner code and easier side-effect management :contentReference[oaicite:1]{index=1}.  
- Implement a predictable state-management strategy (e.g., React Query or Redux Toolkit) for server and client state consistency :contentReference[oaicite:2]{index=2}.  
- Use proper JSX practices and PropTypes for component props validation to catch errors during development :contentReference[oaicite:3]{index=3}.  
- Integrate comprehensive testing: unit tests with Jest and integration/UI tests with React Testing Library :contentReference[oaicite:4]{index=4}.  
- Leverage modern build tools (Vite, Bun) for faster development builds and hot module replacement :contentReference[oaicite:5]{index=5}.  

## Full-Stack Best Practices  
- Enforce secure authentication/authorization using JWT, OAuth2, and role-based access controls :contentReference[oaicite:6]{index=6}.  
- Validate and sanitize all incoming data on both client and server to prevent SQL injection, XSS, and other attacks :contentReference[oaicite:7]{index=7}.  
- Always run over HTTPS, apply security headers via Helmet.js, and store secrets/config in environment variables :contentReference[oaicite:8]{index=8}.  
- Containerize development and production environments with Docker, and set up CI/CD pipelines for automated testing and deployment :contentReference[oaicite:9]{index=9}.  
- Choose the right communication protocol—REST for standard CRUD, gRPC for high-performance RPC, WebSockets for real-time updates—based on use case :contentReference[oaicite:10]{index=10}.  
- Adopt application-wide state management patterns (caching, optimistic updates, server-side state) for consistency and scalability :contentReference[oaicite:11]{index=11}.  

## PostgreSQL Best Practices  
- Monitor and log key database metrics (query execution times, resource usage, errors) continuously to detect and resolve performance bottlenecks early :contentReference[oaicite:0]{index=0}.  
- Enforce strong authentication, use SSL/TLS for data-in-transit encryption, and apply Role-Based Access Control (RBAC) and Row-Level Security (RLS) to minimize attack surface :contentReference[oaicite:1]{index=1}.  
- Adopt consistent naming conventions (snake_case for tables/columns, clear constraint/index names) to improve readability and tooling support :contentReference[oaicite:2]{index=2}.  
- Optimize queries with proper indexing strategies, avoiding index bloat and ensuring regular ANALYZE/VACUUM cycles to maintain planner statistics :contentReference[oaicite:3]{index=3}.  
- Implement automated backups with point-in-time recovery (PITR) and regularly test restore procedures to guarantee data durability :contentReference[oaicite:4]{index=4}.  

## React Best Practices  
- Always benchmark and deploy using the minified production build to remove development-only warnings and reduce bundle size :contentReference[oaicite:5]{index=5}.  
- Follow a feature-based folder structure (e.g., src/components/Booking, src/hooks/useBooking) to enhance modularity and scalability :contentReference[oaicite:6]{index=6}.  
- Avoid unnecessary re-renders by using React.memo, useCallback, and useMemo where appropriate, and profile components with React DevTools :contentReference[oaicite:7]{index=7}.  
- Leverage React Query or Redux Toolkit for efficient server-state caching, background refetching, and optimistic updates :contentReference[oaicite:8]{index=8}.  
- Minimize costly DOM operations by batching state updates and virtualizing long lists (e.g., react-window) to maintain UI responsiveness :contentReference[oaicite:9]{index=9}.  

## Express.js Best Practices  
- Always run Express behind HTTPS, use Helmet to set secure HTTP headers, and avoid deprecated/vulnerable middleware versions :contentReference[oaicite:10]{index=10}.  
- Sanitize and validate all incoming request data using libraries like express-validator to prevent SQL injection and XSS attacks :contentReference[oaicite:11]{index=11}.  
- Implement rate limiting (e.g., express-rate-limit) and request throttling to mitigate brute-force and DDoS attacks :contentReference[oaicite:12]{index=12}.  
- Use gzip/deflate compression on responses, offload static assets to a CDN, and avoid synchronous filesystem or crypto operations in request handlers :contentReference[oaicite:13]{index=13}.  
- Centralize error handling with custom middleware to log errors, send consistent responses, and avoid leaking stack traces to clients :contentReference[oaicite:14]{index=14}.  

## Node.js Best Practices  
- Use the built-in Error class (or extend it) to create meaningful, operational error objects with HTTP status codes and stack traces :contentReference[oaicite:15]{index=15}.  
- Handle asynchronous errors in Promises and async/await with try/catch blocks, and avoid unhandled promise rejections by adding a global rejection handler :contentReference[oaicite:16]{index=16}.  
- Leverage clustering (Cluster module) or process managers (PM2) to take advantage of multiple CPU cores and ensure zero-downtime restarts :contentReference[oaicite:17]{index=17}.  
- Regularly audit and update dependencies, and follow OWASP Top Ten guidelines to protect against common vulnerabilities in npm packages :contentReference[oaicite:18]{index=18}.  
- Implement graceful shutdown logic (close server, drain connections, cleanup resources) to maintain stability during deployments and crashes :contentReference[oaicite:19]{index=19}.  


