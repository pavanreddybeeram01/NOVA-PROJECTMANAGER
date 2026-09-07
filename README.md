# 🚀 NOVA — Team Productivity Platform

> **Tagline:** Plan. Collaborate. Deliver.

NOVA is a full-stack project management and team productivity web application built with **React**, **Node.js (Express)**, **MySQL**, and **JWT Authentication**.

---

## ✨ Features

- 🎯 **Landing Page & Branding**: Modern design system featuring glassmorphism, responsive cards, dark theme, and high-impact hero.
- 🔐 **Authentication & Presets**: JWT token authentication with bcrypt password hashing, role permissions (Admin, Manager, Member), and instant 1-click Demo User Switcher.
- 📊 **Dashboard Overview**: Summary widgets (Active Projects, Task Completion Rate, Team Members, Progress Bars) and real-time Activity Feed.
- 📁 **Project Management**: Create projects, set budgets, track completion progress %, set categories, and set start/end deadlines.
- 📋 **Interactive Kanban Board**: 4 visual columns (*To Do*, *In Progress*, *Under Review*, *Completed*), priority indicators (*Low*, *Medium*, *High*, *Urgent*), due dates, assignee avatars, and 1-click column movement.
- 💬 **Task Details & Discussion**: Comments on tasks and subtask checklist support.
- 👥 **Team Roster**: Member directory, role management, and active contribution indicators.
- 📈 **Analytics & Progress**: Task velocity rates and task state distribution.

---

## 🛠️ Stack & Architecture

- **Frontend**: React (Single Page Application), Glassmorphic CSS Design System, Google Fonts (Outfit & Inter), Lucide Icons.
- **Backend**: Node.js & Express REST API (`/api/auth`, `/api/projects`, `/api/tasks`, `/api/team`, `/api/stats`).
- **Database**:
  - Production **MySQL** schema (`schema.sql`).
  - Dual-mode connection handler (`server/config/db.js`) supporting native MySQL pool (`mysql2`) and automatic zero-config fallback storage for immediate execution.
- **Auth**: `jsonwebtoken` and `bcryptjs`.

---

## 🚦 How to Run the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
Check or edit `.env`:
```env
PORT=5000
JWT_SECRET=nova_productivity_super_secret_jwt_key_2026
USE_MYSQL=false # Set to true when connected to live MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=nova_db
```

### 3. Start the Server
```bash
npm start
```

Open your browser and navigate to:
👉 **`http://localhost:5000`**

---

