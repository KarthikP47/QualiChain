import axios from "axios";

const api = axios.create({
  baseURL: "https://hungry-nails-smile.loca.lt/api", // backend URL
});

export default api;
