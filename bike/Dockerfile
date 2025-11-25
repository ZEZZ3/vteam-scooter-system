FROM node:20-alpine
WORKDIR /bike
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]