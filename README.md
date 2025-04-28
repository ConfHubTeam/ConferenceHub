# ConferenceHub - PERN Stack

A full-stack ConferenceHub built with the PERN stack (PostgreSQL, Express, React, Node.js).

## Features

- User authentication (register, login, profile)
- Conference room/accommodation booking system
- Role-based access (host vs client users)
- Image uploads with Cloudinary
- Booking management for hosts and clients
- Responsive UI using Tailwind CSS

## Project Structure

```
conferencehub/
├── api/                # Backend Express server
│   ├── config/         # Configuration files (DB, Cloudinary)
│   ├── models/         # Sequelize models
│   ├── uploads/        # Local uploads directory (for development)
│   └── index.js        # Main server file
├── client/             # React frontend
│   ├── src/            # React source code
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── utils/      # Utility functions
│   └── vite.config.js  # Vite configuration
├── render.yaml         # Render deployment configuration
└── package.json        # Project dependencies and scripts
```

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-name>
   ```

2. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

3. Set up environment variables:
   ```bash
   # Copy the example env files
   cp api/.env.example api/.env
   cp client/.env.example client/.env
   ```

4. Configure your PostgreSQL database settings in `api/.env`

5. Configure your Cloudinary credentials in `api/.env`

6. Run the development servers:
   ```bash
   # Run backend and frontend concurrently
   npm run dev
   ```

## Deployment to Render.com

This project is configured for easy deployment on Render.com using the `render.yaml` file.

### Prerequisites

1. Create an account on [Render.com](https://render.com/)
2. Set up a [Cloudinary account](https://cloudinary.com/) for image hosting
3. Have your PostgreSQL database ready (Render provides this service)

### Deployment Steps

#### Option 1: Using the Deploy to Render Button

1. Fork/clone this repository to your GitHub account
2. Add the "Deploy to Render" button to your repository:
   ```markdown
   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
   ```
3. Click the button to start the deployment process

#### Option 2: Manual Deployment

1. Log in to your Render dashboard
2. Create a new "Blueprint" instance (Infrastructure as Code)
3. Connect your repository
4. Render will detect the `render.yaml` file and create the required services

### Required Environment Variables

Set the following environment variables in the Render dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string (provided by Render if using their database) |
| `JWT_SECRET` | Secret key for JWT authentication |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret |
| `NODE_ENV` | Set to "production" |
| `PORT` | Default port (typically set automatically by Render) |
| `FRONTEND_URL` | The URL of your deployed frontend (will be set automatically with the render.yaml) |

### Database Setup

1. Render will provision a PostgreSQL database based on the `render.yaml` configuration
2. The application will automatically create the required tables on first run using Sequelize

### After Deployment

1. Visit your deployed application using the URL provided by Render
2. Register a new user account
3. You may want to manually set some users as "host" users in the database to create listings

## Troubleshooting Deployment

### Common Issues

1. **Database Connection Errors**
   - Verify DATABASE_URL is correctly set
   - Check the database is properly provisioned

2. **Missing Environment Variables**
   - Ensure all required environment variables are set in Render dashboard
   - Check for any typos in variable names

3. **Build Failures**
   - Check the build logs in Render
   - Ensure all dependencies are properly listed in package.json

4. **White Screen/404 Errors**
   - Check that the frontend builds correctly
   - Verify API endpoints are accessible

### Support and Debugging

For deployment issues, check the service logs in the Render dashboard for detailed error messages and stack traces.

## License

MIT
