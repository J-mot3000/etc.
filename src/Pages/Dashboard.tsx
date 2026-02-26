import * as React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPublicProducts, addProduct as firestoreAddProduct, updateProductInventory, deleteProduct as firestoreDeleteProduct, applyDiscount } from '../firestore';
import etcLogo from '../assets/etclogo.svg';
import AddProductCard from '../Components/AddProductCard';
import ProductCard from '../Components/ProductCard';
import type { Product } from '../types/Products';

function Dashboard() {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [adminProducts, setAdminProducts] = useState<any[]>([]);
  const [isAdminMode, setIsAdminMode] = useState(true);
  const [showHeader, setShowHeader] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventoryValues, setInventoryValues] = useState<Record<string, number>>({});
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [previewProducts, setPreviewProducts] = useState<Product[]>([]);
  const [previewSearch, setPreviewSearch] = useState('');
  const [previewCategory, setPreviewCategory] = useState('all');
  const [previewMinPrice, setPreviewMinPrice] = useState('');
  const [previewMaxPrice, setPreviewMaxPrice] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);

  async function addProduct(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const newProduct = {
        name: (name || '').trim(),
        image: (image || '').trim(),
        price: Number(price),
        priceCents: Math.round(Number(price) * 100),
        category: (category || '').trim(),
        description: (description || '').trim(),
        inventory: 0,
        rating: { stars: 0, count: 0 },
        subCategory: '',
        keywords: [],
      };

      await firestoreAddProduct(newProduct);
      setMessage('Product added');
      setName(''); setImage(''); setPrice(0); setCategory(''); setDescription('');
      await fetchProducts();
    } catch (err: any) {
      setMessage(err?.message || 'Error adding product');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  async function fetchProducts() {
    try {
      const data = await getPublicProducts();
      setAdminProducts(data);
      const map: Record<string, number> = {};
      data.forEach((p: any) => { map[p.id] = typeof p.inventory === 'number' ? p.inventory : 0; });
      setInventoryValues(map);
    } catch (err) {
      setAdminProducts([]);
    }
  }

  async function fetchPreviewProducts() {
    try {
      setPreviewLoading(true);
      const data = await getPublicProducts();
      setPreviewProducts(data || []);
    } catch (err) {
      setPreviewProducts([]);
    } finally {
      setPreviewLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
    fetchPreviewProducts();
    const handler = () => {
      fetchProducts();
      fetchPreviewProducts();
    };
    window.addEventListener('products-updated', handler as EventListener);
    return () => window.removeEventListener('products-updated', handler as EventListener);
  }, []);

  const totalInventory = adminProducts.reduce((sum, p) => sum + (typeof p.inventory === 'number' ? p.inventory : 0), 0);
  const totalInventoryValueCents = adminProducts.reduce((sum, p) => {
    const unitCents = typeof p.salePriceCents === 'number' ? p.salePriceCents : (typeof p.priceCents === 'number' ? p.priceCents : (typeof p.price === 'number' ? Math.round(p.price * 100) : 0));
    const qty = typeof p.inventory === 'number' ? p.inventory : 0;
    return sum + unitCents * qty;
  }, 0);

  const { logout, user, loading } = useAuth();

  // Redirect if not logged in or not admin
  if (!loading && (!user || !user.isAdmin)) {
    return <div style={{ padding: '20px' }}><p>Unauthorized. Please log in as an admin.</p></div>;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}><p>Loading...</p></div>;
  }

  return (
    <>
      {showHeader && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 150, background: '#ffeaef', border: '1px solid #ddd', padding: 12, borderRadius: 0, overflow: 'auto', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', gap: 12 }}>
            <div style={{ flex: '0 0 auto' }}>
              <h2 style={{ margin: 0 }}>{isAdminMode ? 'Admin Panel' : 'Store Preview'}</h2>
              <div style={{ fontSize: 13, color: '#555' }}>Total stock: <strong>{totalInventory}</strong> items — Inventory value: <strong>${(totalInventoryValueCents/100).toFixed(2)}</strong></div>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <img src={etcLogo} alt="Logo" style={{ height: 120, objectFit: 'contain' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setIsAdminMode((s) => !s)}
                style={{ padding: '6px 10px', borderRadius: 6 }}
              >
                {isAdminMode ? 'Switch to User View' : 'Switch to Admin View'}
              </button>
              <button onClick={() => { logout(); window.location.href = '/'; }} style={{ padding: '6px 10px', borderRadius: 6 }}>Logout</button>
            </div>
          </div>
        </div>
      )}
      <button
        onClick={() => setShowHeader((s) => !s)}
        style={{
          position: 'fixed',
          top: 10,
          right: 20,
          padding: '2px',
          borderRadius: 12,
          zIndex: 101,
          background: showHeader ? '#4CAF50' : '#ccc',
          border: 'none',
          width: 44,
          height: 24,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: showHeader ? 'flex-end' : 'flex-start',
          transition: 'background 0.2s ease'
        }}
        aria-label={showHeader ? 'Hide header' : 'Show header'}
      >
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white' }} />
      </button>
      <div style={{ padding: showHeader ? '170px 20px 20px 20px' : '20px' }}>
        {isAdminMode ? (
          <>
            <section style={{ marginTop: 20 }}>
              <h2>Add Product</h2>
              <AddProductCard
                onSubmit={addProduct}
                name={name}
                setName={setName}
                image={image}
                setImage={setImage}
                price={price}
                setPrice={setPrice}
                onRefresh={() => { fetchProducts(); }}
                isSubmitting={isSubmitting}
              />
              {message && <div style={{ marginTop: 8 }}>{message}</div>}
            </section>

            <section style={{ marginTop: 24 }}>
              <h2>Inventory</h2>
              <div style={{ marginTop: 12, marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: 1, padding: '8px 10px' }} />
                <input placeholder="Min price" type="number" step="0.01" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} style={{ width: 120, padding: '8px 10px' }} />
                <input placeholder="Max price" type="number" step="0.01" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} style={{ width: 120, padding: '8px 10px' }} />
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '8px 10px' }}>
                  <option value="all">All categories</option>
                  {Array.from(new Set(adminProducts.map((p) => p.category || 'uncategorized'))).sort().map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              {adminProducts.length === 0 ? (
                <p>No products available</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: 8 }}>Product</th>
                      <th style={{ padding: 8 }}>Inventory</th>
                      <th style={{ padding: 8 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminProducts.filter((p) => {
                      const q = search.trim().toLowerCase();
                      if (q) {
                        const hay = `${p.name} ${p.category || ''} ${p.description || ''}`.toLowerCase();
                        if (!hay.includes(q)) return false;
                      }
                      if (categoryFilter !== 'all' && (p.category || 'uncategorized') !== categoryFilter) return false;
                      if (minPrice !== '') {
                        const minCents = Math.round(parseFloat(minPrice || '0') * 100);
                        const unitCents = typeof p.salePriceCents === 'number' ? p.salePriceCents : (typeof p.priceCents === 'number' ? p.priceCents : (typeof p.price === 'number' ? Math.round(p.price * 100) : 0));
                        if (unitCents < minCents) return false;
                      }
                      if (maxPrice !== '') {
                        const maxCents = Math.round(parseFloat(maxPrice || '0') * 100);
                        const unitCents = typeof p.salePriceCents === 'number' ? p.salePriceCents : (typeof p.priceCents === 'number' ? p.priceCents : (typeof p.price === 'number' ? Math.round(p.price * 100) : 0));
                        if (unitCents > maxCents) return false;
                      }
                      return true;
                    }).map((p) => (
                      <tr key={p.id} style={{ borderTop: '1px solid #eee' }}>
                        <td style={{ padding: 8 }}>
                          <div style={{ fontWeight: 600 }}>{p.name}</div>
                          <div style={{ fontSize: 13, color: '#666' }}>
                            {(() => {
                              const baseCents = typeof p.price === 'number' ? Math.round(p.price * 100) : (typeof p.priceCents === 'number' ? p.priceCents : 0);
                              const saleCents = typeof p.salePriceCents === 'number' ? p.salePriceCents : (typeof p.discountPercent === 'number' ? Math.round(baseCents * (100 - p.discountPercent) / 100) : undefined);
                              if (typeof saleCents === 'number' && saleCents < baseCents) {
                                return (<span><span style={{ textDecoration: 'line-through', color: '#888', marginRight: 8 }}>${(baseCents/100).toFixed(2)}</span><strong>${(saleCents/100).toFixed(2)}</strong></span>);
                              }
                              return <span>${(baseCents/100).toFixed(2)}</span>;
                            })()}
                          </div>
                        </td>
                        <td style={{ padding: 8 }}>
                          <input type="number" value={inventoryValues[p.id] ?? 0} onChange={(e) => setInventoryValues((s) => ({ ...s, [p.id]: Number(e.target.value) }))} style={{ width: 80 }} />
                        </td>
                        <td style={{ padding: 8 }}>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-success btn-sm" onClick={async () => {
                              const v = Number(inventoryValues[p.id] ?? 0);
                              try {
                                await updateProductInventory(p.id, v);
                                await fetchProducts();
                                setMessage('Inventory updated');
                                setTimeout(() => setMessage(null), 3000);
                              } catch (err) {
                                // eslint-disable-next-line no-console
                                console.error(err);
                                setMessage((err as any)?.message || 'Update failed');
                                setTimeout(() => setMessage(null), 3000);
                              }
                            }}>Update</button>
                            <button className="btn btn-danger btn-sm" onClick={async () => {
                              try {
                                await firestoreDeleteProduct(p.id);
                                await fetchProducts();
                                setMessage('Product deleted');
                                setTimeout(() => setMessage(null), 3000);
                              } catch (err) {
                                // eslint-disable-next-line no-console
                                console.error(err);
                                setMessage((err as any)?.message || 'Delete failed');
                                setTimeout(() => setMessage(null), 3000);
                              }
                            }}>Delete</button>
                          </div>
                        </td>
                        <td style={{ padding: 8 }}>
                          <input type="checkbox" checked={!!selectedIds[p.id]} onChange={(e) => setSelectedIds((s) => ({ ...s, [p.id]: e.target.checked }))} title={`Select product ${p.name}`} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} style={{ width: 80 }} placeholder="Discount %" title="Discount percent" />
                <button onClick={async () => {
                  const ids = Object.entries(selectedIds).filter(([,v]) => v).map(([k]) => k);
                  if (ids.length === 0) return setMessage('Select at least one product');
                  try {
                    await applyDiscount(ids, discountPercent);
                    await fetchProducts();
                    window.dispatchEvent(new CustomEvent('products-updated'));
                    setMessage('Discount applied');
                    setSelectedIds({});
                  } catch (err) {
                    // eslint-disable-next-line no-console
                    console.error(err);
                    setMessage('Failed to apply discount');
                  } finally {
                    setTimeout(() => setMessage(null), 3000);
                  }
                }}>Apply discount to selected</button>
              </div>
            </section>
          </>
        ) : (
          <>
            <div style={{ padding: '0 1rem' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', margin: '12px 0' }}>
                <input placeholder="Search products..." value={previewSearch} onChange={(e) => setPreviewSearch(e.target.value)} style={{ flex: 1, padding: '8px 10px' }} />
                <input placeholder="Min price" type="number" step="0.01" value={previewMinPrice} onChange={(e) => setPreviewMinPrice(e.target.value)} style={{ width: 120, padding: '8px 10px' }} />
                <input placeholder="Max price" type="number" step="0.01" value={previewMaxPrice} onChange={(e) => setPreviewMaxPrice(e.target.value)} style={{ width: 120, padding: '8px 10px' }} />
                <select value={previewCategory} onChange={(e) => setPreviewCategory(e.target.value)} style={{ padding: '8px 10px' }}>
                  <option value="all">All categories</option>
                  {Array.from(new Set(previewProducts.map((p) => p.category || 'uncategorized'))).sort().map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            {previewLoading ? (
              <p style={{ padding: '1rem' }}>Loading products...</p>
            ) : previewProducts.length === 0 ? (
              <p style={{ padding: '1rem', color: '#666' }}>No products available. Add some products in Admin mode.</p>
            ) : (
              <div className="products-grid">
                {previewProducts.filter((p) => {
                  const q = previewSearch.trim().toLowerCase();
                  if (q) {
                    const hay = `${p.name} ${p.category || ''} ${p.description || ''}`.toLowerCase();
                    if (!hay.includes(q)) return false;
                  }
                  if (previewCategory !== 'all' && (p.category || 'uncategorized') !== previewCategory) return false;
                  const base = typeof p.price === 'number' ? p.price : (typeof p.priceCents === 'number' ? p.priceCents / 100 : 0);
                  const min = parseFloat(previewMinPrice);
                  const max = parseFloat(previewMaxPrice);
                  if (!isNaN(min) && base < min) return false;
                  if (!isNaN(max) && base > max) return false;
                  return true;
                }).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default Dashboard;
