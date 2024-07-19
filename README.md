# User Management and Scheduler System

## Overview

This project is a web-based user management and scheduler system. It includes functionalities for user authentication, role-based access control, and scheduling. The system is built with Node.js, Express, and MySQL, with views rendered using EJS.

## Features

- User authentication (sign-in)
- Role-based access control (admin, editor, viewer)
- Admin dashboard with various management features
- Scheduler form for maintenance scheduling
- Rake formation management
- User role management
- Report generation
- System activity logs
- System configuration settings

## Technologies Used

- Node.js
- Express
- MySQL
- EJS
- bcrypt for password hashing
- express-session for session management
- dotenv for environment variable management
- body-parser for parsing request bodies
## Installation

git clone https://github.com/grishma7733/websitekalva.git
cd user-management-scheduler


2. **Install dependencies:**

    ```bash
    npm install
    ```

3. **Set up the database:**

    - Ensure you have MySQL installed and running.
    - Create a database named `user_management`.
    - Run the following SQL script to create necessary tables and insert sample data:

    ```sql
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'editor', 'viewer') NOT NULL
    );

    INSERT INTO users (username, password, role) VALUES
    ('admin', '$2b$10$HASHEDPASSWORD', 'admin'),
    ('editor', '$2b$10$HASHEDPASSWORD', 'editor'),
    ('viewer', '$2b$10$HASHEDPASSWORD', 'viewer');

    CREATE TABLE Schedule (
      id INT AUTO_INCREMENT PRIMARY KEY,
      bedtc VARCHAR(255) NOT NULL,
      unitNo VARCHAR(255) NOT NULL,
      coaches TEXT NOT NULL
    );
    ```

    Replace `HASHEDPASSWORD` with bcrypt hashed passwords for the respective users.

4. **Configure environment variables:**

    - Create a `.env` file in the root directory and add the following:

    ```env
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_NAME=user_management
    SESSION_SECRET=my_secret_key
    ```

5. **Start the server:**

    ```bash
    node server.js
    ```

    The application will be running on `http://localhost:3000`.
