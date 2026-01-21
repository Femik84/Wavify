import axios from "axios";

// 🔄 Toggle this to switch between local and deployed
const USE_LOCAL = false;

// ⚙️ Local IP (update to your machine's IP address)
const LOCAL_IP = "192.168.43.158";

// 🌍 Base URL for web
export const baseURL = USE_LOCAL
  ? `http://${LOCAL_IP}:8000/api/`
  : "https://wavifyserver.onrender.com/api/";

// 🔹 Create Axios instance
const apiInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// 🔹 Attach access token before every request
apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🔹 Helper: refresh access token
const refreshAccessToken = async () => {
  const refresh = localStorage.getItem("refresh");
  if (!refresh) return null;

  try {
    const res = await axios.post(`${baseURL}auth/token/refresh/`, { refresh });
    const newAccess = res.data.access;
    if (newAccess) {
      localStorage.setItem("access", newAccess);
      return newAccess;
    }
  } catch (err) {
    console.error("Token refresh failed:", err);
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
  }
  return null;
};

// 🔹 Retry interceptor for 401
apiInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const newAccess = await refreshAccessToken();
      if (newAccess && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return apiInstance(originalRequest); // retry original request
      }
    }

    return Promise.reject(error);
  }
);

export default apiInstance;
