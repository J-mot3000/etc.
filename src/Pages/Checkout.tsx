import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import Header from "../Components/Header";

function Checkout() {
  const { items, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated]);

  const totalCents = items.reduce((s, it) => s + it.priceCents * it.quantity, 0);

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    // mock payment delay
    setTimeout(() => {
      clearCart();
      setProcessing(false);
      navigate("/home");
      // optionally show a confirmation — the toast is available when adding items
    }, 1200);
  }

  return (
    <>
      <Header />
      <main style={{ padding: 16 }}>
        <h1>Checkout</h1>
        {items.length === 0 ? (
          <p>Your cart is empty.</p>
        ) : (
          <>
            <ul>
              {items.map((it) => (
                <li key={it.id}>
                  {it.name} — {it.quantity} × ${(it.priceCents / 100).toFixed(2)}
                </li>
              ))}
            </ul>
            <p>
              <strong>Total:</strong> ${(totalCents / 100).toFixed(2)}
            </p>

            <form onSubmit={handlePay} style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}>
              <label>
                Cardholder name
                <input required />
              </label>
              <label>
                Card number
                <input required inputMode="numeric" />
              </label>
              <label>
                Expiry
                <input required />
              </label>
              <label>
                CVC
                <input required inputMode="numeric" />
              </label>
              <button type="submit" disabled={processing}>{processing ? "Processing…" : `Pay $${(totalCents/100).toFixed(2)}`}</button>
            </form>
          </>
        )}
      </main>
    </>
  );
}

export default Checkout;
