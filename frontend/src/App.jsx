import { Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Posts from "./pages/Posts.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import Profile from "./pages/Profile.jsx";
import Badges from "./pages/Badges.jsx";
import Chat from "./pages/Chat.jsx";
import { useTheme } from "./ThemeContext.jsx";
import Avatar from "./components/Avatar.jsx";
import SearchResults from "./pages/SearchResults.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import { useState } from "react";

import logo from "./assets/logo.png";


function App() {
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [globalSearch, setGlobalSearch] = useState("");
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  return (
    <div className="app-root">
      <nav className="navbar">
        <div className="nav-left" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="nav-logo">
            <img src={logo} alt="QualiChain Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ marginRight: "1rem" }}>
            <div className="nav-title">QUALICHAIN</div>
            <div style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "500", textTransform: "uppercase", letterSpacing: "1px" }}>
              Web3 Rewards Engine
            </div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "0 1rem" }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (globalSearch.trim()) {
                navigate(`/search?q=${encodeURIComponent(globalSearch.trim())}`);
              }
            }}
            style={{ position: "relative", width: "100%", maxWidth: "450px" }}
          >
            <input
              type="text"
              className="input"
              placeholder="Search posts or users..."
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              style={{
                width: "100%",
                paddingLeft: "2.5rem",
                height: "38px",
                borderRadius: "20px",
                background: "var(--bg-input)",
                border: "1px solid var(--border-subtle)"
              }}
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "0.8rem", top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </form>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
              Feed
            </span>
          </Link>
          <Link to="/badges" className="nav-link">
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>
              Badges
            </span>
          </Link>
          <Link to="/chat" className="nav-link">
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
              Chat
            </span>
          </Link>
          <button
            className="nav-link"
            onClick={toggleTheme}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem"
            }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
            )}
            <span style={{ fontSize: "0.85rem" }}>
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
          {!user && (
            <>
              <Link to="/login" className="nav-link">
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  Login
                </span>
              </Link>
              <Link to="/register" className="nav-link nav-link-primary">
                <span style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></svg>
                  Get Started
                </span>
              </Link>
            </>
          )}
          {user && (
            <div style={{ position: "relative" }}>
              <button
                className="nav-link"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer"
                }}
                onClick={() => {
                  const menu = document.getElementById("profile-menu");
                  if (menu) {
                    menu.style.display =
                      menu.style.display === "block" ? "none" : "block";
                  }
                }}
              >
                <Avatar username={user.username} avatarUrl={user.avatar_url} width="24" height="24" />
                <span>{user.username}</span>
                <span style={{ fontSize: "0.8rem" }}>▼</span>
              </button>

              {/* Dropdown */}
              <div
                id="profile-menu"
                className="profile-dropdown"
                style={{
                  display: "none",
                  position: "absolute",
                  top: "120%",
                  right: 0,
                  zIndex: 1000
                }}
              >

                <button
                  className="nav-link"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    padding: "0.5rem 0.7rem",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    window.location.href = "/profile";
                  }}
                >
                  Profile
                </button>

                <button
                  className="nav-link"
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textAlign: "left",
                    padding: "0.5rem 0.7rem",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.reload();
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          )}


        </div>
      </nav>

      <main className="main-shell">
        <div className="main-inner" style={(location.pathname === '/' || location.pathname === '/create' || location.pathname === '/search') ? {} : { gridTemplateColumns: '1fr' }}>
          {/* Left: main content */}
          <section className="panel">
            <Routes>
              <Route path="/" element={<Posts />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:id" element={<UserProfile />} />
              <Route path="/badges" element={<Badges />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/search" element={<SearchResults />} />

            </Routes>
          </section>

          {/* Right: side info */}
          {location.pathname === "/create" && (
            <aside className="panel panel-secondary">
              <h3 className="sidebar-section-title">How rewards work</h3>
              <p className="sidebar-text">
                Each post is scored using a quality model based on length, lexical
                richness, and community upvotes. The score modulates token rewards
                on the blockchain, encouraging high-quality contributions over spam.
              </p>
              <div style={{ marginTop: "0.75rem" }}>
                <h4 className="sidebar-section-title">Demo tips</h4>
                <ul className="sidebar-text" style={{ paddingLeft: "1.2rem" }}>
                  <li>Create a short vs long post.</li>
                  <li>Upvote and observe quality scores.</li>
                  <li>Claim rewards and show tx hash.</li>
                </ul>
              </div>
            </aside>
          )}

          {location.pathname === "/" && (
            <aside style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {/* Quick Actions Panel */}
              <div className="panel panel-secondary" style={{ padding: "1.5rem" }}>
                <h3 className="sidebar-section-title" style={{ marginBottom: "1rem" }}>Welcome to QualiChain</h3>
                <p className="sidebar-text" style={{ marginBottom: "1.25rem" }}>
                  Earn crypto rewards by sharing high-quality content with the community.
                </p>
                <Link to="/create" className="btn btn-primary" style={{ display: "flex", justifyContent: "center", textDecoration: "none", width: "100%" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Create Post
                  </span>
                </Link>
              </div>

              {/* Trending Topics Panel */}
              <div className="panel panel-secondary" style={{ padding: "1.5rem" }}>
                <h3 className="sidebar-section-title">Trending Topics</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1rem" }}>
                  {["#web3", "#crypto", "#quality", "#rewards", "#community", "#blockchain"].map((tag, idx) => (
                    <span key={idx} style={{
                      padding: "0.3rem 0.8rem",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      fontSize: "0.85rem",
                      color: "var(--text)",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = "var(--accent)";
                        e.currentTarget.style.color = "var(--accent)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = "var(--border-subtle)";
                        e.currentTarget.style.color = "var(--text)";
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Web3 Contracts Panel */}
              <div className="panel panel-secondary" style={{ padding: "1.5rem", border: "1px solid rgba(0, 240, 255, 0.3)", background: "var(--bg-card-hover)" }}>
                <h3 className="sidebar-section-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--accent)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                  Live on Sepolia
                </h3>
                <p className="sidebar-text" style={{ fontSize: "0.85rem", marginTop: "1rem", marginBottom: "0.5rem" }}>
                  Smart Contracts deployed explicitly on Sepolia Network for demo purposes.
                </p>
                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--text-muted)", wordBreak: "break-all", background: "var(--bg-card)", padding: "0.5rem", borderRadius: "8px" }}>
                  <strong>$BOSM Token</strong><br/>
                  0x7A5...4c2F<br/><br/>
                  <strong>Reward Distributor</strong><br/>
                  0x9B1...d8eA
                </div>
              </div>

              {/* Community Stats Panel */}
              <div className="panel panel-secondary" style={{ padding: "1.5rem" }}>
                <h3 className="sidebar-section-title">Platform Stats</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="sidebar-text">Active Members</span>
                    <span style={{ fontWeight: "600", color: "var(--text)" }}>3,421</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="sidebar-text">Tokens Rewarded</span>
                    <span style={{ fontWeight: "600", color: "var(--accent)", textShadow: "0 0 10px rgba(0,240,255,0.3)" }}>128.5k BOSM</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="sidebar-text">Posts Today</span>
                    <span style={{ fontWeight: "600", color: "var(--text)" }}>284</span>
                  </div>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
