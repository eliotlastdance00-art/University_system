const ACCESS_TOKEN_KEY = 'us_access_token';
const REFRESH_TOKEN_KEY = 'us_refresh_token';

export const saveTokens = (accessToken, refreshToken) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getUserFromToken = () => {
  const token = getAccessToken();
  if (!token) return null;
  
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const decoded = JSON.parse(jsonPayload);
    
    return {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email, // backend tokeninde email ýok bolsa undefined bolar (zyýansyz)
    };
  } catch (err) {
    console.error("Token okalanda ýalňyşlyk ýüze çykdy:", err);
    return null;
  }
};
