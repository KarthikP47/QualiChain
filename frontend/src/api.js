import axios from "axios";

const api = axios.create({
  baseURL: "https://bitter-bears-drum.loca.lt/api", // backend URL
});

export default api;
