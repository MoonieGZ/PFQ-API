# PFQ-API

## Overview

`pfq-api` is a Node.js application built with TypeScript and Express. It provides several endpoints for user
authentication and server health checks.

## Features

- **Health Check Endpoint**: Verify the server's health status.
- **User Login**: Authenticate users with api key.
- **User Information**: Retrieve authenticated user's information.

## Endpoints

### GET /health

Checks the health status of the server.

- **Response**:
    - `200 OK`: `{ "message": "ok" }`

### GET /me

Retrieves the authenticated user's information.

- **Headers**:
    - `Authorization`: `API_KEY`

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
   
