import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const http = axios.create({
  baseURL,
  headers: {
    Accept: 'application/json',
  },
})