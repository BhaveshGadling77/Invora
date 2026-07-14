# Inventra - Enterprise Inventory Management System

Inventra is a production-ready, highly scalable, full-stack Enterprise Inventory Management System built for modern businesses. It includes robust features like real-time dashboards, automated stock tracking, full supply chain management (purchases/sales), dynamic reports, and role-based access control.

## Tech Stack

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS v4 (Custom UI with glassmorphism, dynamic animations)
- **Routing**: React Router
- **Data Fetching**: TanStack Query + Axios
- **Form Management**: React Hook Form + Zod
- **Charts**: Chart.js (react-chartjs-2)
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js + Express.js
- **Database ORM**: Prisma ORM
- **Database**: MySQL (3NF Normalized)
- **Authentication**: JWT, bcryptjs
- **File Uploads**: Multer + Cloudinary (Product images)
- **Validation**: express-validator + Zod
- **Logging**: Winston + Morgan
- **Exports**: json2csv, exceljs, pdfkit

---

## 📁 Folder Structure

### Backend (`/backend`)
```
backend/
├── prisma/             # Database schema and migrations
│   └── schema.prisma
├── src/
│   ├── config/         # Environment, DB, Cloudinary config
│   ├── controllers/    # Route handlers
│   ├── middleware/     # Auth, Validation, Upload, Error handler, Audit
│   ├── routes/v1/      # API Versioning
│   ├── services/       # Business logic
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Helpers, Email, Logger, Response templates
│   ├── validators/     # Express-validator schemas
│   └── server.ts       # Entry point
└── Dockerfile          # Docker configuration
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── assets/         # Images, global styles
│   ├── components/     # Reusable UI, Layout, Sidebar, Navbar
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Dashboard, Auth, CRUD pages
│   ├── services/       # Axios API integration
│   ├── utils/          # Helpers
│   ├── App.tsx         # Routing configuration
│   └── main.tsx        # React entry point
└── Dockerfile          # Docker configuration
```

---

## 🗄️ Database Design (MySQL 3NF)

- **User**: Manage users, roles (ADMIN, MANAGER, STAFF).
- **Category**: Product categories.
- **Supplier**: Vendors supplying products.
- **Customer**: Customers purchasing products.
- **Product**: Core inventory entity. References Category and Supplier. Includes current stock, minimum stock, prices, SKU, barcode.
- **Purchase**: Inward supply. Contains PurchaseItems referencing Product. Automates stock increments.
- **Sale**: Outward supply. Contains SaleItems referencing Product. Automates stock deductions.
- **InventoryHistory**: Audit log of all stock movements (Purchase, Sale, Manual Adjustments).
- **AuditLog**: System-wide activity tracking (Login, CRUD actions).

---

## 🚀 Setup Instructions

### 1. Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- MySQL 8.0+

### 2. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
NODE_ENV=development
PORT=5000
DATABASE_URL="mysql://root:rootpassword@localhost:3306/inventra"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="1d"
JWT_REFRESH_EXPIRES_IN="7d"

# Cloudinary (Optional, for image uploads)
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Email (Optional, for resets/verification)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=user
SMTP_PASS=pass
SMTP_FROM="Inventra <noreply@inventra.local>"
```

### 3. Docker Deployment (Recommended)
Run the entire stack (Database, Backend, Frontend) with a single command:
```bash
docker-compose up -d --build
```
- Frontend: `http://localhost:80`
- Backend API: `http://localhost:5000/api/v1`
- Database: `localhost:3306`

### 4. Local Development

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed      # Creates default Admin user
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## 📚 API Documentation

Base URL: `/api/v1`

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and get JWT
- `POST /auth/refresh` - Refresh JWT
- `POST /auth/logout` - Logout

### Dashboard
- `GET /dashboard/stats` - Key metrics
- `GET /dashboard/monthly-sales` - Revenue charts

### Modules (CRUD)
Standard endpoints for each entity (`/products`, `/categories`, `/suppliers`, `/customers`, `/purchases`, `/sales`):
- `GET /` - List all (with pagination/search)
- `GET /:id` - Get one
- `POST /` - Create
- `PUT /:id` - Update
- `DELETE /:id` - Delete

### Reports
- `GET /reports/sales?format=csv|excel|pdf` - Export sales report
- `GET /reports/inventory?format=csv|excel|pdf` - Export inventory report

---

## 🛡️ Security & Quality

- **Helmet**: Secures HTTP headers.
- **CORS**: Cross-Origin Resource Sharing handled securely.
- **Rate Limiting**: Prevents brute-force attacks on API endpoints.
- **Input Sanitization**: Express-validator and Zod ensure data integrity.
- **Logging**: Daily rotating log files with Winston.