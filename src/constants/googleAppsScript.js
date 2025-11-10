// 🚨 IMPORTANT: Update this URL with your Google Apps Script Web App URL
// The URL should end with '/exec' and look like:
// https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
//
// To get the correct URL:
// 1. Go to script.google.com
// 2. Open your Google Apps Script project
// 3. Click "Deploy" → "Manage deployments"
// 4. Ensure deployment type is "Web app"
// 5. Set "Execute as: Me (your email)"
// 6. Set "Who has access: Anyone"
// 7. Copy the Web app URL and paste it below

export const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxfWXjIr9Dd5CsJS9MwJ4cj9YAteazp1gsN5dZUSd14OwE7sT8fEdvNqbzkpilTDhuNHA/exec';

// URL validation helper
export const validateGoogleAppsScriptUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'script.google.com' && 
           urlObj.pathname.includes('/macros/s/') && 
           url.endsWith('/exec');
  } catch {
    return false;
  }
};
