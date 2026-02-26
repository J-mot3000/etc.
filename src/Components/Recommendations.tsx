import { useEffect, useState } from "react";
import type { Product } from "../types/Products";
import ProductCard from "./ProductCard";
import { useCart } from "../context/CartContext";

function Recommendations() {
  const [products, setProducts] = useState<Product[]>([]);
  const { items } = useCart();

  useEffect(() => {
    let mounted = true;
    fetch("https://kolzsticks.github.io/Free-Ecommerce-Products-Api/main/products.json")
      .then((r) => r.json())
      .then((data: Product[]) => {
        if (!mounted) return;
        setProducts(data);
      })
      .catch(() => {})
      .finally(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  // build recommendations: prefer items from same categories in cart
  const cartIds = new Set(items.map((i) => i.id));
  const cartCategories = new Set(items.map((i) => i.category));

  const recommended = products
    .filter((p) => !cartIds.has(p.id))
    .sort((a, b) => {
      const aScore = cartCategories.has(a.category) ? 1 : 0;
      const bScore = cartCategories.has(b.category) ? 1 : 0;
      if (aScore !== bScore) return bScore - aScore;
      return b.rating.stars === b.rating.stars ? b.rating.stars - a.rating.stars : 0;
    })
    .slice(0, 5);

  if (recommended.length === 0) return null;

  return (
    <section className="recommendations">
      <h2>Recommended for you</h2>
      <div className="products-grid">
        {recommended.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default Recommendations;
