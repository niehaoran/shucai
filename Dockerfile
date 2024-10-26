# 使用 Node.js 官方基础镜像
FROM node:18

# 设置工作目录
WORKDIR /usr/src/app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制源代码
COPY . .

# 暴露应用运行的端口
EXPOSE 3000

# 使用 pm2 运行应用，确保后台稳定运行
RUN npm install -g pm2

# 启动应用
CMD ["pm2-runtime", "server.js"]
