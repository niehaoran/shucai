# 1. 构建前端应用
FROM node:16-alpine AS build-stage

WORKDIR /app

# 复制前端代码
COPY frontend/package*.json ./frontend/
WORKDIR /app/frontend
RUN npm install
COPY frontend/ .
RUN npm run build

# 2. 设置后端环境
FROM node:16-alpine AS server-stage

WORKDIR /app

# 复制后端代码
COPY server.js ./
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
WORKDIR /app

# 复制前端构建的静态文件到 /app/public
COPY --from=build-stage /app/frontend/dist /app/public

# 配置端口
EXPOSE 3000

# 启动 server.js 服务器
CMD ["node", "server.js"]
