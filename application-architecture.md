# ConferenceHub - Application Architecture

## Project Overview

ConferenceHub is a comprehensive platform designed to streamline the process of booking and managing conference spaces. Similar to how Airbnb revolutionized accommodation rentals, ConferenceHub focuses specifically on meeting and conference room bookings for business purposes. The application connects space hosts with clients needing professional meeting environments. Hosts can list their conference rooms with detailed information, while clients can easily search, view, and book these spaces based on their requirements. The platform handles the entire booking process, from discovery to confirmation, and includes a review and approval system for hosts to manage incoming booking requests.

This document provides a comprehensive overview of the ConferenceHub application architecture, including how data flows through the system and the relationships between different components.

## High-Level System Overview

```mermaid
graph TB
    Client[Client Browser] --> Frontend[Frontend - React]
    Frontend --> Backend[Backend - Express]
    Backend --> Database[(Database - PostgreSQL)]
    Backend --> ExternalServices[External Services]
    
    classDef primaryComponent fill:#f0f8ff,stroke:#333,stroke-width:2px,color:#000000;
    classDef secondaryComponent fill:#e6f7ff,stroke:#333,stroke-width:1px,color:#000000;
    
    class Frontend,Backend primaryComponent;
    class Database,ExternalServices,Client secondaryComponent;
```

## Frontend Architecture

```mermaid
graph TB
    subgraph "Frontend (React)"
        direction TB
        ReactApp[React Application]
        
        subgraph "Pages"
            IndexPage[Home/Search Page]
            LoginPage[Login Page]
            RegisterPage[Register Page]
            ProfilePage[User Profile]
            BookingsPage[Bookings Management]
            PlacesPage[Conference Rooms]
            PlaceDetailPage[Room Details]
            PlacesFormPage[Room Form]
        end
        
        subgraph "Components"
            Header[Header/Navigation]
            UserContext[User Context]
            NotificationContext[Notifications]
            BookingWidget[Booking Widget]
            PhotoUploader[Photo Uploader]
            AccountNav[Account Navigation]
            List[Room Listings]
            BookingCard[Booking Card]
        end
        
        subgraph "Utilities"
            ApiUtil[API Utility]
            FormUtils[Form Utilities]
            CloudinaryUtil[Cloudinary Utils]
        end
        
        ReactApp --> Pages
        ReactApp --> Components
        Components --> Utilities
    end
    
    classDef primary fill:#f0e6ff,stroke:#333,stroke-width:2px,color:#000000;
    classDef secondary fill:#e6e6ff,stroke:#333,stroke-width:1px,color:#000000;
    classDef utility fill:#e6ffe6,stroke:#333,stroke-width:1px,color:#000000;
    
    class ReactApp primary;
    class Pages,Components secondary;
    class Utilities utility;
```

## Backend Architecture

```mermaid
graph TB
    ExpressServer[Express Server]
    
    subgraph API[API Endpoints]
        AuthAPI[Authentication API]
        PlacesAPI[Places API]
        BookingsAPI[Bookings API]
        UploadAPI[Upload API]
    end
    
    subgraph MW[Middleware]
        JWT[JWT Authentication]
        CORS[CORS Handler]
        ErrorHandling[Error Handling]
    end
    
    ExpressServer --> API
    ExpressServer --> MW
    
    classDef primary fill:#f0e6ff,stroke:#333,stroke-width:2px,color:#000000;
    classDef secondary fill:#e6e6ff,stroke:#333,stroke-width:1px,color:#000000;
    
    class ExpressServer primary;
    class API,MW secondary;
```

## Database Models

```mermaid
graph TB
    subgraph "Database (PostgreSQL)"
        direction TB
        PostgreSQL[(PostgreSQL Database)]
        
        UsersModel[Users]
        PlacesModel[Places]
        BookingsModel[Bookings]
        
        PostgreSQL --> UsersModel
        PostgreSQL --> PlacesModel
        PostgreSQL --> BookingsModel
        
        %% Relationships between models
        UsersModel -- "has many" --> PlacesModel
        UsersModel -- "has many" --> BookingsModel
        PlacesModel -- "has many" --> BookingsModel
    end
    
    classDef dbNode fill:#e6f5f5,stroke:#333,stroke-width:1px,color:#000000;
    classDef modelNode fill:#f0f9f9,stroke:#333,stroke-width:1px,color:#000000;
    
    class PostgreSQL dbNode;
    class UsersModel,PlacesModel,BookingsModel modelNode;
```

## Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant LoginPage
    participant ApiUtil
    participant AuthAPI
    participant Database
    participant UserContext
    
    User->>LoginPage: Enter credentials
    LoginPage->>ApiUtil: Submit login request
    ApiUtil->>AuthAPI: POST /login
    AuthAPI->>Database: Verify credentials
    Database-->>AuthAPI: Return user data
    AuthAPI-->>ApiUtil: JWT token + user data
    ApiUtil-->>LoginPage: Login result
    LoginPage->>UserContext: Update authenticated user
    UserContext-->>User: Show authenticated state
