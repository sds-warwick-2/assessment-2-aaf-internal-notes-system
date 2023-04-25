FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . /app
#RUN npm start
EXPOSE 80
CMD ["npm", "run", "start"]
# CMD ["echo","Notebook running"]
