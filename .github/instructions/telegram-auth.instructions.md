# How to Implement Telegram Authentication with Login Widget

Based on the implementation in this project, here's a complete guide to adding Telegram authentication to your web application.

## Prerequisites

- A Telegram Bot (created through BotFather)
- Web application with a backend (Node.js/Express in this example)
- Frontend application (React in this example)

## Step 1: Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` to create a new bot
3. Follow the instructions to set a name and username
4. Save the bot token provided by BotFather

## Step 2: Configure Your Bot for Login

1. Send `/mybots` to BotFather
2. Select your bot
3. Choose "Bot Settings" > "Domain"
4. Add your website domain (must be HTTPS for production)

## Step 3: Backend Implementation

### 1. Set up environment variables

```
TELEGRAM_BOT_TOKEN=your_bot_token
JWT_SECRET=your_jwt_secret
```

### 2. Create a route for Telegram authentication

```js
// routes/telegramAuth.js
const express = require('express');
const router = express.Router();
const telegramAuthController = require('../controllers/telegramAuth');

// Handle Telegram Login Widget callback
router.get('/callback', telegramAuthController.handleCallback);
router.post('/callback', telegramAuthController.handleCallback);

// Handle Telegram logout
router.post('/logout', authMiddleware, telegramAuthController.logoutTelegram);

module.exports = router;
```

### 3. Implement the authentication controller

```js
// controllers/telegramAuth.js
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/users');

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const JWT_SECRET = process.env.JWT_SECRET;

// Handle Telegram Login Widget callback
exports.handleCallback = async (req, res) => {
  try {
    // Handle both GET and POST requests
    const telegramData = req.method === 'GET' ? req.query : req.body;
    
    // Validate Telegram data
    if (!validateTelegramLoginData(telegramData)) {
      return res.redirect('/login?error=invalid_auth');
    }
    
    // Check if authentication is not too old (1 day max)
    const authDate = parseInt(telegramData.auth_date);
    const now = Math.floor(Date.now() / 1000);
    if (now - authDate > 86400) {
      return res.redirect('/login?error=expired_auth');
    }
    
    // Get the base URL for redirects
    const baseUrl = process.env.APP_URL || 
                   req.headers.origin || 
                   'https://your-app-url.com';
    
    // Check if a user with this Telegram ID exists
    let user = await User.findOne({ 
      where: { telegramId: String(telegramData.id) } 
    });
    
    if (user) {
      // Update Telegram data
      user.telegramUsername = telegramData.username || user.telegramUsername;
      user.telegramFirstName = telegramData.first_name || user.telegramFirstName;
      user.telegramPhotoUrl = telegramData.photo_url || user.telegramPhotoUrl;
      user.telegramLinked = true;
      
      await user.save();
      
      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, id: user.id, userType: user.userType },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Set cookie and redirect
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: 'none' // For cross-site redirects
      });
      
      return res.redirect(`${baseUrl}/account?login_success=true`);
    } else {
      // Create a new account with Telegram data
      const randomPassword = crypto.randomBytes(12).toString('hex');
      const hashedPassword = bcrypt.hashSync(randomPassword, bcryptSalt);
      
      const userName = telegramData.username || telegramData.first_name || 'Telegram User';
      
      user = await User.create({
        name: userName,
        password: hashedPassword,
        telegramId: String(telegramData.id),
        telegramUsername: telegramData.username || null,
        telegramFirstName: telegramData.first_name || null,
        telegramPhotoUrl: telegramData.photo_url || null,
        telegramLinked: true,
        userType: 'client' // Default user type
      });
      
      // Generate JWT token
      const token = jwt.sign(
        { email: user.email, id: user.id, userType: user.userType },
        JWT_SECRET,
        { expiresIn: '7d' }
      );
      
      // Set cookie and redirect
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'none'
      });
      
      return res.redirect(`${baseUrl}/account?new_account=true`);
    }
  } catch (error) {
    console.error('Telegram callback error:', error);
    return res.redirect('/login?error=server_error');
  }
};

// Handle Telegram logout
exports.logoutTelegram = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({
        ok: false,
        error: 'User not authenticated'
      });
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        ok: false,
        error: 'User not found'
      });
    }
    
    if (!user.telegramLinked) {
      return res.status(400).json({
        ok: false,
        error: 'User is not linked to Telegram'
      });
    }
    
    user.telegramLinked = false;
    await user.save();
    
    res.clearCookie('token');
    
    return res.json({
      ok: true,
      message: 'Successfully logged out from Telegram'
    });
  } catch (error) {
    console.error('Telegram logout error:', error);
    return res.status(500).json({
      ok: false,
      error: 'An error occurred during logout. Please try again.'
    });
  }
};

// Validate Telegram Login Widget data
function validateTelegramLoginData(data) {
  if (!data.id || !data.hash || !data.auth_date) {
    return false;
  }
  
  // Create data check string
  const dataCheckArr = Object.entries(data)
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`);
  
  const dataCheckString = dataCheckArr.join('\n');
  
  // Create secret key by SHA256 of the bot token
  const secretKey = crypto.createHash('sha256')
    .update(TELEGRAM_BOT_TOKEN)
    .digest();
  
  // Generate HMAC-SHA256 hash of the data check string
  const hash = crypto.createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  // Compare our hash with the hash from Telegram
  return hash === data.hash;
}
```

## Step 4: Frontend Implementation

### 1. Create a TelegramAuth component

```jsx
// components/TelegramAuth.jsx
import { useState, useEffect, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "./UserContext";
import { useNotification } from "./NotificationContext";

export default function TelegramAuth() {
  const [error, setError] = useState('');
  const { setUser } = useContext(UserContext);
  const { notify } = useNotification();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for error parameters in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    
    if (error === 'not_registered') {
      setError('You need to register or link your Telegram account first.');
    } else if (error === 'server_error') {
      setError('An error occurred during authentication. Please try again.');
    } else if (error === 'expired_auth') {
      setError('Authentication expired. Please try again.');
    } else if (error === 'invalid_auth') {
      setError('Invalid authentication data. Please try again.');
    }
  }, [location]);

  // Telegram Login Widget initialization
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js';
    script.async = true;
    
    const telegramBotUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'YourBotName';
                               
    script.setAttribute('data-telegram-login', telegramBotUsername);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-auth-url', `${import.meta.env.VITE_API_URL || window.location.origin}/api/telegram-auth/callback`);
    script.setAttribute('data-request-access', 'write');
    
    const widgetContainer = document.getElementById('telegram-login-widget');
    if (widgetContainer) {
      widgetContainer.appendChild(script);
    }
    
    return () => {
      const widgetContainer = document.getElementById('telegram-login-widget');
      if (widgetContainer) {
        while (widgetContainer.firstChild) {
          widgetContainer.removeChild(widgetContainer.firstChild);
        }
      }
    };
  }, []);

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold text-center mb-4">Login with Telegram</h1>
      
      {error && (
        <div className="bg-red-100 text-red-800 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <div className="flex flex-col items-center space-y-4">
        <p className="text-gray-600 text-center">
          Click the button below to authenticate with your Telegram account.
        </p>
        
        <div id="telegram-login-widget" className="mt-4"></div>
      </div>
    </div>
  );
}
```

### 2. Add Telegram login button to login page

```jsx
// pages/LoginPage.jsx
<div className="mt-4">
  <div className="relative flex items-center justify-center">
    <div className="border-t border-gray-300 flex-grow"></div>
    <div className="mx-4 text-gray-500 text-sm">or</div>
    <div className="border-t border-gray-300 flex-grow"></div>
  </div>

  <Link to="/telegram-login" className="flex w-full justify-center items-center bg-[#2AABEE] text-white py-2 px-4 rounded-lg mt-4 hover:bg-[#229ED9] transition">
    <svg className="w-6 h-6 mr-2" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fill="white" d="M66.964 134.874s-3.607 3.607-6.762 3.607l-1.928-20.225s51.867-47.304 72.369-62.732c6.578-5.134 14.106 0 8.066 8.04-24.017 31.349-45.376 57.552-45.376 57.552l-12.042 8.69-14.327 5.068z" />
      <path fill="none" stroke="white" strokeWidth="8" d="M86.232 157.428c-12.023 12.024-22.92 6.417-22.92 6.417l-20.158-27.902 89.261-71.267c7.585-6.067 2.799-7.586 2.799-7.586s-4.447 1.519-9.383 6.455c-4.936 4.935-82.733 74.293-82.733 74.293" />
    </svg>
    Login with Telegram
  </Link>
