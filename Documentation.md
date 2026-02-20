# Documentation - Food Delivery Platform

## 1. Project Overview

The Food Delivery Platform is a fully functional system for managing restaurant orders and deliveries. The project was developed using Angular for the frontend, Node.js with Express for the backend, and SQLite as the database.

The platform supports two main actors:
- **Restaurant Owner**: Manages menus, receives and processes orders, tracks order status, and analyzes sales data
- **Customer (User)**: Browses restaurants, places orders, tracks delivery status, and provides feedback through reviews

## 2. System Architecture

### 2.1 Frontend Architecture (Angular v21)

The Angular application follows a modular architecture:

```
frontend/
├── src/
│   ├── app/
│   │   ├── core/                    # Central services, guards, interceptors
│   │   │   ├── services/            # API calls (auth, restaurant, customer)
│   │   │   ├── guards/              # Route protection (AuthGuard, RoleGuard)
│   │   │   └── interceptors/        # HTTP interceptor for JWT
│   │   ├── shared/                  # Reusable components
│   │   │   ├── components/          # Navigation, error dialogs
│   │   │   └── pipes/               # Custom pipes
│   │   ├── features/                # Feature modules per role
│   │   │   ├── public/              # Login, register, landing page
│   │   │   ├── customer/            # Customer features
│   │   │   │   ├── restaurant-browsing/
│   │   │   │   ├── menu-view/
│   │   │   │   ├── cart-checkout/
│   │   │   │   ├── order-tracking/
│   │   │   │   ├── profile/
│   │   │   │   └── restaurant-reviews/
│   │   │   └── restaurant/          # Restaurant owner features
│   │   │       ├── menu-management/
│   │   │       ├── order-overview/
│   │   │       ├── profile-management/
│   │   │       └── analytics/
│   │   └── layout/                  # Main layout components
│   └── environments/                # Environment variables
└── angular.json
```

### 2.2 Backend Architecture (Node.js + Express)

The backend follows the Repository Pattern with clear separation of concerns:

```
backend/src/
├── api/
│   ├── routes/                      # Express route definitions
│   └── controllers/                 # Request handlers with validation
├── business/                        # Business logic layer
│   ├── auth.service.ts
│   ├── restaurant-profile.service.ts
│   ├── menu-management.service.ts
│   ├── order.service.ts
│   ├── analytics.service.ts
│   ├── customer-registration.service.ts
│   ├── restaurant-browsing.service.ts
│   └── ... additional services
├── repositories/                    # Database access layer
│   ├── restaurant.repository.ts
│   ├── order.repository.ts
│   ├── dish.repository.ts
│   └── ... additional repositories
├── db/
│   ├── migrations/                  # Versioned SQL migrations
│   ├── init.ts                      # Database initialization
│   └── migration-runner.ts
├── middleware/                      # Express middleware
│   ├── auth.middleware.ts           # JWT verification
│   └── error.middleware.ts          # Error handling
├── config/
│   └── config.ts                    # Environment configuration
├── types/
│   └── auth.types.ts               # TypeScript interfaces
└── app.ts                           # Express app entry point
```

### 2.3 Database Schema

The database implements the following main tables:

- **users**: Stores authentication credentials for customers and restaurant owners
- **restaurants**: Restaurant information, contact details, opening hours
- **restaurant_profiles**: Detailed restaurant profiles (description, zones, categories)
- **categories**: Menu categories (Pasta, Pizza, Salads, etc.)
- **dishes**: Individual menu items with prices and descriptions
- **orders**: Orders with status tracking
- **order_items**: Line items within an order (one-to-many relationship)
- **reviews**: Customer reviews for restaurants and dishes
- **vouchers**: Promotional codes with discount percentages

All database migration scripts are versioned in `backend/src/db/migrations/` and are automatically executed on startup.

## 3. Development Timeline and Module Responsibilities

### Team Member Assignments

- **Shared Infrastructure**: Both developers
- **Restaurant Owner Module**: **Gernot Oberrauner**
- **Customer (User) Module**: **Viktor**

### 3.1 Phase 1: Shared Infrastructure (Joint Development)

**Timeline**: November - December 2025

The foundational infrastructure was jointly implemented by both developers. This forms the base upon which both roles are built:

1. **Project Structure and Initial Setup**
   - Angular v21 and Node.js v24 project structure established
   - TypeScript configurations for frontend and backend
   - Build and deployment scripts (PowerShell) created
   - Git repository and CI/CD foundations

