import axios from "axios";

const api = axios.create({
  baseURL: "https://fine-bugs-kiss.loca.lt/api", // backend URL
});

export default api;
