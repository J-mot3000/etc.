import { useEffect, useState } from "react";
import Header from "../Components/Header";
import ProductCard from "../Components/ProductCard";
import type { Product } from "../types/Products";
import { getPublicProducts } from "../firestore";

function Products() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');

    async function load() {
        setLoading(true);
        try {
            const data = await getPublicProducts();
            setProducts(data || []);
        } catch (err) {
            console.error('Failed to load products from Firestore', err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        const handler = () => load();
        window.addEventListener('products-updated', handler as EventListener);
        return () => window.removeEventListener('products-updated', handler as EventListener);
    }, []);

    const categories = Array.from(new Set(products.map((p) => p.category || 'uncategorized'))).sort();
    const filtered = products.filter((p) => {
        const q = search.trim().toLowerCase();
        if (q) {
            const hay = `${p.name} ${p.category || ''} ${p.description || ''}`.toLowerCase();
            if (!hay.includes(q)) return false;
        }
        if (category !== 'all' && (p.category || 'uncategorized') !== category) return false;
        // price filter
        const base = typeof p.price === 'number' ? p.price : (typeof p.priceCents === 'number' ? p.priceCents / 100 : 0);
        const min = parseFloat(minPrice);
        const max = parseFloat(maxPrice);
        if (!isNaN(min) && base < min) return false;
        if (!isNaN(max) && base > max) return false;
        return true;
    });

    return (
        <>
            <Header />
            <div style={{ padding: '0 1rem' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0' }}>
                    <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, padding: '8px 10px' }} />
                    <input placeholder="Min price" type="number" step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ width: 120, padding: '8px 10px' }} />
                    <input placeholder="Max price" type="number" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ width: 120, padding: '8px 10px' }} />
                    <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ padding: '8px 10px' }}>
                        <option value="all">All categories</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>
            {loading ? (
                <p>Loading products...</p>
            ) : (
                <div className="products-grid">
                    {filtered.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            )}
        </>
    );
}

export default Products;

