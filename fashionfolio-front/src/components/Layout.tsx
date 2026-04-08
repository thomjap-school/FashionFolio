import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import logo from "./logo/Fulllogo.png";

type Props = {
  children: ReactNode;
};

export function Layout({ children }: Props) {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"));
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".app-header")) setMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [menuOpen]);

  function handleLogout() {
    localStorage.removeItem("token");
    setLoggedIn(false);
    setMenuOpen(false);
    navigate("/login");
  }

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo">
          <NavLink to="/chat" onClick={closeMenu}>
            <img src={logo} alt="FashionFolio" style={{ width: "60%", height: "auto" }} />
          </NavLink>
        </div>

        {/* Desktop nav */}
        <nav className="nav">
          <NavLink to="/feed">Feed</NavLink>
          <NavLink to="/wardrobe">Wardrobe</NavLink>
          <NavLink to="/explore">Explore</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/friends">Friends</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>

        {/* Desktop auth */}
        <div className="auth-links">
          <NavLink to="/premium" className="premium-link">Premium</NavLink>
          {loggedIn ? (
            <>
              <span className="status-pill">Logged</span>
              <button className="link-button" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register">Sign up</NavLink>
            </>
          )}
        </div>

        {/* Hamburger button*/}
        <button
          className={`hamburger${menuOpen ? " open" : ""}`}
          type="button"
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="mobile-menu">
          <nav className="mobile-nav">
            <NavLink to="/feed" onClick={closeMenu}>📱Feed</NavLink>
            <NavLink to="/wardrobe" onClick={closeMenu}>👕Wardrobe</NavLink>
            <NavLink to="/explore" onClick={closeMenu}>🔍Explore</NavLink>
            <NavLink to="/chat" onClick={closeMenu}>💬Chat</NavLink>
            <NavLink to="/friends" onClick={closeMenu}>👥Friends</NavLink>
            <NavLink to="/profile" onClick={closeMenu}>👤Profile</NavLink>
          </nav>
          <div className="mobile-auth">
            <NavLink to="/premium" className="premium-link" onClick={closeMenu}>👑Premium</NavLink>
            {loggedIn ? (
              <>
                <span className="status-pill">🟢Logged in</span>
                <button className="link-button" type="button" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" onClick={closeMenu}>🔑Login</NavLink>
                <NavLink to="/register" onClick={closeMenu}>➡️Sign up</NavLink>
              </>
            )}
          </div>
        </div>
      )}

      <main className="app-main">{children}</main>
    </div>
  );
}