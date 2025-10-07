export const environment = {
  production: false,
  apiUrl: 'https://localhost:7109/api/', // Development API URL
  baseUrl: 'https://localhost:7109', // Development base URL
  appName: 'SyrainSooq',
  version: '1.0.0',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar'],
  recaptchaSiteKey: '', // Development reCAPTCHA site key
  googleClientId:
    '886841781701-.apps.googleusercontent.com', // Google OAuth Client ID
  googleApiKey: '', // Google API Key (not required for OAuth)
  facebookAppId: '', // Development Facebook App ID
  maxUploadSize: 5 * 1024 * 1024, // 5MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif'],
  pagination: {
    defaultPageSize: 10,
    pageSizeOptions: [5, 10, 25, 50],
  },
  // Development settings
  enableConsoleLogs: true,
  enableErrorLogs: true,
  enableDebugMode: true,
  hideAuthErrors: false,
  suppressWarnings: false,
  // Google OAuth settings for development
  googleOAuthSettings: {
    clientId: '886841781701-b1rlkdg4dr49r4j45g6d4qh05jqv5fr2.apps.googleusercontent.com',
    redirectUri: 'https://localhost:4200/identity/login',
    scope: 'syriaopenstore@gmail.com',
    responseType: 'code'
  }
};
