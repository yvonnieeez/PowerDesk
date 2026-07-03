import axios from 'axios';
import { env } from '../env';

export const apiClient = axios.create({
  baseURL: env.VITE_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});
