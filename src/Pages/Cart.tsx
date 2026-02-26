import Header from "../Components/Header";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

function Cart() {
    const { items, removeFromCart, clearCart } = useCart();

    return (
        <>
            <Header />
            <h1>Cart</h1>
            {items.length === 0 ? (
                <p>Your cart is empty.</p>
            ) : (
                <>
                    <ul>
                        {items.map((it) => (
                            <li key={it.id}>
                                <strong>{it.name}</strong> — {it.quantity} × ${(it.priceCents / 100).toFixed(2)}
                                <button onClick={() => removeFromCart(it.id)}>Remove</button>
                            </li>
                        ))}
                    </ul>
                                        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                            <Link to="/checkout"><button>Proceed to checkout</button></Link>
                                            <button onClick={() => clearCart()}>Clear cart</button>
                                        </div>
                </>
            )}
        </>
    );
}

export default Cart;