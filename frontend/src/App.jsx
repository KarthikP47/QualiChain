import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Posts from "./pages/Posts.jsx";
import CreatePost from "./pages/CreatePost.jsx";
import Profile from "./pages/Profile.jsx";


function App() {
  const userJson = localStorage.getItem("user");
  const user = userJson ? JSON.parse(userJson) : null;

  return (
    <div className="app-root">
      <nav className="navbar">
        <div className="nav-left">
          <div className="nav-logo" />
          <div>
            <div className="nav-title">QualiChain</div>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              Quality-aware Blockchain Rewards 
            </div>
          </div>
        </div>
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Feed
          </Link>
          <Link to="/create" className="nav-link">
            Create Post
          </Link>
          {!user && (
            <>
              <Link to="/login" className="nav-link">
                Login
              </Link>
              <Link to="/register" className="nav-link nav-link-primary">
                Get Started
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
      <span>{user.username}</span>
      <span style={{ fontSize: "0.8rem" }}>▼</span>
    </button>

    {/* Dropdown */}
    <div
      id="profile-menu"
      style={{
        display: "none",
        position: "absolute",
        top: "120%",
        right: 0,
        background: "rgba(15, 23, 42, 0.98)",
        borderRadius: "10px",
        padding: "0.4rem",
        minWidth: "130px",
        border: "1px solid rgba(120,120,120,0.4)"
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
        <div className="main-inner">
          {/* Left: main content */}
          <section className="panel">
            <Routes>
              <Route path="/" element={<Posts />} />
              <Route path="/create" element={<CreatePost />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />

            </Routes>
          </section>

          {/* Right: side info */}
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
        </div>
      </main>
    </div>
  );
}

export default App;
