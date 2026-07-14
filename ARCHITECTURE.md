# Inventra - Architecture Design Decisions

## System Architecture

### Pattern: MVC + Repository/Service Pattern
- **Controllers** handle HTTP requests/responses only
- **Services** contain business logic
- **Repositories** abstract data access (Prisma)
- **Models** defined via Prisma schema

### Database: MySQL with Prisma ORM
- 3NF normalized schema
- Foreign keys with cascade rules
- Composite indexes for performance

### Authentication: JWT + Refresh Tokens
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry, stored in httpOnly cookie
- bcrypt rounds: 12

### File Uploads: Multer → Cloudinary
- Images validated before upload
- Public URLs stored in DB

### API Versioning: /api/v1
- All routes prefixed with /api/v1
- Consistent response envelope: { success, data, message, meta }
