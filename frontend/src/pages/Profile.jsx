import { useEffect, useState } from "react";
import api from "../api";
import Avatar from "../components/Avatar.jsx";

export default function Profile() {
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  // Available Avatar Options
  const AVATARS = [
    "https://api.dicebear.com/9.x/bottts/svg?seed=Ares",
    "https://api.dicebear.com/9.x/bottts/svg?seed=Shadow",
    "https://api.dicebear.com/9.x/lorelei/svg?seed=Nova",
    "https://api.dicebear.com/9.x/adventurer/svg?seed=Explorer",
    "https://api.dicebear.com/9.x/notionists/svg?seed=Artist",
    "https://api.dicebear.com/9.x/pixel-art/svg?seed=Gamer",
    "https://api.dicebear.com/9.x/shapes/svg?seed=Abstract",
    "https://api.dicebear.com/9.x/fun-emoji/svg?seed=Happy"
  ];

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateAvatar = async (url) => {
    setIsUpdatingAvatar(true);
    setError("");
    try {
      await api.put(`/users/${user.id}/avatar`, { avatar_url: url });

      // Update local state summary immediately
      setSummary(prev => ({
        ...prev,
        user: { ...prev.user, avatar_url: url }
      }));

      // Update global user object to reflect changes everywhere
      const updatedUser = { ...user, avatar_url: url };
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setSuccess("Avatar updated successfully!");
      setShowAvatarModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update avatar.");
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleConnectWallet = async () => {
    setError("");
    setSuccess("");

    if (!window.ethereum) {
      setError("Please install MetaMask or a compatible Web3 browser to connect your wallet!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        const address = accounts[0];

        const res = await api.put(`/users/${user.id}/wallet`, { wallet_address: address });

        if (res.data.ok) {
          setSummary(prev => ({
            ...prev,
            user: { ...prev.user, wallet_address: address }
          }));

          const updatedUser = { ...user, wallet_address: address };
          localStorage.setItem("user", JSON.stringify(updatedUser));

          setSuccess("Wallet connected successfully!");
          setTimeout(() => setSuccess(""), 3000);
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setError("You rejected the connection request.");
      } else {
        setError(err.response?.data?.error || "Error connecting wallet. It might be used by another account.");
      }
    }
  };

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

      {success && <p className="text-success" style={{ marginBottom: "1rem" }}>{success}</p>}
      {error && <p className="text-error" style={{ marginBottom: "1rem" }}>{error}</p>}

      <div style={{
        marginTop: "1.5rem",
        lineHeight: "1.8",
        background: "var(--bg-card)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "1.5rem",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem"
      }}>
        <div style={{ position: "relative" }}>
          <Avatar username={summary?.user?.username} avatarUrl={summary?.user?.avatar_url} width="100" height="100" />
          <button
            onClick={() => setShowAvatarModal(true)}
            style={{
              position: "absolute",
              bottom: "-5px",
              right: "-5px",
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
            title="Edit Avatar"
          >
            ✏️
          </button>
        </div>
        <div>
          <div style={{ marginBottom: "0.25rem" }}><strong style={{ color: "var(--text-muted)", width: "120px", display: "inline-block" }}>Username:</strong> <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.1rem" }}>{summary?.user?.username}</span></div>
          <div style={{ marginBottom: "0.25rem" }}><strong style={{ color: "var(--text-muted)", width: "120px", display: "inline-block" }}>Email:</strong> <span style={{ color: "var(--accent)" }}>{summary?.user?.email}</span></div>
          <div style={{ marginBottom: "0.25rem", display: "flex", alignItems: "center" }}>
            <strong style={{ color: "var(--text-muted)", width: "120px", display: "inline-block" }}>Wallet:</strong>
            {summary?.user?.wallet_address ? (
              <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text)", background: "rgba(0, 240, 255, 0.15)", padding: "0.2rem 0.6rem", borderRadius: "12px", border: "1px solid rgba(0, 240, 255, 0.3)" }}>
                {String(summary.user.wallet_address).substring(0, 6)}...{String(summary.user.wallet_address).substring(summary.user.wallet_address.length - 4)}
              </span>
            ) : (
              <button
                className="btn btn-primary"
                style={{ padding: "0.2rem 0.8rem", height: "auto", fontSize: "0.85rem", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                onClick={handleConnectWallet}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
                Connect Wallet
              </button>
            )}
          </div>
          <div><strong style={{ color: "var(--text-muted)", width: "120px", display: "inline-block" }}>Joined:</strong> {new Date(summary?.user?.created_at).toLocaleDateString()}</div>
        </div>
      </div>

      <h3 style={{ marginTop: "2.5rem", fontFamily: "'Outfit', sans-serif" }}>Totals</h3>
      <div style={{
        display: "flex",
        gap: "1.5rem",
        flexWrap: "wrap",
        marginTop: "1rem"
      }}>
        <div style={{ background: "rgba(0, 240, 255, 0.1)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(0,240,255,0.2)" }}>
          <strong style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem" }}>$BOSM Tokens</strong>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", color: "var(--success)", textShadow: "0 0 10px rgba(0,255,157,0.4)" }}>{summary.totals.totalTokens}</span>
        </div>
        <div style={{ background: "rgba(112, 0, 255, 0.1)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(112,0,255,0.2)", cursor: "pointer" }} onClick={() => setShowFollowers(true)}>
          <strong style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem" }}>Followers</strong>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", color: "var(--accent)" }}>{summary.followersList?.length || 0}</span>
        </div>
        <div style={{ background: "rgba(255, 0, 85, 0.1)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,0,85,0.2)", cursor: "pointer" }} onClick={() => setShowFollowing(true)}>
          <strong style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem" }}>Following</strong>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", color: "var(--danger)" }}>{summary.followingList?.length || 0}</span>
        </div>
        <div style={{ background: "rgba(112, 0, 255, 0.1)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(112,0,255,0.2)" }}>
          <strong style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Rewards</strong>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", color: "var(--accent)" }}>{summary.totals.rewardsCount}</span>
        </div>
        <div style={{ background: "rgba(255, 0, 85, 0.1)", padding: "1rem 1.5rem", borderRadius: "var(--radius-md)", border: "1px solid rgba(255,0,85,0.2)" }}>
          <strong style={{ display: "block", color: "var(--text-muted)", fontSize: "0.9rem" }}>Total Posts</strong>
          <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.5rem", color: "var(--danger)" }}>{summary.totals.postsCount}</span>
        </div>
      </div>

  {/* Modals */}
  {(showFollowers || showFollowing) && (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(0, 0, 0, 0.6)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center"
    }}>
      <div style={{
        background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "16px",
        padding: "2rem", width: "100%", maxWidth: "400px", maxHeight: "60vh", overflowY: "auto"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0 }}>{showFollowers ? 'Followers' : 'Following'}</h3>
          <button onClick={() => { setShowFollowers(false); setShowFollowing(false); }} className="btn btn-secondary" style={{ padding: "0.2rem 0.5rem" }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {(showFollowers ? summary.followersList : summary.followingList).length === 0 && (
            <div style={{ color: "var(--text-muted)" }}>No one here yet.</div>
          )}
          {(showFollowers ? summary.followersList : summary.followingList).map(u => (
            <a href={`/user/${u.id}`} key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none", color: "var(--text)" }}>
              <Avatar username={u.username} avatarUrl={u.avatar_url} width="40" height="40" />
              <strong>{u.username}</strong>
            </a>
          ))}
        </div>
      </div>
    </div>
  )}

  <h3 style={{ marginTop: "1.5rem" }}>Badges</h3>
  {summary.badges && summary.badges.length > 0 ? (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      gap: "0.75rem",
      marginTop: "0.5rem"
    }}>
          {summary.badges.map(badge => (
            <div
              key={badge.id}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "1rem",
                background: "var(--bg-card)",
                backdropFilter: "blur(8px)",
                borderRadius: "var(--radius-md)",
                border: `1px solid ${badge.tier === 'bronze' ? '#cd7f32' :
                  badge.tier === 'silver' ? '#c0c0c0' :
                    badge.tier === 'gold' ? '#ffd700' :
                      badge.tier === 'platinum' ? '#e5e4e2' :
                        badge.tier === 'diamond' ? '#b9f2ff' :
                          '#ff6b6b'
                  }`,
                minWidth: "100px",
                transition: "transform 0.2s",
              }}
              title={`${badge.badge_name || badge.name}: ${badge.description}`}
            >
              <div style={{
                width: "60px",
                height: "60px",
                marginBottom: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {badge.imageUrl ? (
                  <img
                    src={badge.imageUrl}
                    alt={badge.badge_name || badge.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain"
                    }}
                    onError={(e) => {
                      console.error("Failed to load badge image:", badge.badge_name || badge.name);
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "block";
                    }}
                  />
                ) : null}
                <span
                  style={{
                    fontSize: "2rem",
                    display: badge.imageUrl ? "none" : "block"
                  }}
                >
                  {badge.icon}
                </span>
              </div>
              <div style={{
                fontSize: "0.75rem",
                fontWeight: "bold",
                textAlign: "center",
                color: "#e2e8f0"
              }}>
                {badge.badge_name || badge.name}
              </div>
              <div style={{
                fontSize: "0.65rem",
                color: "#94a3b8",
                marginTop: "0.25rem",
                textAlign: "center"
              }}>
                {new Date(badge.earned_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No badges earned yet. Keep contributing to earn badges!</p>
      )}

      <h3 style={{ marginTop: "1.5rem" }}>Recent Web3 Rewards</h3>
      {summary.recentRewards.length === 0 && <p>No rewards claimed yet on the blockchain.</p>}
      <ul style={{ listStyleType: "none", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {summary.recentRewards.map(r => (
          <li key={r.id} style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                <span style={{ color: "var(--success)", fontWeight: "bold" }}>+{r.tokens_awarded} $BOSM</span> for post #{r.post_id} ({r.title || "untitled"})
              </span>
            </div>
            {r.tx_hash && (
               <div style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                 Tx: 
                 <a href={`https://sepolia.etherscan.io/tx/${r.tx_hash}`} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", textDecoration: "none", fontFamily: "monospace" }}>
                   {r.tx_hash.substring(0, 20)}...
                 </a>
               </div>
            )}
          </li>
        ))}
      </ul>

      {/* Avatar Selection Modal */}
      {showAvatarModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0, 0, 0, 0.6)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--bg-card)",
            padding: "2rem",
            borderRadius: "var(--radius-lg)",
            minWidth: "400px",
            maxWidth: "600px",
            border: "1px solid var(--border-subtle)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.6)",
          }}>
            <h3 style={{ margin: "0 0 1rem" }}>Select an Avatar</h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1rem",
              marginBottom: "1.5rem"
            }}>
              {/* Default Minidenticon generation as fallback */}
              <div
                style={{
                  cursor: "pointer",
                  borderRadius: "var(--radius-md)",
                  border: summary?.user?.avatar_url === null ? "2px solid var(--accent)" : "2px solid transparent",
                  padding: "0.5rem",
                  transition: "all 0.2s"
                }}
                onClick={() => handleUpdateAvatar(null)}
              >
                <div style={{ textAlign: "center", marginBottom: "0.25rem" }}><Avatar username={summary?.user?.username} width="64" height="64" /></div>
                <div style={{ fontSize: "0.75rem", textAlign: "center", color: "var(--text-muted)" }}>Default</div>
              </div>

              {/* Upload Custom Image */}
              <div
                style={{
                  cursor: "pointer",
                  borderRadius: "var(--radius-md)",
                  border: "2px dashed var(--border-subtle)",
                  padding: "0.5rem",
                  transition: "all 0.2s",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--bg-card-hover)"
                }}
                onClick={() => document.getElementById('avatar-upload-input').click()}
              >
                <input
                  type="file"
                  id="avatar-upload-input"
                  style={{ display: "none" }}
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    setIsUpdatingAvatar(true);
                    setError("");
                    try {
                      const formData = new FormData();
                      formData.append("avatar", file);

                      const res = await api.post(`/users/${user.id}/avatar/upload`, formData);

                      const newUrl = res.data.avatar_url;
                      setSummary(prev => ({ ...prev, user: { ...prev.user, avatar_url: newUrl } }));
                      const updatedUser = { ...user, avatar_url: newUrl };
                      localStorage.setItem("user", JSON.stringify(updatedUser));

                      setSuccess("Avatar uploaded successfully!");
                      setShowAvatarModal(false);
                      setTimeout(() => setSuccess(""), 3000);
                    } catch (err) {
                      console.error(err);
                      setError("Failed to upload custom avatar.");
                    } finally {
                      setIsUpdatingAvatar(false);
                      e.target.value = null; // reset
                    }
                  }}
                  disabled={isUpdatingAvatar}
                />
                <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>📁</div>
                <div style={{ fontSize: "0.75rem", textAlign: "center", color: "var(--text)" }}>Upload File</div>
              </div>

              {/* API Avatars */}
              {AVATARS.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    cursor: "pointer",
                    borderRadius: "var(--radius-md)",
                    border: summary?.user?.avatar_url === url ? "2px solid var(--accent)" : "2px solid transparent",
                    padding: "0.5rem",
                    transition: "all 0.2s"
                  }}
                  onClick={() => handleUpdateAvatar(url)}
                >
                  <div style={{ textAlign: "center" }}>
                    <img src={url} alt={`Avatar option ${idx}`} width="64" height="64" style={{ borderRadius: "50%", background: "var(--bg-soft)" }} />
                  </div>
                </div>
              ))}
            </div>

            {error && <p className="text-error" style={{ fontSize: "0.85rem", marginTop: 0 }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAvatarModal(false)}
                disabled={isUpdatingAvatar}
                style={{ border: "1px solid var(--border-subtle)", background: "transparent" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
