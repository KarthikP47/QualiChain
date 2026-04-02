import { useState } from "react";
// removed useNavigate
import api from "../api";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [wallet, setWallet] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await api.post("/auth/register", {
        username,
        email,
        password,
        wallet_address: wallet || null,
      });

      if (res.data.ok) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setMessage("Registered successfully! Redirecting to feed...");
        setTimeout(() => window.location.href = "/", 800);
      } else {
        setError(res.data.error || "Registration failed");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Registration error");
    }
  };

  return (
    <>
      <h2 className="page-title">Create your BOSM account</h2>
      <p className="page-subtitle">
        Connect a wallet address (Hardhat account) to receive reward tokens.
      </p>

      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="label">Username</label>
          <input
            className="input"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="label">Email</label>
          <input
            className="input"
            type="email"
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

        <div className="form-group">
          <label className="label">Wallet address (Hardhat)</label>
          <input
            className="input"
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="0x..."
          />
        </div>

        <button className="btn btn-primary" type="submit">
          Register
        </button>

        {message && <p className="text-success">{message}</p>}
        {error && <p className="text-error">{error}</p>}
      </form>
    </>
  );
}
