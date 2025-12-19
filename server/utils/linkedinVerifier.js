const axios = require('axios');

/**
 * Verifies if a LinkedIn profile URL is valid and accessible by checking HTML content
 * @param {string} linkedinUrl - The LinkedIn profile URL to verify
 * @returns {Promise<{isValid: boolean, error?: string}>}
 */
async function verifyLinkedInUrl(linkedinUrl) {
  try {
    // Normalize the URL
    let url = linkedinUrl.trim();
    
    // Ensure URL has protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Remove query parameters and fragments for verification
    const urlObj = new URL(url);
    urlObj.search = '';
    urlObj.hash = '';
    const cleanUrl = urlObj.toString();
    
    console.log('Verifying LinkedIn URL:', cleanUrl);
    
    // Always use GET request to check HTML content (LinkedIn returns 200 even for non-existent profiles)
    try {
      const response = await axios.get(cleanUrl, {
        timeout: 15000, // 15 second timeout
        maxRedirects: 5,
        validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        }
      });
      
      const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
      const finalUrl = response.request?.res?.responseUrl || response.request?.responseURL || cleanUrl;
      
      console.log('Response status:', response.status);
      console.log('Final URL:', finalUrl);
      console.log('HTML length:', html.length);
      
      // Extract title for debugging
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const pageTitle = titleMatch ? titleMatch[1] : 'No title found';
      console.log('Page title:', pageTitle);
      
      // Check if redirected away from LinkedIn
      if (!finalUrl.includes('linkedin.com/in/')) {
        console.log('URL redirected away from LinkedIn profile');
        return { isValid: false, error: 'URL does not point to a valid LinkedIn profile' };
      }
      
      // Check for LinkedIn error pages (non-existent profiles)
      const errorIndicators = [
        /this profile doesn't exist/i,
        /profile not found/i,
        /couldn't find this profile/i,
        /page not found/i,
        /404/i,
        /doesn't exist/i,
        /unavailable/i,
        /error.*profile/i,
      ];
      
      const hasErrorIndicator = errorIndicators.some(pattern => pattern.test(html));
      if (hasErrorIndicator) {
        console.log('LinkedIn error page detected - profile does not exist');
        return { isValid: false, error: 'LinkedIn profile not found. Please check the URL and try again.' };
      }
      
      // Check for valid LinkedIn profile indicators
      const validProfileIndicators = [
        /property="og:type".*content="profile"/i,
        /"@type"\s*:\s*"Person"/i,
        /linkedin\.com\/in\//i,
        /pv\.profile-view/i,
        /profile\.linkedin\.com/i,
        /"profilePage"/i,
        /class=".*profile.*"/i,
        /data-chameleon-result-urn/i,
      ];
      
      const hasValidIndicator = validProfileIndicators.some(pattern => pattern.test(html));
      
      // Check HTTP status
      if (response.status === 404) {
        console.log('LinkedIn returned 404 - profile not found');
        return { isValid: false, error: 'LinkedIn profile not found. Please check the URL and try again.' };
      }
      
      if (response.status === 403 || response.status === 401) {
        // 403/401 might mean profile exists but is private - check if we got LinkedIn content
        if (html.includes('linkedin.com') && !hasErrorIndicator) {
          console.log('LinkedIn profile exists but is private (403/401) - accepting');
          return { isValid: true };
        } else {
          return { isValid: false, error: 'LinkedIn profile is not accessible. Please ensure the profile is public or try again.' };
        }
      }
      
      if (response.status >= 200 && response.status < 400) {
        // STRICT: Require valid profile indicators AND no error indicators
        if (hasErrorIndicator) {
          console.log('Error indicators found in response - rejecting');
          return { isValid: false, error: 'LinkedIn profile not found. Please check the URL and try again.' };
        }
        
        // Check for more specific profile indicators that prove a real profile exists
        const strongProfileIndicators = [
          /property="og:type".*content="profile"/i,
          /"@type"\s*:\s*"Person"/i,
          /pv\.profile-view/i,
          /profile\.linkedin\.com/i,
          /"profilePage"/i,
          /data-chameleon-result-urn/i,
          /<title>.*LinkedIn/i, // Profile pages have specific titles
          /"entityUrn".*"urn:li:fs_profile:/i, // LinkedIn entity URN
          /"vanityName"/i, // Vanity name in JSON-LD
        ];
        
        const hasStrongIndicator = strongProfileIndicators.some(pattern => pattern.test(html));
        
        // Also check for signs of a login/error page (which fake profiles might show)
        const loginOrErrorIndicators = [
          /sign in to continue/i,
          /join linkedin/i,
          /this profile doesn't exist/i,
          /profile not found/i,
          /couldn't find this profile/i,
          /page not found/i,
          /404/i,
          /unavailable/i,
          /error.*profile/i,
          /<title>.*(sign in|join|error|not found|linkedin)/i, // Generic LinkedIn page titles
          /<title>LinkedIn<\/title>/i, // Just "LinkedIn" title (not a profile)
          /<title>.*Sign.*In/i,
        ];
        
        // Check title specifically - real profiles have names in title
        const isGenericTitle = /^LinkedIn$/i.test(pageTitle.trim()) || 
                              /^Sign.*In/i.test(pageTitle.trim()) ||
                              /^Join.*LinkedIn/i.test(pageTitle.trim());
        
        if (isGenericTitle) {
          console.log('Generic LinkedIn title detected - likely not a real profile');
          return { isValid: false, error: 'LinkedIn profile not found. Please check the URL and try again.' };
        }
        
        const hasLoginOrError = loginOrErrorIndicators.some(pattern => pattern.test(html));
        
        if (hasLoginOrError) {
          console.log('Login/error page detected - profile likely does not exist');
          return { isValid: false, error: 'LinkedIn profile not found or not accessible. Please check the URL and ensure the profile is public.' };
        }
        
        // Only accept if we have strong indicators of a real profile
        if (hasStrongIndicator) {
          console.log('LinkedIn profile verified successfully with strong indicators');
          return { isValid: true };
        } else {
          // No strong indicators found - reject to be safe
          console.log('No strong profile indicators found - rejecting to prevent fake profiles');
          console.log('HTML sample (first 500 chars):', html.substring(0, 500));
          return { isValid: false, error: 'Could not verify LinkedIn profile exists. Please ensure the URL is correct and the profile is public and accessible.' };
        }
      } else {
        console.log('LinkedIn returned unexpected status:', response.status);
        return { isValid: false, error: `LinkedIn returned error status: ${response.status}` };
      }
      
    } catch (error) {
      console.error('LinkedIn URL verification error:', error.message);
      console.error('Error code:', error.code);
      
      // Handle specific error cases
      if (error.response) {
        // Got a response but with error status
        const status = error.response.status;
        if (status === 404) {
          return { isValid: false, error: 'LinkedIn profile not found. Please check the URL and try again.' };
        }
        if (status === 403 || status === 401) {
          // Might be private profile - reject to be safe
          return { isValid: false, error: 'LinkedIn profile is not accessible. Please ensure the profile is public.' };
        }
        return { isValid: false, error: `LinkedIn returned error status: ${status}` };
      }
      
      // Network errors - reject instead of accepting
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
        console.log('Network error during verification - rejecting to ensure security');
        return { isValid: false, error: 'Could not verify LinkedIn profile. Please check your internet connection and try again.' };
      }
      
      // Other errors - reject
      return { isValid: false, error: 'Could not verify LinkedIn profile. Please ensure the URL is correct and accessible.' };
    }
  } catch (error) {
    console.error('LinkedIn URL verification error:', error.message);
    return { isValid: false, error: 'Invalid LinkedIn URL format or verification failed' };
  }
}

module.exports = { verifyLinkedInUrl };

