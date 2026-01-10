const MOCK = true; // Set this to false to disable mocking

/**
 * Check if the app is running in the live server.
 *
 * @returns {boolean} true if running on localhost
 */
function isLocalhost() {
  return ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

/**
 * Save fetched data to localStorage for future mock requests.
 *
 * @param {string} url the original API URL
 * @param {Response} response the response to save
 */
async function saveMockData(url, response) {
  try {
    const contentType = response.headers.get('content-type') || '';
    
    // Store the response text and content type
    const text = await response.text();
    const mockData = {
      contentType: contentType,
      data: text,
      status: response.status,
      statusText: response.statusText
    };
    
    localStorage.setItem(`mock_${url}`, JSON.stringify(mockData));
    console.log(`Saved mock data for: ${url} (${contentType})`);
  } catch (err) {
    console.warn('Failed to save mock data:', err);
  }
}

/**
 * Load saved mock data from localStorage and create a Response object.
 *
 * @param {string} url the original API URL
 * @returns {Response|null} a Response object or null if not found
 */
function loadSavedMockData(url) {
  try {
    const saved = localStorage.getItem(`mock_${url}`);
    if (saved) {
      const mockData = JSON.parse(saved);
      console.log(`Loaded saved mock data for: ${url}`);
      
      return new Response(mockData.data, {
        status: mockData.status || 200,
        statusText: mockData.statusText || 'OK',
        headers: { 'Content-Type': mockData.contentType }
      });
    }
  } catch (err) {
    console.warn('Failed to load saved mock data:', err);
  }
  return null;
}

/**
 * Wrapper for the fetch function that uses localStorage for caching.
 * If running on localhost, it will check localStorage for saved data first.
 * If not found, it will fetch from the real API and save the result.
 *
 * @param {*} url resource to fetch from an API
 * @param {*} options object with custom settings
 * @returns Promise that resolves to a Response object
 */
async function mockFetch(url, options) {
  if (isLocalhost() && MOCK) {
    // Check if we have saved data in localStorage
    const savedResponse = loadSavedMockData(url);
    if (savedResponse) {
      return savedResponse;
    }
    
    // No saved data, fetch from real API and save it
    console.log(`No cached data found, fetching from real API: ${url}`);
    const realResponse = await fetch(url, options);
    
    // Only save if the response is successful
    if (realResponse.ok) {
      // Clone the response so we can read it twice
      const clonedResponse = realResponse.clone();
      
      // Save the data for future use (async, don't wait)
      saveMockData(url, clonedResponse).catch((err) => 
        console.warn('Failed to save response:', err)
      );
    }
    
    return realResponse;
  } else {
    return await fetch(url, options);
  }
}
