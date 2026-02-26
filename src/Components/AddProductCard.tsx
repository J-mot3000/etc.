import * as React from 'react';

interface AddProductCardProps {
  onSubmit: (e: React.FormEvent) => void;
  name: string;
  setName: (value: string) => void;
  image: string;
  setImage: (value: string) => void;
  price: number;
  setPrice: (value: number) => void;
  onRefresh: () => void;
  isSubmitting: boolean;
}

function AddProductCard({
  onSubmit,
  name,
  setName,
  image,
  setImage,
  price,
  setPrice,
  onRefresh,
  isSubmitting,
}: AddProductCardProps) {
  const [priceInput, setPriceInput] = React.useState<string>('');

  React.useEffect(() => {
    if (price === 0) {
      setPriceInput('');
    } else if (price && priceInput === '') {
      setPriceInput(String(price));
    }
  }, [price]);

  const normalizePriceInput = (raw: string) => {
    if (raw === '') return '';
    if (raw.startsWith('0.')) return raw;
    return raw.replace(/^0+(?=\d)/, '');
  };

  return (
    <div className="card shadow-sm mx-auto mt-4" style={{ maxWidth: 400 }}>
      <div className="card-body">
        <h3 className="card-title text-center mb-4 text-primary fw-bold">✨ Add Product</h3>
        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="productName">Product Name</label>
            <input
              id="productName"
              className="form-control"
              placeholder="Product Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="productImage">Image URL</label>
            <input
              id="productImage"
              className="form-control"
              placeholder="Image URL"
              value={image}
              onChange={(e) => setImage(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="productPrice">Price</label>
            <input
              id="productPrice"
              className="form-control"
              placeholder="Price"
              type="text"
              inputMode="decimal"
              pattern="\\d*(\\.\\d{0,2})?"
              value={priceInput}
              onChange={(e) => {
                let raw = e.target.value;
                if (!/^\d*(\.\d{0,2})?$/.test(raw) && raw !== '') return;
                raw = normalizePriceInput(raw);
                setPriceInput(raw);
                setPrice(raw === '' ? 0 : Number(raw));
              }}
              required
            />
          </div>
          <div className="d-flex gap-2 justify-content-center mt-3">
            <button
              type="submit"
              className="btn btn-primary fw-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : '➕ Add'}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary fw-semibold"
              onClick={onRefresh}
            >
              🔄 Refresh
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddProductCard;
