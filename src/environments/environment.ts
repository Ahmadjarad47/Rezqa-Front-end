export const environment = {
    production: true,
    apiUrl: 'https://syrianstore.runasp.net/api/', // Update this with your actual API URL
    appName: 'SyrainSooq',
    version: '1.0.0',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ar'],
    recaptchaSiteKey: '', // Add your reCAPTCHA site key if using Google reCAPTCHA
    googleClientId: '', // Add your Google OAuth client ID if using Google authentication
    facebookAppId: '', // Add your Facebook App ID if using Facebook authentication
    maxUploadSize: 5 * 1024 * 1024, // 5MB
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
    pagination: {
      defaultPageSize: 10,
      pageSizeOptions: [5, 10, 25, 50]
    },
    cache: {
      userProfileTTL: 3600, // 1 hour in seconds
      refreshTokenTTL: 604800 // 7 days in seconds
    }
  }; 