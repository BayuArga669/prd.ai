# PRD.ai 🚀
An AI-powered SaaS application to generate, edit, and manage professional Product Requirement Documents (PRDs) effortlessly.

PRD.ai streamlines the product management workflow by utilizing AI to turn your raw product ideas into well-structured, production-ready Product Requirement Documents in seconds.

---

## 🌟 Key Features

- **🪄 AI-Powered Wizard**: A beautiful multi-step questionnaire that guides you through defining your Product Info, Target Audience, Goals, Platforms, and Key Features to generate tailored PRDs.
- **⚡ Real-Time Streaming Output**: Watch the AI generate your PRD page-by-page in real-time.
- **📝 Split-Pane Markdown Editor**: A powerful editor that lets you write/modify Markdown on the left while instantly previewing the beautiful typography layout on the right.
- **📁 Document Management**: Filter, search, sort, and organize all your PRDs with custom status tracking (Draft, In Progress, In Review, Complete).
- **📥 Dual Export Options**:
  - Export as Markdown (`.md`) files.
  - Export as print-optimized PDFs using the browser print stylesheet.
- **🔒 Full User Authentication**: Secure login, registration, password hashing, and user profile management (including custom avatar uploads).
- **🗄️ Auto-migrating Database**: Automatically sets up MySQL database schemas, seeds mock data, and handles migrations on server boot.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS / TailwindCSS (Modern Neo-Brutalist & Glassmorphic UI design)
- **Language**: TypeScript
- **Database**: MySQL / TiDB Cloud (with `mysql2/promise` connection pooling)
- **AI Integration**: Groq Cloud SDK (streaming API)
- **Icons**: Material Symbols Outlined (Google Fonts)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **MySQL Server** (local instance or cloud database like TiDB Cloud)
- **Groq API Key** (for AI generation)

### 2. Environment Setup
Create a `.env` or `.env.local` file in the root directory and configure the following variables:

```env
# Server Config
PORT=3000

# Database Configuration (MySQL / TiDB)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=prd_ai_db
DB_SSL=false # Set to true for TiDB Cloud / SSL connections

# Authentication (JWT secret key)
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters

# Groq AI API Configuration
GROQ_API_KEY=gsk_your_groq_api_key_here
```

### 3. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 4. Running the App
Start the local development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> [!NOTE]
> On the first startup, the application will automatically create the `users` and `documents` tables and seed a default user:
> - **Email**: `alex@prd.ai`
> - **Password**: `password123`

---

## 📁 Project Structure

```
├── public/                 # Static assets (logos, default avatars, user uploads)
├── src/
│   ├── app/                # Next.js App Router Pages
│   │   ├── (app)/          # Logged-in application pages
│   │   │   ├── dashboard/  # Main dashboard showing user documents & templates
│   │   │   ├── editor/     # Document list & individual document Markdown editor
│   │   │   ├── wizard/     # AI generation wizard page
│   │   │   ├── settings/   # User profile and account setting page
│   │   │   └── templates/  # Preset PRD templates library
│   │   ├── api/            # API Route handlers (auth, document CRUD, AI generation stream)
│   │   ├── login/          # Authentication page (login/register)
│   │   └── globals.css     # Global styles & Neo-brutalist theme colors
│   ├── components/         # Shared UI components (Sidebar, TopBar, MobileNav)
│   └── lib/                # Database pool connection, JWT helper, and AI stream client
```

---

## 🧪 Verification & Building
To check for TypeScript compiler validity and build the optimized production package:
```bash
npm run build
```

---

## 📄 License
This project is licensed under the MIT License.
