/**
 * HTTPS redirect middleware that excludes certain endpoints
 * to prevent issues with payment webhooks
 */

const httpsRedirect = (req, res, next) => {
  // Skip HTTPS enforcement for:
  // 1. Development environment
  // 2. Local requests
  // 3. Payment webhooks (Payme, Click)
  // 4. Health checks
  
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if request is already HTTPS
  const isHttps = req.secure || 
                  req.get('X-Forwarded-Proto') === 'https' ||
                  req.get('X-Forwarded-SSL') === 'on' ||
                  req.connection.encrypted;

  if (isHttps) {
    return next();
  }

  // URLs that should NOT be redirected to HTTPS (for webhook compatibility)
  const noRedirectPaths = [
    '/api/payme/pay',           // Payme webhook endpoint
    '/api/click/prepare',       // Click webhook endpoints
    '/api/click/complete',
    '/api/health'               // Health check endpoint
  ];

  // Check if this is a webhook endpoint that should not be redirected
  const shouldNotRedirect = noRedirectPaths.some(path => req.path.startsWith(path));
  
  if (shouldNotRedirect) {
    console.log(`Allowing HTTP for webhook endpoint: ${req.path}`);
    return next();
  }

  // For all other endpoints in production, redirect to HTTPS
  const httpsUrl = `https://${req.get('host')}${req.url}`;
  console.log(`Redirecting to HTTPS: ${req.url} -> ${httpsUrl}`);
  
  return res.redirect(301, httpsUrl);
};

module.exports = {
  httpsRedirect
};
