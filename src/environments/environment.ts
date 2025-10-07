export const environment = {
    production: true,
    apiUrl: 'https://api.syriaopenstore.com/api/', // Update this with your actual API URL
    baseUrl: 'https://api.syriaopenstore.com', // Update this with your actual API URL
    appName: 'SyrainSooq',
    version: '1.0.0',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar'],
    recaptchaSiteKey: '', // Add your reCAPTCHA site key if using Google reCAPTCHA
    googleClientId: '886841781701-.apps.googleusercontent.com', // Google OAuth Client ID
    googleApiKey: '', // Google API Key (not required for OAuth)
    facebookAppId: '', // Add your Facebook App ID if using Facebook authentication
    maxUploadSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50]
    },
    // Production settings
    enableConsoleLogs: false,
    enableErrorLogs: false,
    enableDebugMode: false,
    hideAuthErrors: true,
    suppressWarnings: true,
    // Google OAuth settings for production
    googleOAuthSettings: {
      clientId: '886841781701-.apps.googleusercontent.com',
      redirectUri: 'https://syriaopenstore.com/identity/login', // تحديث هذا بالـ domain الصحيح
      scope: 'syriaopenstore@gmail.com',
      responseType: 'code'
    }
  }; 