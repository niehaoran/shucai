import { createApp } from 'vue';
import App from './App.vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import axiosPlugin from './plugins/axios';

const app = createApp(App);
app.use(ElementPlus);
app.use(axiosPlugin);
app.mount('#app');