2. **Authentication & Authorization System**
   - Password hashing with Argon2id implemented (secure storage)
   - JWT-based authentication without OpenID Connect
   - Login and registration endpoints developed
   - Auth guard and HTTP interceptor for Angular
   - Validation with 422 Unprocessable Entity responses for frontend error handling
   - Role-based access control (RBAC) for both roles

3. **Database Core Infrastructure**
   - SQLite database with complete schema design
   - Core tables for users, restaurants, and basic entities
   - Migration system with versioned SQL files
   - Repository pattern established
   - Initial configuration and setup

### 3.2 Phase 2: Restaurant Owner Module

**Developer**: Gernot Oberrauner
**Timeline**: December 2025 - January 2026

After establishing the shared infrastructure, the complete Restaurant Owner module was developed by Gernot, enabling restaurant operators to manage their business on the platform.

**Database Extensions (by Gernot):**
- Extended schema to support orders, order items, reviews, and vouchers
- Added restaurant profile enhancements
- Implemented analytics data structures
- Optimized relationships between entities
- Set up proper indexing for performance

**Features Implemented:**

1. **Menu Management System**
   - Create, edit, and delete categories
   - Add dishes with prices, descriptions, and image references
   - Backend validation enforcement
   - Angular Material UI for menu management
   - Complete CRUD operations via REST API

2. **Restaurant Profile Management**
   - Edit restaurant name, contact information, and address
   - Configure and save opening hours
   - Select and manage available categories
   - Validation with clean error responses
   - REST endpoints for profile retrieval and updates

3. **Order Reception & Management**
   - Dashboard with overview of all incoming orders
   - Real-time order display
   - Accept or reject orders with validation
   - Manage order status through workflow (received → preparing → ready → dispatched)
   - Backend endpoints for status updates with error handling

4. **Analytics Dashboard**
   - Daily and weekly aggregated order statistics
   - Identify and visualize best-selling dishes
   - Revenue data and order volume over time
   - Business insights for decision making

**Seed Data Implementation (by Gernot):**
- Developed comprehensive test data generation
- Sample customer and restaurant owner accounts
- Example restaurants with complete menus
- Orders at various statuses for testing
- Reviews and ratings data
- Promotional vouchers and discount codes
- Realistic price points and quantities
- Idempotent seed script that safely runs multiple times

### 3.3 Phase 3: Customer (User) Module

**Developer**: Viktor
**Timeline**: January 2026

The Customer module was developed by Viktor, enabling end users to discover restaurants, place orders, and provide feedback.

**Features Implemented:**

1. **Customer Profile Management**
   - View and edit customer profile
   - Update personal data (name, address)
   - Change password and manage security
   - Save and manage delivery addresses

2. **Restaurant Browsing & Discovery**
   - Restaurant overview page with category filtering
   - Restaurant details with opening hours and contact information
   - Dynamic loading of restaurant data
   - User-friendly navigation through available restaurants

3. **Menu View & Categorization**
   - Display complete menu of a restaurant
   - Group dishes by categories (Pasta, Pizza, etc.)
   - Present dishes with descriptions, prices, and images
   - Intuitive menu navigation

4. **Shopping Cart & Checkout Process**
   - Add and manage dishes in shopping cart
   - Adjust quantities and remove items
   - Place orders with full validation
   - Apply vouchers and discount codes
   - Final order review before confirmation

5. **Order Placement & Confirmation**
   - Secure REST API for order creation
   - Order confirmation with details
   - Persistence of order and item data
   - Error handling and validation

6. **Restaurant & Dish Reviews**
   - Rate restaurants and dishes (star system)
   - Leave textual reviews and comments
   - Store ratings and make visible to other customers
   - Feedback system for continuous improvement

### 3.4 Stabilization and Bug Fixes

Throughout the project, various stability improvements were made:

- **Token and Session Management**: Token expiration handling in app component with startup verification
- **Login Error Handling**: Fixes for login errors to enable multiple login attempts
- **UI Consistency**: Category normalization for uniform display
- **Seed Data**: Improved test data for realistic scenarios
- **Deployment Optimizations**: Improvements to build and reset scripts

## 4. Team Contributions and Task Assignments

