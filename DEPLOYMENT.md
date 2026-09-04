# EduTech Hub - Production Deployment Guide

This guide provides step-by-step instructions to deploy the entire College Management System (CMS) to production.

- **Frontend**: Vite + React + TypeScript -> **Vercel**
- **Backend**: Node.js + Express -> **Render**
- **Database**: Mongoose + MongoDB -> **MongoDB Atlas**

---

## 🛠️ Step 1: GitHub Repository Setup

1. **Initialize Git and Commit**:
   Run the following commands in the project root directory (`edutech-hub/`):
   ```bash
   git init
   git add .
   git commit -m "Configure CMS for production deployment"
   ```

2. **Publish to GitHub**:
   - Create a new repository on GitHub (keep it private if you want to protect configuration templates).
   - Link the remote repository and push your main branch:
     ```bash
     git remote add origin https://github.com/<your-username>/<your-repo-name>.git
     git branch -M main
     git push -u origin main
     ```

---

## 🍃 Step 2: MongoDB Atlas Cloud Setup

1. **Create Account / Cluster**:
   - Create or sign in to your account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
   - Create a new free-tier cluster (e.g., `Cluster0`).

2. **Configure Database Access User**:
   - Navigate to **Security** -> **Database Access** -> **Add New Database User**.
   - Select **Password** authentication.
   - Assign the user a username (e.g., `db_user`) and a secure password.
   - Keep the privileges set to **Read and write to any database**.

3. **Configure Network IP Access**:
   - Navigate to **Security** -> **Network Access** -> **Add IP Address**.
   - Click **Allow Access from Anywhere** (adds `0.0.0.0/0`). 
     > [!IMPORTANT]
     > Both Vercel and Render allocate dynamic IP addresses for free-tier web services, so you must enable access from anywhere (`0.0.0.0/0`) for the backend server to maintain a connection.

4. **Retrieve Connection String**:
   - Under **Database Deployments**, click **Connect** -> **Drivers**.
   - Copy your connection string. It will look like this:
     ```text
     mongodb+srv://<username>:<password>@<cluster-url>.mongodb.net/?retryWrites=true&w=majority&appName=<AppName>
     ```
   - Replace `<username>` and `<password>` with the credentials of the user created in step 2.
   - Replace the database name section to target `cms` or your specific database name.

---

## 🚀 Step 3: Backend Deployment on Render

1. **Create Web Service**:
   - Create or sign in to your [Render](https://render.com) dashboard.
   - Click **New +** -> **Web Service**.
   - Connect your GitHub repository.
   - Alternatively, you can use the **Render Blueprint** configuration. Render will automatically parse the `render.yaml` file located in the root of your repository.

2. **Configure Settings Manually** (if not using blueprint):
   - **Name**: `edutech-hub-backend`
   - **Runtime**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

3. **Environment Variables**:
   Under the **Environment** tab, configure the following variables:

   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `PORT` | `5000` | Internally mapped by Render |
   | `NODE_ENV` | `production` | Enables production mode constraints |
   | `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas Connection String from Step 2 |
   | `JWT_SECRET` | `<secure-random-key>` | A cryptographically strong key (e.g. 32+ characters) |
   | `ALLOWED_ORIGINS` | `https://your-app.vercel.app` | Comma-separated list of allowed frontend origins (use `*` to allow all temporarily) |

4. **Deploy**:
   - Click **Deploy Web Service**.
   - Render will build and expose a public backend URL (e.g., `https://edutech-hub-backend.onrender.com`). Copy this URL.

---

## 🎨 Step 4: Frontend Deployment on Vercel

1. **Import Project**:
   - Create or sign in to your [Vercel](https://vercel.com) dashboard.
   - Click **Add New** -> **Project**.
   - Import your GitHub repository.

2. **Configure Build Settings**:
   - **Framework Preset**: `Vite` (Vercel automatically detects this).
   - **Root Directory**: Select `frontend` (crucial to point to the frontend folder).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

3. **Environment Variables**:
   Under **Environment Variables**, add the API endpoint pointing to your deployed backend URL:

   | Key | Value | Notes |
   | :--- | :--- | :--- |
   | `VITE_API_URL` | `https://edutech-hub-backend.onrender.com/api` | The backend API URL copied from Step 3, suffixed with `/api` |

4. **Deploy**:
   - Click **Deploy**.
   - Vercel will install dependencies, build the static assets, and deploy the application.
   - Once completed, Vercel will generate your live production URL (e.g., `https://edutech-hub.vercel.app`).

---

## 🔒 Step 5: Final Security & CORS Handshake

1. Update the backend service configuration on **Render** to secure CORS.
2. In your Render Web Service dashboard, go to **Environment Variables**.
3. Update `ALLOWED_ORIGINS` to specify the exact Vercel frontend URL:
   ```text
   https://edutech-hub.vercel.app
   ```
4. Save the changes. Render will automatically redeploy the backend with the restricted, secure CORS policy.