```

## Room Listing Process

```mermaid
sequenceDiagram
    actor Host
    participant PlacesFormPage
    participant PhotoUploader
    participant Cloudinary
    participant ApiUtil
    participant PlacesAPI
    participant Database
    
    Host->>PlacesFormPage: Add room details
    Host->>PhotoUploader: Upload images
    PhotoUploader->>Cloudinary: Upload images
    Cloudinary-->>PhotoUploader: Return image URLs
    Host->>PlacesFormPage: Submit form
    PlacesFormPage->>ApiUtil: Submit room data
    ApiUtil->>PlacesAPI: POST /places
    PlacesAPI->>Database: Store room data
    Database-->>PlacesAPI: Confirmation
    PlacesAPI-->>ApiUtil: Success response
    ApiUtil-->>PlacesFormPage: Display success
    PlacesFormPage-->>Host: Redirect to rooms list
```

## Booking Process

```mermaid
sequenceDiagram
    actor Client
    participant PlaceDetailPage
    participant BookingWidget
    participant ApiUtil
    participant BookingsAPI
    participant Database
    participant Host
    
    Client->>PlaceDetailPage: View room details
    Client->>BookingWidget: Enter booking details
    BookingWidget->>ApiUtil: Submit booking request
    ApiUtil->>BookingsAPI: POST /bookings
    BookingsAPI->>Database: Store booking (pending)
    Database-->>BookingsAPI: Confirmation
    BookingsAPI-->>ApiUtil: Success response
    ApiUtil-->>BookingWidget: Display success
    BookingWidget-->>Client: Redirect to bookings
    
    Host->>BookingsAPI: GET /bookings
    BookingsAPI->>Database: Fetch pending bookings
    Database-->>BookingsAPI: Return bookings
    BookingsAPI-->>Host: Display pending bookings
    Host->>BookingsAPI: PUT /bookings/:id (approve/reject)
    BookingsAPI->>Database: Update booking status
    Database-->>BookingsAPI: Confirmation
    BookingsAPI-->>Host: Display updated status
```

## Component Explanations

### Frontend (Client-Side)

#### Pages
- **IndexPage**: Main landing page displaying available conference rooms with search functionality
- **LoginPage/RegisterPage**: User authentication pages for clients and hosts
- **ProfilePage**: User profile management
- **BookingsPage**: For clients to see their bookings and for hosts to approve/reject booking requests
- **PlacesPage**: For hosts to manage their conference rooms
- **PlaceDetailPage**: Detailed view of a conference room with booking capability
- **PlacesFormPage**: Form for hosts to create/edit conference room listings

#### Components
- **Header**: Navigation bar with search functionality
- **UserContext**: React context for global user state management
- **NotificationContext**: Handles system notifications and alerts
- **BookingWidget**: Booking form for clients to reserve rooms
- **PhotoUploader**: Component for uploading and managing room images
- **AccountNav**: Navigation for account-related pages
- **List**: Reusable component for displaying room listings
- **BookingCard**: Display booking details with actions (approve/reject/cancel)

#### Utilities
- **ApiUtil**: Centralized API request handling with Axios
- **FormUtils**: Form validation and processing utilities
- **CloudinaryUtil**: Helper functions for Cloudinary image operations

### Backend (Server-Side)

#### API Endpoints
- **AuthAPI**: Handles user registration, login, and authentication
- **PlacesAPI**: Manages conference room listings (CRUD operations)
- **BookingsAPI**: Manages booking requests and status updates
- **UploadAPI**: Handles file uploads to Cloudinary

#### Middleware
- **JWT Authentication**: Verifies user identity with JSON Web Tokens
- **CORS Handler**: Manages cross-origin requests
- **Error Handling**: Standardized error responses

### Database (PostgreSQL)

#### Models
- **Users**: Stores user information with role-based access (host vs client)
- **Places**: Stores conference room details (title, address, photos, description, amenities, etc.)
- **Bookings**: Records booking requests with status tracking (pending, approved, rejected)

### External Services
- **Cloudinary**: Cloud-based image storage and delivery

## Role-Based Functionality

### Client Users
- Browse and search conference rooms
- View room details with photos and amenities
- Make booking requests
- Manage their bookings (view status, cancel)
- Update profile information

### Host Users
- All client capabilities
- Create and manage conference room listings
- Upload photos for their rooms
- Review and respond to booking requests
- View booking calendar and manage availability

## Technical Implementation Details

- **Frontend**: Built with React and Vite for fast development
- **Styling**: Tailwind CSS for responsive, mobile-first design
- **State Management**: React Context API for global state
- **API Communication**: Axios for HTTP requests
- **Backend**: Express.js RESTful API
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT-based authentication with HTTP-only cookies
- **Image Handling**: Cloudinary integration for cloud storage
- **Deployment**: Configured for Render.com using render.yaml