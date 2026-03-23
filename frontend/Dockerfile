FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:stable-alpine
# Copy build output to nginx html directory
COPY --from=build /app/dist /usr/share/nginx/html
# Optional: Copy a custom nginx config if needed, but default is fine for basic SPA
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
