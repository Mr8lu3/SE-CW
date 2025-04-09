# Base image to use
FROM node:18-alpine

# set a working directory
WORKDIR /src

# Copy across project configuration information
COPY package*.json /src/

# Install explicitly required dependencies and global packages
RUN npm install -g supervisor && \
    npm install && \
    npm install express-session bcrypt cookie-parser --save

# Copy across all our files
COPY . /src

# Expose our application port (3000)
EXPOSE 3000

# Command to run the application
CMD ["supervisor", "-e", "js,pug,html", "app/app.js"]


