// Toggle this to switch between local and deployed backend
const USE_LOCAL = false;

// Your local IP address (replace with your machine's IP)
const LOCAL_IP = "192.168.43.158";

// Base URL for API requests
export const API_BASE_URL = USE_LOCAL
  ? `http://${LOCAL_IP}:8000/api/`
  : "https://wavifyserver.onrender.com/api/";
