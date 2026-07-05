# HRMS ERP Local System Setup Guide

This guide provides step-by-step instructions to set up and run the HRMS ERP (Enterprise Resource Planning) application on your local machine using **Node.js**, **Express**, **MySQL**, and **React (Vite)** with **Visual Studio Code**.

---

## Prerequisites

Before starting, make sure you have the following installed on your system:
1. **Node.js** (v18.x or later)
2. **MySQL Server** (v8.x or later)
3. **Visual Studio Code** (VS Code)

---

## Step 1: Database Setup (MySQL)

1. Open your MySQL Command Line Client, MySQL Workbench, or any database tool (such as DBeaver).
2. Create a new schema named `hrmserp_db`:
   ```sql
   CREATE DATABASE hrmserp_db;
   USE hrmserp_db;
   ```
3. Open and execute the SQL schema script provided in the root directory: **`hrmserp_schema_and_data.sql`**. This will create the required tables:
   - `departments`
   - `designations`
   - `employees`
   - `attendance`
   - `leave_requests`
   - `payroll`
   - `holidays`
   - `announcements`
   - `system_users`
   - `audit_logs`

---

## Step 2: Backend Setup (Node.js & Express)

1. Open **Visual Studio Code**.
2. Select **File > Open Folder** and choose the **`backend`** directory.
3. Open a terminal in VS Code (`Ctrl + ~` or **Terminal > New Terminal**).
4. Install all server-side dependencies:
   ```bash
   npm install
   ```
5. Create your environment configuration file:
   - Duplicate `.env.example` and rename it to **`.env`**.
   - Open `.env` and fill in your MySQL credentials:
     ```env
     PORT=5000
     DB_HOST=127.0.0.1
     DB_USER=root           # Your MySQL Username
     DB_PASSWORD=yourpassword # Your MySQL Password
     DB_NAME=hrmserp_db     # The database name created in Step 1
     JWT_SECRET=super_secure_random_key_string
     ```
6. Start the development server using nodemon (for auto-reloading):
   ```bash
   npm run dev
   ```
   *You should see:*  
   `✔ Successfully connected to MySQL database: hrmserp_db`  
   `✔ Server running on port 5000`

---

## Step 3: Frontend Setup (React & Vite)

1. Open a new window or folder in **Visual Studio Code** and choose the **`frontend`** directory.
2. Open a terminal in VS Code.
3. Install all client-side dependencies:
   ```bash
   npm install
   ```
4. Create your frontend environment configuration:
   - Create a new file named **`.env`** in the root of the `frontend` folder.
   - Add the following line to point to your backend API port:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```
5. Launch the React development server:
   ```bash
   npm run dev
   ```
6. Open your browser and navigate to the address displayed in the terminal (usually `http://localhost:3000` or `http://localhost:5173`).

---

## Step 4: Login & Features

Once both servers are running:
- The system automatically detects the live Node.js server and routes all login, approval, audit log, and CRUD operations directly to your MySQL database.
- **Default Super Admin credentials:**
  - **Username:** `admin`
  - **Password:** `admin123`
- If you stop the backend, the React frontend will gracefully fallback to standalone offline simulation (LocalStorage) so you never experience interruption!
