import axios from "axios";

const api = axios.create({
  baseURL: "https://put-rack-prison-allowed.trycloudflare.com/api", // backend URL
  headers: {
    "Bypass-Tunnel-Reminder": "true",
  }
});

export default api;
