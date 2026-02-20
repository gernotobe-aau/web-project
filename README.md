# Food Delivery Platform

A comprehensive full-stack food delivery platform built with Node.js, Express, SQLite, and Angular. This application enables customers to discover restaurants, place orders, and track deliveries, while restaurant owners manage menus, process orders, and analyze business metrics.

## Project Overview

This platform implements core food delivery service functionality comparable to established services like Foodora. The system supports two primary user roles:

- **Restaurant Owners**: Manage menu items and categories, receive and process customer orders, track order preparation status, and view analytical insights about their business performance
- **Customers**: Browse and filter restaurants, view detailed menus, create orders with selected items, apply promotional vouchers, and provide feedback through ratings and reviews

The platform enforces role-based access control and ensures secure, validated operations at both frontend and backend layers.

## Technology Stack

### Backend Requirements
- Node.js v24 or higher
- Express.js for REST API routing and middleware
- SQLite with better-sqlite3 driver for data persistence
- TypeScript for type safety and better development experience
- Argon2id for secure password hashing
- JWT (JSON Web Tokens) for stateless authentication
- CORS middleware for cross-origin requests

### Frontend Requirements
- Angular v21 with TypeScript support
- Angular Material for pre-built UI components and styling
- RxJS for reactive programming patterns
- TypeScript for consistent type safety across frontend and backend

### Security & Authentication
- JWT-based authentication with custom implementation (no OpenID Connect)
- Email and password credential validation
- Argon2id password hashing with automatic salting
- Role-based access control through HTTP interceptors and route guards
- Token expiration and refresh handling
- Secure credential storage with environment variables

## Project Structure

```
web-project/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes/              # Express route definitions
│   │   │   └── controllers/         # Request handlers with validation
│   │   ├── business/                # Business logic layer
│   │   │   ├── auth.service.ts
│   │   │   ├── restaurant-profile.service.ts
│   │   │   ├── menu-management.service.ts
│   │   │   ├── order.service.ts
│   │   │   ├── analytics.service.ts
│   │   │   └── ... additional services
│   │   ├── repositories/            # Data access layer
│   │   │   ├── restaurant.repository.ts
│   │   │   ├── order.repository.ts
│   │   │   ├── dish.repository.ts
│   │   │   └── ... additional repositories
│   │   ├── db/
│   │   │   ├── migrations/          # Versioned SQL migrations
│   │   │   ├── init.ts              # Database initialization
│   │   │   └── migration-runner.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts   # JWT verification
│   │   │   └── error.middleware.ts  # Error handling
│   │   ├── config/
│   │   │   └── config.ts            # Environment-based configuration
│   │   ├── types/
│   │   │   └── auth.types.ts        # TypeScript interfaces
│   │   └── app.ts                   # Express application entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── services/        # HTTP API services
│   │   │   │   ├── guards/          # Route protection guards
│   │   │   │   ├── interceptors/    # HTTP interceptors
│   │   │   │   └── models/          # TypeScript interfaces
│   │   │   ├── shared/
│   │   │   │   ├── components/      # Reusable UI components
│   │   │   │   └── pipes/           # Custom pipes
│   │   │   ├── features/            # Feature modules by role
│   │   │   │   ├── public/          # Auth pages, landing page
│   │   │   │   ├── customer/        # Customer role features
│   │   │   │   └── restaurant/      # Restaurant owner features
│   │   │   └── layout/              # Main layout components
│   │   └── environments/            # Environment configuration files
│   ├── angular.json
│   └── package.json
│
├── scripts/
│   ├── build-and-run.ps1            # Main build and deployment script
│   ├── install.ps1                  # Dependency installation
│   ├── reset-and-run.ps1            # Database reset and application startup
│   └── start.ps1                    # Simple startup script
│
├── deploy/
│   └── backend/
│       ├── server/                  # Compiled backend
│       ├── public/                  # Built frontend assets
│       └── start-server.ps1         # Production startup script
│
├── Documentation.md                 # Detailed project documentation
├── database-schema.md               # Database schema reference
└── README.md                        # This file
```

## Architecture Principles

### Repository Pattern Implementation
- All database operations are isolated in repository layer classes
- Repositories return domain objects, never raw database records
- Changes to database access require modifications only in repository layer
- Ensures single responsibility and facilitates testing

