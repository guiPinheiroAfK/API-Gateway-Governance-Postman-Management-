import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 8082;

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  sku: string;
  createdAt: string;
}

const products: Product[] = [
  { id: '1', name: 'Mechanical Keyboard Pro', description: 'Tactile switches, RGB backlight', price: 299.99, category: 'electronics', stock: 50, sku: 'KB-MEC-001', createdAt: '2024-01-10T08:00:00Z' },
  { id: '2', name: 'Ultrawide Monitor 34"', description: '3440x1440, 144Hz, IPS panel', price: 849.99, category: 'electronics', stock: 20, sku: 'MN-UW-034', createdAt: '2024-02-14T10:30:00Z' },
  { id: '3', name: 'Ergonomic Chair', description: 'Lumbar support, adjustable armrests', price: 599.00, category: 'furniture', stock: 35, sku: 'CH-ERG-001', createdAt: '2024-03-01T12:00:00Z' },
  { id: '4', name: 'Standing Desk 160cm', description: 'Electric height adjustment, memory presets', price: 749.00, category: 'furniture', stock: 15, sku: 'DK-STD-160', createdAt: '2024-03-20T09:00:00Z' },
  { id: '5', name: 'Noise-Cancelling Headphones', description: 'ANC, 30h battery, USB-C', price: 399.00, category: 'electronics', stock: 100, sku: 'HP-ANC-001', createdAt: '2024-04-12T15:00:00Z' },
];

app.get('/health', (_req, res: Response) => {
  res.json({ status: 'healthy', service: 'products-service', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/products', (req: Request, res: Response) => {
  const { category, minPrice, maxPrice, page, limit } = req.query;
  let result = [...products];

  if (category) result = result.filter((p) => p.category === category);
  if (minPrice) result = result.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice));

  const pageNum = Number(page ?? 1);
  const limitNum = Number(limit ?? 10);
  const start = (pageNum - 1) * limitNum;
  const paginated = result.slice(start, start + limitNum);

  // v2 enriched response — HAL-style _links added by gateway versioning header
  const isV2 = (req.headers['x-api-version'] as string) === 'v2';
  if (isV2) {
    res.json({
      data: paginated,
      pagination: { page: pageNum, limit: limitNum, total: result.length, pages: Math.ceil(result.length / limitNum) },
      _links: {
        self: { href: `/api/v2/products?page=${pageNum}&limit=${limitNum}` },
        next: pageNum * limitNum < result.length ? { href: `/api/v2/products?page=${pageNum + 1}&limit=${limitNum}` } : null,
      },
    });
    return;
  }

  res.json({ data: paginated, total: result.length });
});

app.get('/products/:id', (req: Request, res: Response) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ error: 'Product not found', id: req.params.id });
    return;
  }
  res.json({ data: product });
});

app.post('/products', (req: Request, res: Response) => {
  const { name, description, price, category, stock, sku } = req.body as Omit<Product, 'id' | 'createdAt'>;
  if (!name || !price || !sku) {
    res.status(400).json({ error: 'Fields "name", "price" and "sku" are required' });
    return;
  }

  const newProduct: Product = {
    id: String(products.length + 1),
    name,
    description: description ?? '',
    price,
    category: category ?? 'uncategorized',
    stock: stock ?? 0,
    sku,
    createdAt: new Date().toISOString(),
  };

  products.push(newProduct);
  res.status(201).json({ data: newProduct });
});

app.put('/products/:id', (req: Request, res: Response) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  products[idx] = { ...products[idx], ...(req.body as Partial<Product>), id: req.params.id };
  res.json({ data: products[idx] });
});

app.delete('/products/:id', (req: Request, res: Response) => {
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }
  const deleted = products.splice(idx, 1)[0];
  res.json({ data: deleted, message: 'Product deleted' });
});

app.listen(PORT, () => {
  console.log(`[products-service] Running on port ${PORT}`);
});
