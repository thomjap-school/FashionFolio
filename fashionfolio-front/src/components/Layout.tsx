import { ReactNode, useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

type Props = {
  children: ReactNode;
};

export function Layout({ children }: Props) {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("token"));
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    setLoggedIn(false);
    navigate("/login");
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="logo"><Image src="/logo/Fulllogo.png" alt="FashionFolio" /></div>
        <nav className="nav">
          <NavLink to="/feed">Feed</NavLink>
          <NavLink to="/wardrobe">Wardrobe</NavLink>
          <NavLink to="/explore">Explore</NavLink>
          <NavLink to="/chat">Chat</NavLink>
          <NavLink to="/friends">Friends</NavLink>
          <NavLink to="/profile">Profile</NavLink>
        </nav>
        <div className="auth-links">
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
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