### Business Logic Layer
- All business decisions and validations belong exclusively in service classes within the business layer
- Controllers handle only request validation and response mapping
- Routes act as simple HTTP endpoint definitions without logic
- Middleware performs cross-cutting concerns, not business decisions
- This separation ensures reusability and testability

### Validation Strategy
- Frontend validation serves purely as user experience enhancement and is never trusted for security
- All input validation must be performed on the backend before any database operation
- Validation errors are returned with HTTP 422 (Unprocessable Entity) status code
- Error responses include sufficient detail for Angular to display user-friendly messages
- Backend is the single source of truth for all validation rules

### Security Implementation
- Passwords are hashed using Argon2id algorithm with automatic salting
- Plaintext or reversible passwords are never stored
- JWT tokens include expiration times configured via environment variables
- Sensitive configuration values are managed through environment files, never hardcoded
- HTTP-only considerations for token storage across different security contexts
- CORS is properly configured for separate frontend and backend deployments

## Prerequisites and Installation

Before beginning development, ensure you have the following installed on your system:

- Node.js v24 or later (available from nodejs.org)
- npm package manager (included with Node.js)
- PowerShell 5.1 or later (for Windows build scripts)
- Git for version control

### Clone and Initial Setup

```bash
# Clone the repository
git clone https://github.com/gernotobe-aau/web-project.git
cd web-project

# Install all dependencies
npm run install-all
```

### Backend Configuration

The backend requires environment variables to function correctly. Create a `.env` file in the `backend/` directory:

```
backend/.env
```

```
# Authentication Configuration
JWT_SECRET=your-secure-random-string-here
JWT_EXPIRATION=1h

# Server Configuration
PORT=3000
CORS_ORIGIN=http://localhost:4200
DB_PATH=./database.sqlite

# Platform Configuration
MIN_AGE_CUSTOMER=16
MIN_AGE_RESTAURANT_OWNER=18
CUISINE_CATEGORIES=Italienisch,Asiatisch,Deutsch,Türkisch,Pizza,Burger,Vegetarisch,Vegan,Indisch,Mexikanisch
```

Important security notes:
- JWT_SECRET must be a cryptographically secure random string in production
- CORS_ORIGIN should match your frontend URL exactly
- Store sensitive values in environment files, never commit them to version control

## Development Workflow

### Using Build Scripts

The recommended approach is to use the provided PowerShell scripts, which handle dependency installation, database initialization, and application startup automatically.

```powershell
# Development mode - starts both backend and frontend with hot-reload
.\scripts\build-and-run.ps1 -Mode Development

# Deployment mode - creates production build in deploy/backend/
.\scripts\build-and-run.ps1 -Mode Deployment
```

**Development Mode (build-and-run.ps1 -Mode Development)**:
- Checks for Node.js installation
- Installs/updates npm dependencies for backend and frontend
- Creates `.env` file if missing
- Initializes SQLite database with migrations
- Loads seed test data
- Starts backend server on port 3000 (Express)
- Starts frontend development server on port 4200 (Angular)
- Opens both in browser automatically

### Manual Startup

For finer control, start services separately:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend Development Server:**
```bash
cd frontend
npm start
```

### Database & Test Data

The database is initialized automatically with seed data. To reload test data:

```bash
cd backend
npm run seed
```

This loads:
- Sample customers and restaurant owners
- Example restaurants with complete menus
- Orders at different statuses
- Reviews and ratings
- Discount vouchers

To completely reset the database:

```powershell
.\scripts\reset-and-run.ps1
```

### Available Development Scripts

- `build-and-run.ps1` - Main script for development/deployment
- `reset-and-run.ps1` - Reset database and reload seed data
- `install.ps1` - Install all npm dependencies
- `start.ps1` - Quick start (if dependencies already installed)

## Production Build and Deployment

### Building for Production

Create an optimized production build of both applications:

```powershell
.\scripts\build-and-run.ps1 -Mode Deployment
```

This process:
- Compiles the Node.js backend to JavaScript
- Executes TypeScript compilation with production optimizations
- Builds the Angular frontend with AOT (Ahead-of-Time) compilation
- Optimizes JavaScript bundles for minimal size
- Creates a deployment-ready directory structure in `deploy/backend/`

