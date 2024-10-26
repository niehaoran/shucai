// src/services/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // Node.js 代理服务器的 URL
});

export default api;
