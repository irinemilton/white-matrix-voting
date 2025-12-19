/**
 * Verifies if a LinkedIn profile URL has a valid format.
 * NOTE: Server-side HTML scraping of LinkedIn is disabled because LinkedIn 
 * blocks cloud hosting IPs (Error 999).
 * * @param {string} linkedinUrl - The LinkedIn profile URL to verify
 * @returns {Promise<{isValid: boolean, url?: string, error?: string}>}
 */
async function verifyLinkedInUrl(linkedinUrl) {
  try {
    if (!linkedinUrl || typeof linkedinUrl !== 'string') {
      return { isValid: false, error: 'LinkedIn URL is required' };
    }

    // 1. Normalize and Clean the URL
    let url = linkedinUrl.trim();
    
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      const urlObj = new URL(url);
      
      // Ensure it's a linkedin.com domain
      if (!urlObj.hostname.includes('linkedin.com')) {
        return { isValid: false, error: 'Must be a valid linkedin.com URL' };
      }

      // Remove query parameters (e.g., ?utm_source=...) and fragments (#)
      urlObj.search = '';
      urlObj.hash = '';
      const cleanUrl = urlObj.toString();

      // 2. REGEX VALIDATION 
      // This checks for the standard /in/username format
      // It allows alphanumeric characters, hyphens, and underscores
      const linkedinProfileRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/i;

      if (!linkedinProfileRegex.test(cleanUrl)) {
        return { 
          isValid: false, 
          error: 'Invalid format. Use: https://www.linkedin.com/in/your-profile' 
        };
      }

      // 3. PRODUCTION LOGIC
      // Since we cannot "ping" LinkedIn from Render without getting Error 999,
      // we trust the Regex validation and the user's input.
      console.log('LinkedIn URL validated via Regex:', cleanUrl);
      
      return { 
        isValid: true, 
        url: cleanUrl 
      };

    } catch (e) {
      return { isValid: false, error: 'The provided string is not a valid URL' };
    }
  } catch (error) {
    console.error('LinkedIn validation logic error:', error.message);
    return { isValid: false, error: 'Verification system error' };
  }
}

module.exports = { verifyLinkedInUrl };