The resulting deployment structure is:
```
deploy/backend/
├── server/                          # Compiled backend application
│   ├── app.js                       # Main application file
│   ├── package.json                 # Production dependencies only
│   ├── database.sqlite              # Database file
│   └── .env.example                 # Template for environment variables
├── public/                          # Built frontend assets
│   ├── index.html                   # Angular application HTML
│   ├── assets/                      # Images and other static files
│   └── *.js, *.css                  # Minified bundles
├── start-server.ps1                 # Production startup script
└── README.md                        # Deployment instructions
```

### Deploying to a Server

1. Transfer the compiled `deploy/backend/` directory to your target server
2. Create a `.env` file in the `deploy/backend/server/` directory with production values
3. Execute the startup script:
   ```powershell
   .\start-server.ps1
   ```

The backend server automatically serves:
- The complete Angular frontend application at the root path (`/`)
- All REST API endpoints under the `/api` prefix

This unified approach requires only a single Node.js process and connection to manage the entire platform.

## Implementation Status: Complete Feature Set

This project implements all core requirements for both the restaurant owner and customer roles, including:

- User authentication and profile management
- Restaurant menu management with categories
- Order processing with status tracking
- Customer browsing and cart functionality
- Review and rating system
- Analytics dashboard
- Responsive design for all devices

### Note on Delivery Zone Implementation

The only feature specified in project requirements that was not implemented is **location/radius-based delivery zone management**. The project requirements allowed for one of four approaches:

1. Grid-based coordinates with Manhattan distance
2. Area/Zone labels (e.g., A1, B2)
3. Named delivery zones (North, South, Central)
4. Radius-based simulation with Euclidean distance

This means:
- Restaurants cannot define delivery zones
- Delivery times are not based on distance calculation
- Geographic filtering of restaurants is not available

All other mandatory features for both roles are fully implemented and functional. See [Dokumentation.md](./Dokumentation.md) for complete feature details.

### Endpoint Naming and Structure

All endpoints follow RESTful principles with the `/api` prefix:

```
POST   /api/auth/login              # Authenticate with email and password
POST   /api/auth/register           # Create new user account
GET    /api/restaurants             # List all restaurants
GET    /api/restaurants/:id         # Retrieve specific restaurant details
GET    /api/restaurants/:id/menu    # Get restaurant's complete menu
POST   /api/orders                  # Create new order
GET    /api/orders/:id              # Retrieve order details
PUT    /api/orders/:id              # Update order status
```

### Authentication

All authenticated requests must include the JWT token in the Authorization header:

```
Authorization: Bearer {access-token}
```

The token is obtained during login and is automatically included in requests through the HTTP interceptor.

### HTTP Status Code Usage

- **200 OK**: Successful GET, PUT, or PATCH request
- **201 Created**: Successful POST request that creates a resource
- **400 Bad Request**: Malformed request syntax
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User lacks necessary permissions for the resource
- **404 Not Found**: Requested resource does not exist
- **409 Conflict**: Request conflicts with current resource state (e.g., duplicate email)
- **422 Unprocessable Entity**: Validation failed on provided data
- **500 Internal Server Error**: Unexpected server error

### Error Response Format

Successful responses return the requested data directly. Error responses follow a consistent format:

