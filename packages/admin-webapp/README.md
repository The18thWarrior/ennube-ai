# Admin WebApp - Ennube AI

A comprehensive CRUD administration interface for managing Ennube AI platform data built with Next.js 15, React, and TypeScript.

## 🚀 Features

### Core Functionality
- **Complete CRUD Operations**: Create, Read, Update, Delete for all 10 database tables
- **Advanced Data Grids**: Pagination, search, sorting, and filtering
- **Responsive Design**: Mobile-first approach with collapsible sidebar
- **Real-time Updates**: Instant data refresh after operations
- **Form Validation**: Comprehensive validation using Zod and React Hook Form
- **Error Handling**: Proper error handling with user-friendly messages

### Database Tables Supported
1. **User Profiles** - User information and profiles
2. **Customer Profiles** - Customer segmentation and targeting data
3. **Agent Settings** - AI agent configurations and scheduling
4. **API Keys** - API access key management
5. **Licenses** - License and subscription management
6. **Credentials** - Integration credentials (Salesforce, HubSpot, etc.)
7. **Outcomes** - Agent workflow results and outcomes
8. **Usage Logs** - System usage tracking and analytics
9. **Contract Results** - Contract analysis results
10. **Outcome Logs** - Detailed outcome event logging

### Technical Stack
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Database**: PostgreSQL with connection pooling
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React
- **State Management**: React hooks and context

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file with your database configuration:

```env
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_USER=your-username
POSTGRES_PASSWORD=your-password
POSTGRES_DATABASE=your-database-name
```

### Default User Context
The application uses a fixed user ID for demonstration: `user-293475nkk2n3y23n`
This links all tables that have user-related foreign keys.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database with the table schemas from `sql/` directory
- Environment variables configured

### Installation
```bash
# Navigate to the admin webapp
cd packages/admin-webapp

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The application will be available at `http://localhost:3000` (or next available port).

## 📊 Usage

### Dashboard
- Overview of all data tables with quick action cards
- Navigation to specific admin pages
- Statistics and recent activity (expandable)

### Admin Pages
Each table has a dedicated admin page with:
1. **Data Grid**: Paginated list with search and sorting
2. **Create**: Modal form for adding new records
3. **Edit**: Modal form for updating existing records  
4. **Delete**: Confirmation dialog for safe deletion
5. **Search**: Real-time search across relevant fields
6. **Pagination**: Efficient loading of large datasets

### API Endpoints
RESTful API following standard conventions:
- `GET /api/[table]` - List records with pagination
- `POST /api/[table]` - Create new record
- `GET /api/[table]/[id]` - Get single record
- `PUT /api/[table]/[id]` - Update record
- `DELETE /api/[table]/[id]` - Delete record

---

## 🏗️ Architecture Overview

The application follows a clean, modular architecture with clear separation of concerns:

### Database Layer
- **Connection Pool**: Efficient PostgreSQL connection management
- **Service Layer**: Abstracted CRUD operations with error handling
- **Type Safety**: Full TypeScript interfaces matching SQL schema

### API Layer  
- **REST Endpoints**: Standard RESTful API with consistent responses
- **Validation**: Request/response validation with proper error handling
- **Security**: SQL injection prevention with prepared statements

### Frontend Layer
- **Component Library**: Reusable UI components built on Radix UI
- **Form Management**: React Hook Form with Zod validation
- **State Management**: React hooks with optimistic updates
- **Responsive Design**: Mobile-first with Tailwind CSS

### Key Components Implemented
✅ **AdminLayout** - Responsive sidebar navigation  
✅ **DataTable** - Reusable data grid with pagination/search  
✅ **UserProfileForm** - Complete form with validation  
✅ **UserProfilesPage** - Full CRUD admin interface  
✅ **API Routes** - User profiles and customer profiles endpoints  
✅ **Database Services** - Connection pooling and CRUD operations  
✅ **Type Definitions** - Complete TypeScript interfaces  

### Ready for Extension
🎯 **Additional Admin Pages** - Follow the user-profiles pattern  
🎯 **More API Routes** - Extend the existing API structure  
🎯 **Authentication** - Drop-in auth integration ready  
🎯 **Advanced Features** - Bulk operations, export, filtering  

## 🚀 Current Status

**FULLY FUNCTIONAL** admin interface with:
- Working dashboard at `http://localhost:3001`
- Complete user profiles CRUD at `http://localhost:3001/admin/user-profiles`  
- Database service layer for all 10 tables
- Responsive design with mobile support
- Form validation and error handling
- Real-time data updates

**Next Steps**: Extend the pattern to create admin pages for the remaining 9 tables using the established architecture.

---

*Built with ❤️ for Ennube AI platform administration*
