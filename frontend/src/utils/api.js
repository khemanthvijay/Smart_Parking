const API_BASE_URL = "http://localhost:5000";
export const apiRequest = async (endpoint, method = 'GET', body = null, customHeaders = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
      method,
      credentials: 'include', // Send cookies (for JWT HttpOnly)
      headers: { 
          'Content-Type': 'application/json', 
          ...customHeaders // ✅ Merge custom headers
      },
      body: body ? JSON.stringify(body) : null,
  };

  try {
      const response = await fetch(url, options);
      const data = await response.json();
      console.log(response.status);
      console.log(data);
      if (!response.ok && response.status !== 401 && response.status !== 403) {
          throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return { data, status: response.status };
  } catch (error) {
      console.error(`Error in API request: ${error.message}`);
      throw error;
  }
};