### Shared Components (Both Developers)
- Project setup and overall system architecture
- Authentication & authorization system with JWT
- Database design, schema, and migration system
- Validation framework (both backend and frontend)
- Error handling and correct HTTP status codes
- Shared UI components (navigation bar, error dialogs, modals)
- HTTP interceptor for JWT tokens
- Route guards for role-based access control
- TypeScript configuration and build process

### Restaurant Owner Module (Gernot Oberrauner)
- **Menu Management System** - Complete CRUD for categories and dishes
- **Restaurant Profile Management** - Profile data, opening hours, categories
- **Order Reception & Management** - Order dashboard, status updates
- **Analytics Dashboard** - Statistics, best-selling dishes, revenue
- Complete database schema extensions for restaurant features
- All backend endpoints and business logic for restaurant features
- All Angular components and UI for restaurant owner area
- Order status management and validation logic
- **Seed data generation** - Comprehensive test data implementation

### Customer (User) Module (Viktor)
- **Restaurant Browsing & Discovery** - Overview, filtering, details
- **Menu View with Categorization** - Display of menu items organized by category
- **Shopping Cart & Checkout** - Cart management, order placement
- **Order Tracking** - Order overview and status
- **Customer Profile Management** - Profile editing, addresses
- **Reviews & Feedback System** - Restaurant and dish ratings
- All backend endpoints and business logic for customer features
- All Angular components and UI for customer area

## 5. Implemented Core Features and Requirements Coverage

### Technologies Used (Per Requirements)
- Angular v21 for frontend
- Node.js v24 with Express for REST API backend
- SQLite for data persistence
- JWT-based authentication without OpenID Connect
- Argon2id for secure password storage
- Repository pattern for database access
- Role-Based Access Control (RBAC)

### Important Note on Delivery Zone Implementation

**Critical Note**: The only feature from the requirements that was **not implemented** is location/radius-based delivery zone management.

According to the requirements, one of the following methods should have been used:
- Grid-based coordinates with Manhattan distance
- Area/zone labels (e.g., A1, B2)
- Named delivery zones (North, South, Central)
- Radius-based simulation with distance

**This functionality was not implemented.** This means:
- Restaurants cannot define delivery zones
- Automatic delivery time calculation does not consider distance
- Geographic filtering of restaurants based on customer location is not available

**All other requirements for both roles (Restaurant Owner and Customer) have been fully implemented.**

### Common Features (All Roles)
- Email and password authentication
- Password hashing with Argon2id
- JWT-based sessions
- Responsive UI for desktop, tablet, and smartphone
- Input validation (frontend as UX, backend as security)
- Error handling with correct HTTP status codes
- SQLite database with migration system

### Restaurant Owner Features
- Manage menus with categories and dishes
- Restaurant profile with opening hours and contact details
- Real-time order reception management
- Order status management (accept → reject → preparing → ready → dispatched)
- Daily/weekly analytics dashboard
- Track best-selling dishes

### Customer Features
- Browse and filter restaurants
- Detailed restaurant and menu overview
- Shopping cart with modification options
- Place orders with voucher application
- Order tracking
- Rating system for restaurants and dishes
- Profile management

## 6. Technical Highlights and Design Decisions

### Security & Validation
- Backend validates ALL inputs before persistence (independent of frontend)
- State-of-the-art password hashing (Argon2id)
- JWT token handling with configurable secret and expiration
- CORS properly configured for separate frontend/backend deployment
- No sensitive data exposed in error messages

### API Design
- RESTful principles consistently applied
- All endpoints prefixed with `/api`
- Proper HTTP status codes (200, 401, 404, 409, 422, 500)
- Consistent error response format
- Business logic only in service layer, never in routes/controllers

### Database
- Versioned migration system
- Test seed data for development
- Proper foreign keys and relationships
- SQLite for simple deployment

## 7. Build and Deployment Scripts

The project includes several PowerShell scripts to automate common tasks:

### build-and-run.ps1 - Main Script for Development and Deployment

The central script for complete application management:

```powershell
.\scripts\build-and-run.ps1 -Mode Development
.\scripts\build-and-run.ps1 -Mode Deployment
```

**Development Mode:**
- Installs or updates npm dependencies for backend and frontend
- Creates `.env` file if not present
- Initializes SQLite database with migrations
- Loads seed data
- Starts backend server on port 3000 (Express)
- Starts frontend development server on port 4200 (Angular)
- Opens both applications in browser automatically

