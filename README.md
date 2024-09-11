# PFQ-API

## Overview

`pfq-api` is a Node.js application built with TypeScript and Express. It provides several endpoints for user
authentication and server health checks.

## Features

- **Health Check Endpoint**: Verify the server's health status.
- **User Login**: Authenticate users with username, password, and optional OTP (One-Time Password).
- **User Information**: Retrieve authenticated user's information.

## Endpoints

### GET /health

Checks the health status of the server.

- **Response**:
    - `200 OK`: `{ "message": "ok" }`

### POST /login

Handles user login and returns a JWT token if the credentials are valid.

- **Request Body**:
    - `username`: string
    - `password`: string
    - `otp` (optional): string

- **Responses**:
    - `200 OK`: `{ "token": "JWT_TOKEN" }`
    - `401 Unauthorized`: `{ "message": "No such user" }`
    - `401 Unauthorized`: `{ "message": "2FA required" }`
    - `401 Unauthorized`: `{ "message": "Invalid 2FA code" }`
    - `401 Unauthorized`: `{ "message": "Invalid credentials" }`
    - `500 Internal Server Error`: `{ "message": "JWT secret not set" }`
    - `500 Internal Server Error`: `{ "message": "An unknown error occurred" }`

### GET /me

Retrieves the authenticated user's information.

- **Headers**:
    - `Authorization`: `Bearer JWT_TOKEN`

- **Responses**:
    - `200 OK`: `{ "id": number, "name": string, "displayname": string, "staff": boolean }`
    - `404 Not Found`: `{ "message": "User not found" }`
    - `500 Internal Server Error`: `{ "message": "An unknown error occurred" }`

## Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/MoonieGZ/PFQ-API.git
   cd PFQ-API
   ```
2. Create a `.env` file in the root directory with the following content:
   ```sh
    PORT=2138
    JWT_SECRET=your_secret_here
    MYSQL_SERVER=localhost
    MYSQL_USER=your_user_here
    MYSQL_PASSWORD=your_password_here
    MYSQL_DATABASE=your_database_here
    ```
3. Install dependencies:
   ```sh
    npm install
    ```
4. Run the application:
   ```sh
   npm start
   ```
5. The server will be running on `http://localhost:2138`. You can test the endpoints using a tool like Postman or cURL.
6. To run the tests:
   ```sh
   npm test
   ```
   