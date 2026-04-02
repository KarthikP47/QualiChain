import { useEffect, useState, useRef } from "react";
import api from "../api";

export default function Badges() {
  const [badgeData, setBadgeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;
  const userId = user?.id;

  useEffect(() => {
    mountedRef.current = true;

    const fetchBadges = async () => {
      try {
        setLoading(true);
        setError("");
        setBadgeData(null); // Clear previous data

        if (userId) {
          const res = await api.get(`/badges/${userId}/status`);
          if (mountedRef.current) {
            console.log("Badge data received:", res.data);
            console.log("First badge imageUrl:", res.data?.badges?.[0]?.imageUrl?.substring(0, 100));
            setBadgeData(res.data);
          }
        } else {
          // If not logged in, just get all badges
          const res = await api.get("/badges");
          if (mountedRef.current) {
            console.log("All badges received:", res.data);
            console.log("First badge imageUrl:", res.data?.[0]?.imageUrl?.substring(0, 100));
            const badgesWithStatus = (res.data || []).map(badge => ({
              ...badge,
              earned: false
            }));
            // Sort so earned are first, then by requirement value
            badgesWithStatus.sort((a, b) => {
              if (a.earned && !b.earned) return -1;
              if (!a.earned && b.earned) return 1;
              return a.requirement_value - b.requirement_value;
            });

            setBadgeData({
              badges: badgesWithStatus,
              grouped: badgesWithStatus.reduce((acc, badge) => {
                if (!acc[badge.category]) {
                  acc[badge.category] = [];
                }
                acc[badge.category].push(badge);
                return acc;
              }, {}),
              stats: {
                total: badgesWithStatus.length,
                earned: 0,
                remaining: badgesWithStatus.length
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching badges:", err);
        if (mountedRef.current) {
          setError(err.response?.data?.error || "Failed to load badges");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };

    fetchBadges();

    return () => {
      mountedRef.current = false;
    };
  }, [userId]);

  if (loading) {
    return (
      <>
        <h2 className="page-title">Badges</h2>
        <p className="page-subtitle">Loading badges…</p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <h2 className="page-title">Badges</h2>
        <p className="page-subtitle" style={{ color: "var(--danger)" }}>{error}</p>
      </>
    );
  }

  const categoryNames = {
    upvotes: "Upvote Milestones",
    posts: "Post Count",
    rewards: "Reward Count",
    tokens: "Token Collection",
    quality: "Quality Achievements",
    special: "Special Badges"
  };

  const tierColors = {
    bronze: "#cd7f32",
    silver: "#c0c0c0",
    gold: "#ffd700",
    platinum: "#e5e4e2",
    diamond: "#b9f2ff",
    legendary: "#ff6b6b"
  };

  return (
    <>
      <h2 className="page-title">Badge Collection</h2>
      <p className="page-subtitle">
        Earn badges by contributing quality content and engaging with the community
      </p>

      {user && badgeData?.stats && (
        <div style={{
          marginTop: "1rem",
          padding: "1.5rem",
          background: "var(--bg-card)",
          backdropFilter: "blur(12px)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          boxShadow: "var(--shadow-md)",
          display: "flex",
          gap: "2rem",
          flexWrap: "wrap",
          fontFamily: "'Outfit', sans-serif",
          fontSize: "1.05rem"
        }}>
          <div>
            <strong style={{ color: "var(--text-muted)" }}>Total Badges:</strong> {badgeData.stats.total}
          </div>
          <div>
            <strong style={{ color: "var(--text-muted)" }}>Earned:</strong> <span style={{ color: "var(--success)", textShadow: "0 0 10px rgba(0,255,157,0.4)" }}>{badgeData.stats.earned}</span>
          </div>
          <div>
            <strong style={{ color: "var(--text-muted)" }}>Remaining:</strong> <span style={{ color: "var(--text-dim)" }}>{badgeData.stats.remaining}</span>
          </div>
          <div>
            <strong style={{ color: "var(--text-muted)" }}>Progress:</strong>{" "}
            <span style={{ color: "var(--accent)" }}>
              {Math.round((badgeData.stats.earned / badgeData.stats.total) * 100)}%
            </span>
          </div>
        </div>
      )}

      {!user && (
        <p style={{ marginTop: "1rem", color: "var(--danger)" }}>
          Login to see which badges you've earned!
        </p>
      )}

      {badgeData && badgeData.grouped && Object.keys(badgeData.grouped).length > 0 ? (
        Object.entries(badgeData.grouped).map(([category, badges]) => (
          <div key={category} style={{ marginTop: "2rem" }}>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: "bold",
              marginBottom: "1rem",
              color: "var(--text)"
            }}>
              {categoryNames[category] || category}
            </h3>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem"
            }}>
              {badges && badges.length > 0 ? badges.map(badge => (
                <div
                  key={badge.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "1.5rem 1rem",
                    background: badge.earned
                      ? "var(--bg-card)"
                      : "rgba(17, 20, 36, 0.3)",
                    backdropFilter: "blur(8px)",
                    borderRadius: "var(--radius-md)",
                    border: `1px solid ${badge.earned ? "var(--border-visible)" : "var(--border-subtle)"}`,
                    boxShadow: badge.earned ? "var(--shadow-sm)" : "none",
                    opacity: badge.earned ? 1 : 0.5,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative"
                  }}
                  title={`${badge.badge_name || badge.name}: ${badge.description}`}
                  onMouseEnter={(e) => {
                    if (badge.earned) {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "var(--shadow-md), 0 0 15px var(--accent-soft)";
                      e.currentTarget.style.borderColor = "var(--accent)";
                    } else {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.opacity = "0.8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = badge.earned ? "var(--shadow-sm)" : "none";
                    e.currentTarget.style.borderColor = badge.earned ? "var(--border-visible)" : "var(--border-subtle)";
                    e.currentTarget.style.opacity = badge.earned ? "1" : "0.5";
                  }}
                >
                  <div style={{
                    width: "80px",
                    height: "80px",
                    marginBottom: "0.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    filter: badge.earned ? "none" : "grayscale(100%) brightness(0.5)",
                    opacity: badge.earned ? 1 : 0.5,
                    transition: "all 0.3s ease"
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
                          console.error("Failed to load badge image:", badge.badge_name || badge.name, badge.imageUrl?.substring(0, 50));
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "block";
                        }}
                      />
                    ) : null}
                    <span
                      style={{
                        fontSize: "3rem",
                        display: badge.imageUrl ? "none" : "block"
                      }}
                    >
                      {badge.icon}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    fontWeight: "bold",
                    textAlign: "center",
                    color: badge.earned ? "var(--text)" : "var(--text-dim)",
                    marginBottom: "0.25rem",
                    opacity: badge.earned ? 1 : 0.6
                  }}>
                    {badge.badge_name || badge.name}
                  </div>
                  <div style={{
                    fontSize: "0.7rem",
                    color: badge.earned ? "var(--text-muted)" : "var(--text-dim)",
                    textAlign: "center",
                    marginBottom: "0.5rem",
                    opacity: badge.earned ? 1 : 0.5
                  }}>
                    {badge.description}
                  </div>
                  <div style={{
                    fontSize: "0.65rem",
                    padding: "0.25rem 0.5rem",
                    background: badge.earned
                      ? tierColors[badge.tier] || "var(--success)"
                      : "rgba(100, 100, 100, 0.2)",
                    borderRadius: "5px",
                    color: badge.earned ? "#000" : "var(--text-dim)",
                    fontWeight: "bold",
                    textTransform: "capitalize",
                    opacity: badge.earned ? 1 : 0.5
                  }}>
                    {badge.tier}
                  </div>
                  <div style={{
                    fontSize: "0.65rem",
                    color: badge.earned ? "var(--text-muted)" : "var(--text-dim)",
                    marginTop: "0.5rem",
                    textAlign: "center",
                    opacity: badge.earned ? 1 : 0.5
                  }}>
                    Requires: {badge.requirement_value}
                    {category === "upvotes" && " upvotes"}
                    {category === "posts" && " posts"}
                    {category === "rewards" && " rewards"}
                    {category === "tokens" && " tokens"}
                    {category === "quality" && "+ quality score"}
                    {category === "special" && (badge.badge_key === "veteran" ? " days" : " users")}
                  </div>
                  {badge.earned && badge.earned_at && (
                    <div style={{
                      fontSize: "0.6rem",
                      color: "var(--success)",
                      marginTop: "0.25rem",
                      fontWeight: "bold"
                    }}>
                      ✓ Earned: {new Date(badge.earned_at).toLocaleDateString()}
                    </div>
                  )}
                  {!badge.earned && (
                    <div style={{
                      fontSize: "0.6rem",
                      color: "var(--text-dim)",
                      marginTop: "0.25rem",
                      opacity: 0.5
                    }}>
                      Not earned yet
                    </div>
                  )}
                </div>
              )) : (
                <p style={{ color: "var(--text-muted)" }}>No badges in this category.</p>
              )}
            </div>
          </div>
        ))
      ) : !loading && badgeData && (
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
          No badges found.
        </p>
      )}

      {!loading && !error && !badgeData && (
        <p style={{ marginTop: "1rem", color: "var(--text-muted)" }}>
          No badges available.
        </p>
      )}
    </>
  );
}