```json
{
  "error": "A human-readable error message",
  "errors": [
    {
      "field": "email",
      "message": "Email already exists"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

This format allows the Angular frontend to display field-specific validation messages.

## Frontend Routes and Access Control

### Public Routes (Authentication Not Required)

These routes are accessible to all visitors:

- `/` : Landing page with platform overview
- `/login` : User login form
- `/register` : Account registration form

### Customer Routes (User Role)

These routes are protected by AuthGuard and require the customer role:

- `/customer` : Customer dashboard
- `/customer/browse` : Browse and search restaurants
- `/customer/restaurant/:id` : View restaurant details and menu
- `/customer/cart` : Shopping cart management
- `/customer/orders` : View order history and current orders
- `/customer/profile` : Edit personal profile and delivery address

### Restaurant Owner Routes (Restaurant Owner Role)

These routes are protected by AuthGuard and require the restaurantOwner role:

- `/restaurant` : Restaurant owner dashboard
- `/restaurant/menu` : Manage menu categories and dishes
- `/restaurant/profile` : Edit restaurant information
- `/restaurant/orders` : Receive and manage customer orders
- `/restaurant/analytics` : View sales statistics and metrics

### Route Protection

Route guards enforce authentication and role-based access:

- **AuthGuard**: Verifies that a valid JWT token exists before allowing route access
- **RoleGuard**: Confirms the user's role matches the required role for the route

Users are automatically redirected to the appropriate dashboard after successful login based on their role.

## Database Schema and Migrations

### Core Tables

The database consists of the following main tables:

**users**
- Stores authentication credentials for both customers and restaurant owners
- email (unique identifier)
- passwordHash (Argon2id hashed)
- role (determines access level)
- personalData (name, address, phone)

**restaurants**
- Information about restaurants offering food delivery
- name, contact information, opening hours
- owner references (foreign key to users)
- delivery zone assignment

**categories**
- Menu item grouping (Pasta, Pizza, Salads, etc.)
- restaurant-specific categories
- display order

**dishes**
- Individual menu items with pricing
- category association
- description and optional photo reference
- availability status

**orders**
- Purchase records from customers
- items ordered, order status, timestamps
- delivery address and estimated arrival
- pricing including voucher discounts

**order_items**
- Line-item detail for each order
- dish reference, quantity, price at time of order

**reviews**
- Customer feedback for restaurants and dishes
- rating score and text comments
- timestamp and author reference

**vouchers**
- Promotional codes with discount rules
- discount percentage or fixed amount
- activation and expiration dates

### Creating New Migrations

To add new tables or modify the schema:

1. Create a new SQL file in `backend/src/db/migrations/` using sequential numbering:
   ```
   backend/src/db/migrations/010_add_new_table.sql
   ```

2. Write the migration using standard SQL DDL:
   ```sql
   CREATE TABLE new_table (
       id INTEGER PRIMARY KEY AUTOINCREMENT,
       name TEXT NOT NULL,
       created_at DATETIME DEFAULT CURRENT_TIMESTAMP
   );
   ```

3. Migrations are immutable - never modify existing migration files

4. Run `npm run migrate` in the backend directory to apply new migrations

5. The migration system tracks applied migrations to prevent duplicate execution

## Testing

The project includes mechanisms for testing during development:

### Test Data Seeding

Automated seed data is provided for development and testing purposes:

```bash
cd backend
npm run seed
```

This populates the database with:
- Sample restaurants with realistic details
- Test users with known credentials
- Menu items across different categories
- Example orders and reviews

The seed script is idempotent and safe to run multiple times.

### Manual API Testing

A Postman collection is provided in `backend/postman/` with pre-configured requests:

```
backend/postman/Order-Management-API.postman_collection.json
backend/postman/Development.postman_environment.json
```

Import these files into Postman to test all API endpoints with sample data.

## Documentation

### Complete Documentation

See [Dokumentation.md](./Dokumentation.md) for comprehensive project documentation including:
- Detailed system architecture
- Development timeline and feature implementation history
- Team responsibilities and module assignments
- Technical highlights and design decisions
- Setup instructions and common tasks

### Database Schema

The [database-schema.md](./database-schema.md) file provides the complete database design with:
- Table definitions and relationships
- Field descriptions and constraints
- Entity-relationship diagram
- Seed data specifications

## Contributing and Development Practices

When implementing new features or fixes:

1. Create a feature branch from the main branch
2. Follow the established architecture patterns:
   - Place business logic in the business layer
   - Use repositories for all database access
   - Implement validation on the backend
3. Ensure all inputs are validated before database operations
4. Return appropriate HTTP status codes (especially 422 for validation errors)
5. Test the feature manually with both frontend and backend
6. Update relevant documentation
7. Commit with clear, descriptive messages showing what was implemented

### Code Quality

- Use TypeScript strictly for type safety
- Follow the existing naming conventions
- Keep functions focused and single-purpose
- Comment complex business logic
- Validate all user inputs on the backend

## License

This project is developed as part of the Web Technologies course 2025.

---

For questions or issues, refer to the comprehensive documentation in [Documentation.md](./Documentation.md).