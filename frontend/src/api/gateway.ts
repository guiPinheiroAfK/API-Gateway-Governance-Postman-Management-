import axios from 'axios';
import { GatewayMetrics, ServiceHealth } from '../types';

const api = axios.create({ baseURL: '' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function login(email: string, password: string) {
  const { data } = await api.post('/api/v1/auth/login', { email, password });
  return data as { accessToken: string; user: { email: string; role: string; sub: string } };
}

export async function fetchMetrics(): Promise<GatewayMetrics> {
  const { data } = await api.get('/api/v1/gateway/metrics');
  return data as GatewayMetrics;
}

export async function fetchServices(): Promise<ServiceHealth[]> {
  const { data } = await api.get('/api/v1/gateway/services');
  return (data as { services: ServiceHealth[] }).services;
}

export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data as { status: string; uptime: number };
}
