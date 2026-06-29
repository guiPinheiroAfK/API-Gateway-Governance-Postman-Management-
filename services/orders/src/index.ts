import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 8083;

type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  shippingAddress: string;
  createdAt: string;
  updatedAt: string;
}

const orders: Order[] = [
  {
    id: 'ORD-001',
    userId: '1',
    items: [
      { productId: '1', productName: 'Mechanical Keyboard Pro', quantity: 1, unitPrice: 299.99 },
      { productId: '5', productName: 'Noise-Cancelling Headphones', quantity: 1, unitPrice: 399.00 },
    ],
    total: 698.99,
    status: 'delivered',
    shippingAddress: 'Rua das Flores, 123 — São Paulo, SP',
    createdAt: '2024-05-10T10:00:00Z',
    updatedAt: '2024-05-15T14:00:00Z',
  },
  {
    id: 'ORD-002',
    userId: '2',
    items: [{ productId: '2', productName: 'Ultrawide Monitor 34"', quantity: 1, unitPrice: 849.99 }],
    total: 849.99,
    status: 'shipped',
    shippingAddress: 'Av. Paulista, 456 — São Paulo, SP',
    createdAt: '2024-06-01T08:30:00Z',
    updatedAt: '2024-06-05T12:00:00Z',
  },
  {
    id: 'ORD-003',
    userId: '3',
    items: [
      { productId: '3', productName: 'Ergonomic Chair', quantity: 1, unitPrice: 599.00 },
      { productId: '4', productName: 'Standing Desk 160cm', quantity: 1, unitPrice: 749.00 },
    ],
    total: 1348.00,
    status: 'confirmed',
    shippingAddress: 'Rua Augusta, 789 — São Paulo, SP',
    createdAt: '2024-06-20T16:00:00Z',
    updatedAt: '2024-06-20T16:05:00Z',
  },
];

function calcTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

app.get('/health', (_req, res: Response) => {
  res.json({ status: 'healthy', service: 'orders-service', version: '1.0.0', timestamp: new Date().toISOString() });
});

app.get('/orders', (req: Request, res: Response) => {
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;

  // Regular users only see their own orders
  const result = role === 'admin' ? orders : orders.filter((o) => o.userId === userId);
  res.json({ data: result, total: result.length });
});

app.get('/orders/:id', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found', id: req.params.id });
    return;
  }
  res.json({ data: order });
});

app.post('/orders', (req: Request, res: Response) => {
  const { items, shippingAddress } = req.body as { items: OrderItem[]; shippingAddress: string };
  const userId = (req.headers['x-user-id'] as string) ?? 'unknown';

  if (!items?.length || !shippingAddress) {
    res.status(400).json({ error: 'Fields "items" and "shippingAddress" are required' });
    return;
  }

  const newOrder: Order = {
    id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
    userId,
    items,
    total: calcTotal(items),
    status: 'pending',
    shippingAddress,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
});

app.patch('/orders/:id/status', (req: Request, res: Response) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const { status } = req.body as { status: OrderStatus };
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  if (!validTransitions[order.status].includes(status)) {
    res.status(422).json({
      error: 'Invalid status transition',
      current: order.status,
      requested: status,
      allowed: validTransitions[order.status],
    });
    return;
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  res.json({ data: order });
});

app.listen(PORT, () => {
  console.log(`[orders-service] Running on port ${PORT}`);
});
