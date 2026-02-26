import Header from "../Components/Header";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Landing() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login(email, password);
            navigate("/home");
        } catch (err) {
            setError("Failed to sign in");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <Header />
            <main style={{ padding: 16 }}>
                <h1>Welcome to etc.</h1>
                <p>Sign in to continue shopping.</p>

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
                    <label>
                        Email
                        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
                    </label>

                    <label>
                        Password
                        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
                    </label>

                    {error && <div style={{ color: "red" }}>{error}</div>}

                    <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Sign in"}</button>
                </form>
            </main>
        </>
    );
}

export default Landing;