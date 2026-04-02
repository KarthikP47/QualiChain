import { useState } from "react";
// removed useNavigate
import api from "../api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      if (res.data.ok) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setMessage("Login success! Redirecting to feed...");
        setTimeout(() => window.location.href = "/", 800);
      } else {
        setError(res.data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Login error");
    }
  };

  return (
    <>
      <h2 className="page-title">Welcome back</h2>
      <p className="page-subtitle">
        Sign in to manage your posts and claim your quality-based rewards.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Email or Username</label>
          <input
            className="input"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Password</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button className="btn btn-primary" type="submit">
          Login
        </button>

        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}
      </form>
    </>
  );
}
