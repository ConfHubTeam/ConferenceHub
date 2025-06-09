# Render Deployment Instructions

## Updated render.yaml Configuration

The `render.yaml` file has been updated to use the current Render Blueprint specification:

### Key Changes Made:
1. **Runtime Field**: Changed from deprecated `env: node` to `runtime: node`
2. **Environment Variables**: Updated CORS-related environment variables to use manual configuration
3. **Health Check**: Added `healthCheckPath: /api/health` for better deployment monitoring
4. **Build Command**: Enhanced with additional verification steps

## Manual Environment Variable Setup Required

After deploying, you need to set these environment variables manually in the Render Dashboard:

### 1. FRONTEND_URL
- **Value**: Your Render app URL (e.g., `https://your-app-name.onrender.com`)
- **Description**: Base URL for the frontend application

### 2. CORS_ALLOWED_ORIGINS  
- **Value**: Your Render app URL (e.g., `https://your-app-name.onrender.com`)
- **Description**: Comma-separated list of allowed CORS origins
- **Format**: Either `https://your-app-name.onrender.com` or `["https://your-app-name.onrender.com"]`

### 3. APP_URL
- **Value**: Your Render app URL (e.g., `https://your-app-name.onrender.com`)
- **Description**: Application base URL for Telegram auth callbacks

## Step-by-Step Deployment Process

### 1. Initial Deployment
1. Push the updated `render.yaml` to your repository
2. Create a new Web Service in Render Dashboard
3. Connect your GitHub repository
4. Render will read the `render.yaml` and create the service + database

### 2. Configure Environment Variables
After the initial deployment, go to your service settings in Render Dashboard and add:

```
FRONTEND_URL = https://your-actual-app-url.onrender.com
CORS_ALLOWED_ORIGINS = https://your-actual-app-url.onrender.com  
APP_URL = https://your-actual-app-url.onrender.com
```

### 3. Secret Environment Variables
These will be prompted during initial deployment:
- `JWT_SECRET` - Generate a secure random string
- `SESSION_SECRET` - Generate a secure random string  
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `VITE_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
- `TELEGRAM_GATEWAY_TOKEN` - Your Telegram gateway token (if using)
- `TELEGRAM_BOT_TOKEN` - Your Telegram bot token (if using)

### 4. Health Check Endpoint
The service now includes a health check at `/api/health` that provides:
- Service status
- Build information  
- File system status
- Environment configuration

### 5. Monitoring Deployment
After deployment, check:
1. **Health Check**: Visit `https://your-app.onrender.com/api/health`
2. **Static Files**: Verify CSS/JS files load properly
3. **CORS**: Check browser console for CORS errors
4. **Logs**: Monitor Render logs for any startup issues

## Troubleshooting Common Issues

### Static Files Not Loading (500 Errors)
- Check that the build completed successfully
- Verify `client/dist` directory exists and contains files
- Check Render logs for static file serving errors

### CORS Errors
- Ensure `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, and `APP_URL` match your actual Render URL
- Check the format of `CORS_ALLOWED_ORIGINS` (no brackets, no quotes unless JSON array)

### Build Failures
- Check that both root and client `package.json` files have all required dependencies
- Verify Node.js version compatibility
- Check build logs for specific error messages

## Configuration Files Updated

### Files Modified:
1. `render.yaml` - Updated to current Blueprint specification
2. `api/config/cors.js` - Enhanced CORS origin parsing
3. `api/config/server.js` - Improved static file serving with error handling
4. `start.js` - Startup diagnostics script

### Key Improvements:
- Better environment variable handling
- Enhanced static file serving
- Improved error logging and diagnostics
- Health check endpoint for monitoring
- More robust CORS configuration

## Next Steps After Deployment

1. **Test Currency Display**: Verify "so'm" appears correctly for UZS currency
2. **Test Map Functionality**: Ensure price markers display without duplicates
3. **Verify Static Assets**: Check that all CSS/JS files load properly
4. **Monitor Logs**: Watch for any runtime errors or issues
5. **Performance**: Test application responsiveness and load times

## Environment Variable Reference

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `FRONTEND_URL` | Manual | Frontend application URL | `https://myapp.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | Manual | Allowed CORS origins | `https://myapp.onrender.com` |
| `APP_URL` | Manual | Application base URL | `https://myapp.onrender.com` |
| `JWT_SECRET` | Secret | JWT signing secret | `your-secret-key` |
| `SESSION_SECRET` | Secret | Session signing secret | `your-session-secret` |
| `CLOUDINARY_*` | Secret | Cloudinary credentials | From Cloudinary dashboard |
| `VITE_GOOGLE_MAPS_API_KEY` | Secret | Google Maps API key | From Google Cloud Console |
| `TELEGRAM_*` | Secret | Telegram integration | From Telegram BotFather |
