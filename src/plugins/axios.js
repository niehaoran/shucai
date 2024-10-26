// src/plugins/axios.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000/api', // 设置基础 URL
});

export default {
    install(app) {
        app.config.globalProperties.$axios = api;
    },
};
