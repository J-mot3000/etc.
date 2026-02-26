import type { Product } from "../types/Products";
import { useCart } from "../context/CartContext";

function ProductCard(props: { product: Product }) {
    const { product } = props;
    const baseCents = typeof product.priceCents === 'number' ? product.priceCents : 0;
    const saleCents = typeof product.discountPercent === 'number' ? Math.round(baseCents * (100 - product.discountPercent) / 100) : undefined;
    const price = (baseCents / 100).toFixed(2);
    const sale = typeof saleCents === 'number' ? (saleCents / 100).toFixed(2) : null;
    const { addToCart } = useCart();

    return (
        <div className="product-card" data-id={product.id}>
            {product.image && (
                // eslint-disable-next-line jsx-a11y/img-redundant-alt
                <img src={product.image} alt={product.name} className="product-image" />
            )}
            <h2>{product.name}</h2>
            <p className="product-description">{product.description}</p>
            {sale ? (
                <p className="product-price"><span style={{ textDecoration: 'line-through', color: '#888', marginRight: 8 }}>${price}</span><strong>${sale}</strong></p>
            ) : (
                <p className="product-price">${price}</p>
            )}
            <button className="translucent-button" onClick={() => addToCart(product)}>Add to cart</button>
        </div>
    );
}

export default ProductCard;