**Deployment Mode:**
- Compiles Node.js backend to JavaScript
- Generates Angular production build with AOT compilation
- Optimizes all JavaScript bundles (minification, tree shaking)
- Creates `deploy/backend/` directory
- Copies compiled backend and frontend assets
- Generates `start-server.ps1` for production startup

### seed-test-data.ps1 - Database Population for Development

This script populates the database with realistic test data:

```bash
cd backend
npm run seed
```

**What the seeding does:**

1. **Adds Users:**
   - Test customer accounts with various addresses
   - Test restaurant owner accounts
   - Predefined credentials for manual testing

2. **Creates Restaurants** with:
   - Name, phone, email, address
   - Opening hours (Mon-Sun, different times)
   - Descriptions and categories
   - Restaurant profiles with details

3. **Creates Menus:**
   - Categories (Pasta, Pizza, Salads, Desserts, etc.)
   - Dishes with prices (€10-€25 range)
   - Descriptions and image references
   - Realistic combinations

4. **Generates Example Orders:**
   - Order items from customers
   - Various order statuses (received, preparing, ready, dispatched)
   - Order timestamps for analytics
   - Discount codes and vouchers

5. **Creates Reviews:**
   - Customer reviews for restaurants (1-5 stars)
   - Dish reviews with comments
   - Timestamps for authenticity

6. **Sets up Vouchers:**
   - Example discount codes (e.g., "SUMMER2026", "WELCOME10")
   - Various discount percentages
   - Validity dates

**Idempotency**: The script is safe to run multiple times and creates no duplicates on repeated execution.

### reset-and-run.ps1 - Complete Database Reset

Deletes the complete database and starts fresh:

```powershell
.\scripts\reset-and-run.ps1
```

Useful for:
- Cleanup after tests
- Loss of test data
- Return to clean state
- Development with fresh data

The script:
1. Deletes `backend/database.sqlite` if present
2. Executes all migrations
3. Loads seed data
4. Starts backend and frontend

### install.ps1 - Dependency Installation

Installs all npm dependencies:

```powershell
.\scripts\install.ps1
```

Executes:
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### start.ps1 - Quick Start

Starts backend and frontend without reinstalling dependencies:

```powershell
.\scripts\start.ps1
```

Useful when all dependencies are already installed.

## 8. Setup and Execution

### Installation
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd frontend
npm install
```

### Environment Configuration
Create `backend/.env`:
```
JWT_SECRET=your-secure-random-key
PORT=3000
CORS_ORIGIN=http://localhost:4200
```

### Starting Development
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

The application is then accessible at:
- Frontend: http://localhost:4200
- Backend API: http://localhost:3000/api

### Database Reset
```powershell
# Reinitialize with fresh test data
.\scripts\reset-and-run.ps1
```

## 9. Technical Highlights and Design Decisions

### Architecture Principles
- **Repository Pattern**: All database operations isolated in repository layer
- **Business Logic Layer**: All business decisions exclusively in service classes
- **Validation Strategy**: Frontend validation for UX only, backend validation is mandatory
- **Security**: State-of-the-art password hashing, proper JWT handling, no sensitive data leaks

### Important Technical Decisions
1. SQLite for simplicity and portability
2. JWT without refresh tokens for simplicity
3. Argon2id hashing for password security
4. Repository pattern for database abstraction
5. Business logic separated from routes and controllers

## 10. Lessons Learned and Challenges

### Key Insights
1. **Separation of Concerns**: Clear separation of business logic in service layer is essential
2. **Validation Strategy**: Backend validation MUST be independent of frontend
3. **Error Handling**: Consistent error handling across all layers is critical
4. **Migration System**: Versioned DB migrations make teamwork significantly easier

### Technical Challenges
- JWT token expiration and refresh handling required multiple iterations
- Order status management with correct validation flow
- Category normalization for consistent UI display
- Migration system for coordinated database changes across team

## 11. Production Deployment

The application is production-ready and can be built with the deployment script:

```powershell
.\scripts\build-and-run.ps1 -Mode Deployment
```

This creates a `deploy/` folder with:
- Compiled backend
- Built frontend (static assets)
- Start script for production

The production server automatically hosts both applications:
- Frontend at `/`
- API at `/api/*`

---

**Last Updated**: February 2026
**Project Status**: MVP Functional, all core features implemented. Only missing component: Location/radius-based delivery zone management (see Section 5 for details).
