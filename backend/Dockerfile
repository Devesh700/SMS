FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD [ "npm", "run", "dev" ]

# FROM node:20-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV=production
# COPY package*.json ./
# COPY --from=builder /app/dist ./dist
# EXPOSE 8000
# CMD ["node", "dist/server.js"]
