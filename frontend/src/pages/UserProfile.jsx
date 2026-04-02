import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api";
import Avatar from "../components/Avatar";

export default function UserProfile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  const userJson = localStorage.getItem("user");
  const currentUser = userJson ? JSON.parse(userJson) : null;

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/users/${id}/public_profile`, {
        params: { caller_id: currentUser?.id }
      });
      setProfile(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load user profile");
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      alert("Please login to follow users.");
      return;
    }
    
    try {
      const res = await api.post(`/users/${id}/follow`, {
        follower_id: currentUser.id
      });
      
      setProfile(prev => ({
        ...prev,
        isFollowing: res.data.following,
        followersCount: prev.followersCount + (res.data.following ? 1 : -1)
      }));
    } catch (err) {
      console.error(err);
      alert("Failed to toggle follow status");
    }
  };

  if (loading) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Loading profile...</div>;
  if (error || !profile) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--error-color)" }}>{error || "Profile not found"}</div>;

  return (
    <div style={{ paddingBottom: "2rem" }}>
      <div className="panel" style={{ marginBottom: "2rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <Avatar username={profile.user.username} avatarUrl={profile.user.avatar_url} width="100" height="100" style={{ marginBottom: "1rem" }} />
        <h2 style={{ fontSize: "2rem", margin: "0 0 0.5rem 0" }}>{profile.user.username}</h2>
        
        <div style={{ display: "flex", gap: "2rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
          <div style={{ cursor: "pointer" }} onClick={() => setShowFollowers(true)}>
            <strong style={{ color: "var(--text)", fontSize: "1.2rem" }}>{profile.followersCount}</strong> Followers
          </div>
          <div style={{ cursor: "pointer" }} onClick={() => setShowFollowing(true)}>
            <strong style={{ color: "var(--text)", fontSize: "1.2rem" }}>{profile.followingCount}</strong> Following
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
                {(showFollowers ? profile.followersList : profile.followingList).length === 0 && (
                  <div style={{ color: "var(--text-muted)" }}>No one here yet.</div>
                )}
                {(showFollowers ? profile.followersList : profile.followingList).map(u => (
                  <Link to={`/user/${u.id}`} key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", textDecoration: "none", color: "var(--text)" }} onClick={() => { setShowFollowers(false); setShowFollowing(false); }}>
                    <Avatar username={u.username} avatarUrl={u.avatar_url} width="40" height="40" />
                    <strong>{u.username}</strong>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentUser && String(currentUser.id) !== String(profile.user.id) && (
          <button 
            className={`btn ${profile.isFollowing ? 'btn-secondary' : 'btn-primary'}`} 
            onClick={handleFollowToggle}
            style={{ minWidth: "120px" }}
          >
            {profile.isFollowing ? "Unfollow" : "Follow"}
          </button>
        )}
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <h3 className="sidebar-section-title">Badges</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {profile.badges && profile.badges.length > 0 ? profile.badges.map(b => (
            <div key={b.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
              {b.imageUrl ? <img src={b.imageUrl} alt={b.badge_name} style={{ width: "60px", height: "60px" }} /> : <div style={{ fontSize: "2.5rem" }}>{b.icon}</div>}
              <div style={{ fontSize: "0.75rem", textAlign: "center", marginTop: "0.25rem", color: "var(--text)" }}>{b.badge_name}</div>
            </div>
          )) : <div style={{ color: "var(--text-muted)" }}>No badges earned yet.</div>}
        </div>
      </div>

      <div>
        <h3 className="sidebar-section-title">Posts</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {profile.posts && profile.posts.length > 0 ? profile.posts.map(post => (
            <div key={post.id} className="panel" style={{ background: "var(--bg-card)" }}>
              <h3 style={{ margin: "0 0 0.5rem 0", color: "var(--text)" }}>{post.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", margin: "0 0 1rem 0", whiteSpace: "pre-wrap" }}>
                {post.excerpt || post.body}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--text-dim)" }}>
                <div>👍 {post.upvotes} &nbsp; 👎 {post.downvotes} &nbsp; 📈 Score: {post.quality_score}</div>
                <div>{new Date(post.created_at).toLocaleDateString()}</div>
              </div>
            </div>
          )) : <div style={{ color: "var(--text-muted)" }}>No posts yet.</div>}
        </div>
      </div>
    </div>
  );
}
