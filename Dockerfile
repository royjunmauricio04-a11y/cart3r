FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
# db push creates tables from schema.prisma; switch to migrate deploy once migrations exist
CMD ["sh","-c","npx prisma db push && npm start"]
