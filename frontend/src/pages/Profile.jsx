import { useEffect, useState } from "react";
import api from "../api";

export default function Profile() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const res = await api.get(`/users/${user.id}/summary`);
        setSummary(res.data);
      } catch (err) {
        console.error(err);
        setError("Cannot load profile info");
      }
    };
    fetchData();
  }, []);

  if (!user) {
    return (
      <>
        <h2 className="page-title">Profile</h2>
        <p className="page-subtitle" style={{ color: "#f97373" }}>
          You must be logged in.
        </p>
      </>
    );
  }

  if (!summary) {
    return (
      <>
        <h2 className="page-title">Profile</h2>
        <p className="page-subtitle">Loading stats…</p>
      </>
    );
  }

  return (
    <>
      <h2 className="page-title">Your Profile</h2>
      <p className="page-subtitle">
        Wallet-linked reputation and reward statistics
      </p>

      <div style={{ marginTop: "1rem", lineHeight: "1.6" }}>
        <div><strong>Username:</strong> {summary.user.username}</div>
        <div><strong>Email:</strong> {summary.user.email}</div>
        <div><strong>Wallet:</strong> {summary.user.wallet_address || "—"}</div>
        <div><strong>Joined:</strong> {new Date(summary.user.created_at).toLocaleDateString()}</div>
      </div>

      <h3 style={{ marginTop: "1.5rem" }}>Totals</h3>
      <div style={{ lineHeight: "1.6" }}>
        <div><strong>Total tokens:</strong> {summary.totals.totalTokens}</div>
        <div><strong>Total rewards:</strong> {summary.totals.rewardsCount}</div>
        <div><strong>Total posts:</strong> {summary.totals.postsCount}</div>
      </div>

      <h3 style={{ marginTop: "1.5rem" }}>Recent Rewards</h3>
      {summary.recentRewards.length === 0 && <p>No rewards claimed yet.</p>}
      <ul>
        {summary.recentRewards.map(r => (
          <li key={r.id}>
            {r.tokens_awarded} tokens for post #{r.post_id} ({r.title || "untitled"})
          </li>
        ))}
      </ul>
    </>
  );
}