</div>
```

### 3. Add environment variables to frontend

```
VITE_TELEGRAM_BOT_USERNAME=your_bot_username
VITE_API_URL=http://localhost:4000
```

## Step 5: Database Schema Changes

Update your user model to include Telegram fields:

```js
// models/users.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  // Regular user fields
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: true },
  password: { type: DataTypes.STRING, allowNull: true },
  userType: { type: DataTypes.ENUM('client', 'host'), defaultValue: 'client' },
  
  // Telegram specific fields
  telegramId: { type: DataTypes.STRING, unique: true, allowNull: true },
  telegramUsername: { type: DataTypes.STRING, allowNull: true },
  telegramFirstName: { type: DataTypes.STRING, allowNull: true },
  telegramPhone: { type: DataTypes.STRING, allowNull: true },
  telegramPhotoUrl: { type: DataTypes.STRING, allowNull: true },
  telegramLinked: { type: DataTypes.BOOLEAN, defaultValue: false },
});

module.exports = User;
```

## Step 6: Profile Page Integration

Display Telegram information in the user profile:

```jsx
{/* Show Telegram connection status */}
{user.telegramLinked !== undefined && (
  <div className="flex items-center">
    <span className="text-gray-600">Telegram:</span>
    <span className={`font-medium ml-1 ${user.telegramLinked ? 'text-green-600' : 'text-red-600'}`}>
      {user.telegramLinked ? 'Connected' : 'Not Connected'}
    </span>
  </div>
)}

{/* Show Telegram username if available */}
{user.telegramUsername && (
  <div className="text-xs text-gray-500 mt-1">
    Telegram: @{user.telegramUsername}
  </div>
)}

{/* Handle Telegram logout */}
<button 
  onClick={user.telegramLinked ? logoutTelegram : logout} 
  className="primary w-full max-w-xs mx-auto"
  disabled={isLoggingOut}
>
  {isLoggingOut ? 'Logging out...' : 'Logout'}
</button>
```

## Security Considerations

1. Always validate data from Telegram to prevent forgery
2. Use HTTPS for production deployments
3. Store Telegram tokens securely in environment variables
4. Set appropriate cookie security options (httpOnly, secure, sameSite)
5. Implement rate limiting on login routes

By following these steps, you'll successfully implement Telegram authentication in your web application using the Telegram Login Widget.
