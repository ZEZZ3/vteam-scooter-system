FROM node:20-alpine
WORKDIR /simulation
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]