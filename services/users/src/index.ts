import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 8081;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  avatar: string;
}

const users: User[] = [
  { id: '1', name: 'Alice Mendes', email: 'alice@orquestra.dev', role: 'admin', createdAt: '2024-01-15T10:00:00Z', avatar: 'AM' },
  { id: '2', name: 'Bruno Costa', email: 'bruno@orquestra.dev', role: 'user', createdAt: '2024-02-20T14:30:00Z', avatar: 'BC' },
  { id: '3', name: 'Carla Souza', email: 'carla@orquestra.dev', role: 'user', createdAt: '2024-03-10T09:15:00Z', avatar: 'CS' },
  { id: '4', name: 'Diego Lima', email: 'diego@orquestra.dev', role: 'user', createdAt: '2024-04-05T16:45:00Z', avatar: 'DL' },
  { id: '5', name: 'Elena Rocha', email: 'elena@orquestra.dev', role: 'user', createdAt: '2024-05-22T11:20:00Z', avatar: 'ER' },
];

// Propagated by the gateway
function getRequestUser(req: Request): string {
  return (req.headers['x-user-email'] as string) ?? 'anonymous';
}

app.get('/health', (_req, res: Response) => {
  res.json({ status: 'healthy', service: 'users-service', version: '1.0.0', timestamp: new Date().toISOString() });
});

// v1 — simple array response
app.get('/users', (req: Request, res: Response) => {
  const requestedBy = getRequestUser(req);
  console.log(`[users-service] GET /users requested by ${requestedBy}`);
  res.json({ data: users, total: users.length });
});

app.get('/users/:id', (req: Request, res: Response) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found', id: req.params.id });
    return;
  }
  res.json({ data: user });
});

app.post('/users', (req: Request, res: Response) => {
  const { name, email, role = 'user' } = req.body as { name: string; email: string; role?: string };

  if (!name || !email) {
    res.status(400).json({ error: 'Fields "name" and "email" are required' });
    return;
  }

  const newUser: User = {
    id: String(users.length + 1),
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
    avatar: name.split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2),
  };

  users.push(newUser);
  res.status(201).json({ data: newUser });
});

app.put('/users/:id', (req: Request, res: Response) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  users[idx] = { ...users[idx], ...(req.body as Partial<User>), id: req.params.id };
  res.json({ data: users[idx] });
});

app.delete('/users/:id', (req: Request, res: Response) => {
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const deleted = users.splice(idx, 1)[0];
  res.json({ data: deleted, message: 'User deleted successfully' });
});

app.listen(PORT, () => {
  console.log(`[users-service] Running on port ${PORT}`);
});
