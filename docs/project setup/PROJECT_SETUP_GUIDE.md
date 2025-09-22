# Project Setup Guide

This guide will walk you through setting up the GetSpace uz project locally and deploying it to the cloud.

## 📋 Prerequisites

- Node.js (>=14)
- Docker and Docker Compose
- Git
- PostgreSQL (if not using Docker)

## 🏠 Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Environment Configuration

This project requires two separate `.env` files:

#### Root Level `.env` File
```bash
cp .env.example .env
```

#### Client Level `.env` File
```bash
cp client/.env.example client/.env
```

Fill in the required environment variables in both files:

**Root `.env` (Backend Configuration):**
- `CLOUDINARY_*`: Cloudinary credentials
- `ESKIZ_*`: SMS service credentials
- `CLICK_*`: Click.uz payment gateway credentials
- `PAYME_*`: Payme payment gateway credentials
- `OCTO_*`: Octo payment gateway credentials

**Client `.env` (Frontend Configuration):**
- `VITE_API_BASE_URL`: Backend API URL (http://localhost:4000/api for local)
- `VITE_TELEGRAM_BOT_USERNAME`: Telegram bot username
- `VITE_YANDEX_GEOCODER_API_KEY`: Yandex API key for geocoding
- `VITE_GOOGLE_MAPS_API_KEY`: Google Maps API key
- `VITE_PROTECTION_PLAN_PERCENTAGE`: Protection plan percentage (e.g., 20)

### 3. Database Setup

Start PostgreSQL using Docker Compose:

```bash
docker-compose up -d postgres
```

This will:
- Create a PostgreSQL container on port 5433
- Create database `conferencehub`
- Set up user `postgres` with password `postgres`

### 4. Install Dependencies

#### Install root dependencies:
```bash
npm install
```

#### Install client dependencies:
```bash
cd client
npm install
cd ..
```


### 5. Start Development Servers

Start both backend and frontend in development mode:

```bash
npm run dev
```

This command will:
- Start the API server on http://localhost:4000
- Start the Vite dev server on http://localhost:5173
- Enable hot reloading for both frontend and backend

### 7. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000/api
- **Database**: localhost:5433

---

## ☁️ Cloud Deployment (Render.com)

### 1. Render.com Setup

The project includes a `render.yaml` file for easy deployment to Render.com.

#### Required Services Configuration:

1. **Web Service**: `conferencehub-app`
2. **Database**: `conferencehub-db` (PostgreSQL)

### 2. Environment Variables Setup

Configure the following environment variables in your Render dashboard:

#### Core Configuration
- `NODE_ENV=production`
- `PORT=10000`
- `DB_URL`: Auto-configured from database connection

#### Third-Party Service Keys

##### Cloudinary (Image/Video Storage)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Setup Instructions:**
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Get credentials from Dashboard → Settings → API Keys
3. Configure upload presets and transformations as needed

##### Eskiz SMS Service
- `ESKIZ_EMAIL`
- `ESKIZ_SECRET_CODE`
- `ESKIZ_BASE_URL=https://notify.eskiz.uz/api`
- `ESKIZ_FROM`

**Setup Instructions:**
1. Register at [eskiz.uz](https://eskiz.uz)
2. Get API credentials from your dashboard
3. Submit any new SMS templates for approval if required
4. Reference the Eskiz samples at [docs/ESKIZ_SUBMISSION_TEMPLATES.md](../ESKIZ_SUBMISSION_TEMPLATES.md)

##### Payment Gateways

**Click.uz:**
- `CLICK_MERCHANT_ID`
- `CLICK_SERVICE_ID`
- `CLICK_CHECKOUT_LINK`
- `CLICK_SECRET_KEY`

Reference Docs: [Click User Stories](../CLICK_PAYMENT_INTEGRATION.md)

**Payme:**
- `PAYME_MERCHANT_ID`
- `PAYME_SECRET_KEY`
- `PAYME_TEST_KEY`
- `VITE_PAYME_MERCHANT_ID`

Reference Docs: [Payme User Stories](../PAYME_INTEGRATION_EPIC.md)

**Octo:**
- `OCTO_SECRET`
- `OCTO_SHOP_ID`

Reference Docs: [Octo User Stories](../payment-spike.md)

**Setup Instructions:**
1. Register merchant accounts with each payment provider
2. Complete verification process
3. Reference each provider's documentation for configuration. Click is the only provider we pull the successful payment while the others rely on webhooks. Reason is that Click does not send notification to international servers and only allows local Uzbekistan Servers.
4. Test in sandbox mode before going live. Payme provides a sandbox environment

##### Maps and Geocoding

**Google Maps API:**
- `VITE_GOOGLE_MAPS_API_KEY`

**Yandex Geocoder API:**
- `VITE_YANDEX_GEOCODER_API_KEY`

**Setup Instructions:**
1. **Google Maps**: Enable Maps JavaScript API, Places API, and Geocoding API in Google Cloud Console
2. **Yandex**: Register at [developer.tech.yandex.com](https://developer.tech.yandex.com) and get Geocoder API key
3. Configure API restrictions and usage limits

##### Telegram Bot Authentication
- `TELEGRAM_GATEWAY_TOKEN`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `VITE_TELEGRAM_BOT_USERNAME`

**Setup Instructions:**
1. Create bot via [@BotFather](https://t.me/botfather) on Telegram
2. Get bot token and username
3.  Set up Telegram Login Widget domains. To run locally you need ngrok with static URL.

### 3. Domain Configuration

Set your production domain in environment variables:
- `PRODUCTION_DOMAIN=getspace.uz`
- `PRODUCTION_URL=https://getspace.uz`
- `FRONTEND_URL=https://getspace.uz`
- `CLIENT_BASE_URL=https://getspace.uz`
- `CORS_ALLOWED_ORIGINS=["https://getspace.uz", "https://www.getspace.uz"]`

### 4. Deploy to Render

1. Connect your GitHub repository to Render
2. Create services based on `render.yaml`
3. Set all environment variables
4. Deploy

---

## 🔧 Configuration Details

### Database Migration Settings
- `MIGRATIONS_ONLY=true`: Run only migrations, don't auto-sync
- `DB_AUTOSYNC=false`: Disable automatic database synchronization (recommended for production)

### Payment Configuration
- `PROTECTION_PLAN_PERCENTAGE=20`: Set protection plan percentage (20%)

### Regional Settings
The application supports multiple currencies and languages:
- **Languages**: Russian (RU), Uzbek (UZ), English (EN)
- **Currencies**: UZS, RUB, USD, EUR
- **Currency Conversion API**: Available at `/api/currency/rates/:baseCurrency` and `/api/currency/convert`
  - Uses external Exchange Rate API (https://open.er-api.com) with 1-hour caching
  - Conversion utilities in `client/src/utils/currencyUtils.js`
  - Currency context provider in `client/src/contexts/CurrencyContext.jsx` 

---

## 🚀 Production Checklist

Before going live, ensure:

- [ ] All API keys are configured and valid
- [ ] Payment gateways are set to production mode
- [ ] Webhook URLs are properly configured
- [ ] SSL certificates are in place
- [ ] Database backups are configured
- [ ] Error monitoring is set up
- [ ] Domain DNS is properly configured
- [ ] CORS origins are correctly set
- [ ] All third-party service accounts are verified

---

## 📚 Additional Resources

- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Eskiz SMS API](https://documenter.getpostman.com/view/663428/RzfmES4z)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [Yandex Geocoder API](https://yandex.com/dev/maps/geocoder/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Render Deployment Guide](https://render.com/docs)

---

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check if PostgreSQL container is running: `docker ps`
   - Verify environment variables in `.env`

2. **API Key Errors**
   - Ensure all required API keys are set in environment variables
   - Check API key permissions and usage limits

3. **Payment Gateway Issues**
   - Verify webhook URLs are accessible
   - Check if payment providers are in correct mode (test/production)

4. **Build Failures**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version compatibility

### Getting Help

- Check the project's GitHub issues
- Review API documentation for third-party services
- Contact the development team

---

*Last updated: September 2025*