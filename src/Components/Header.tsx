import type { ReactElement } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Header() {
    const { pathname } = useLocation();

    const navigate = useNavigate();
    const { items, lastAdded } = useCart();
    const { user, logout } = useAuth();

    const links: Array<{ to: string; label: string; icon?: ReactElement }> = [
        { to: "/home", label: "Home" },
        { to: "/products", label: "Products" },
    ];

    if (user && user.email === 'admin@etc.com') {
        links.push({ to: "/admin", label: "Admin" });
    }

    links.push({
        to: "/cart",
        label: "Cart",
        icon: (
            <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 6h15l-1.5 9h-12L4 2H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="10" cy="20" r="1" fill="currentColor" />
                <circle cx="18" cy="20" r="1" fill="currentColor" />
            </svg>
        ),
    });

    return (
        <div className="header-wrapper">
            <header>
                <div className="left-header">
                    <div className="logo">
                        <Link to="/" aria-label="Landing">
                            <img src="src/assets/etclogo.svg" alt="etc. logo" height={80} width={80} />
                        </Link>
                    </div>
                </div>
                <div className="center-header"></div>
                <div className="right-header">
                    {links.map((l) => {
                        const isActive = pathname === l.to;
                        if (l.to === "/cart") {
                            const total = items.reduce((s, it) => s + it.quantity, 0);
                            return isActive ? (
                                <span key={l.to} className="header-link current" aria-current="page" title={l.label}>
                                    {l.icon}
                                    {total > 0 && <span className="cart-badge">{total}</span>}
                                </span>
                            ) : (
                                <Link key={l.to} to={l.to} className="header-link" aria-label={l.label} title={l.label}>
                                    {l.icon}
                                    {total > 0 && <span className="cart-badge">{total}</span>}
                                </Link>
                            );
                        }

                        return isActive ? (
                            <span key={l.to} className="header-link current" aria-current="page">
                                {l.label}
                            </span>
                        ) : (
                            <Link key={l.to} to={l.to} className="header-link" aria-label={l.label}>
                                {l.label}
                            </Link>
                        );
                    })}
                </div>
                <div className="auth-area">
                    {user ? (
                        <>
                            <span className="auth-user">{user.email}</span>
                            <button
                                className="auth-button"
                                onClick={() => {
                                    logout();
                                    navigate("/");
                                }}
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="auth-button">Login</Link>
                    )}
                </div>
                {/* toast feedback */}
                {lastAdded && <div className="cart-toast">Added "{lastAdded}" to cart</div>}
            </header>
        </div>
    );
}

export default Header;