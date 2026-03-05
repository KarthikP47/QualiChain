import axios from "axios";

const api = axios.create({
  baseURL: "https://shaggy-emus-say.loca.lt/api", // backend URL
  headers: {
    "Bypass-Tunnel-Reminder": "true",
  }
});

export default api;
