# Delivery Partner Management System

## Overview

A comprehensive full-stack delivery partner management application built for the Indian market, featuring real-time order tracking, GPS navigation, earnings management, and document verification. The system uses React with TypeScript for the frontend, Express.js for the backend, and is configured to work with both MongoDB (currently) and PostgreSQL (through Drizzle ORM).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development
- **UI Library**: Radix UI components with shadcn/ui for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: Zustand for authentication state with persistence
- **Data Fetching**: TanStack React Query for server state management
- **Routing**: React Router DOM for client-side navigation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: Currently MongoDB with Mongoose ODM, prepared for PostgreSQL migration via Drizzle ORM
- **Real-time Communication**: WebSocket server for live tracking and order updates
- **Authentication**: Session-based auth with express-session
- **API Design**: RESTful endpoints with WebSocket enhancement for real-time features

### Mobile-First Design
- Responsive design optimized for mobile delivery partners
- Bottom navigation for easy thumb navigation
- Floating action buttons for quick status changes
- Touch-friendly interface elements

## Key Components

### Authentication System
- **OTP-based login**: SMS verification for Indian phone numbers
- **Registration flow**: Multi-step partner onboarding with document upload
- **Session management**: Secure session handling with automatic token refresh
- **Role-based access**: Partner-specific features and permissions

### Real-time Tracking
- **GPS integration**: Continuous location tracking with geolocation API
- **Google Maps integration**: Route optimization and navigation
- **WebSocket communication**: Live order updates and location sharing
- **Battery optimization**: Efficient location updates to preserve device battery

### Order Management
- **Order lifecycle**: Complete workflow from assignment to delivery
- **Batch processing**: Multiple order handling for efficiency
- **Status updates**: Real-time order status changes with customer notifications
- **Route optimization**: Smart routing for multiple deliveries

### Earnings & Payments
- **Daily tracking**: Real-time earnings calculation and display
- **Payout system**: Instant and daily payout options
- **Cash on Delivery**: COD collection and reconciliation
- **Performance metrics**: Detailed analytics and performance tracking

### Document Verification
- **KYC compliance**: Aadhaar, PAN, and driving license verification
- **Document upload**: Secure file handling and storage
- **Verification workflow**: Multi-step approval process
- **Compliance tracking**: Status monitoring and updates

## Data Flow

### Client-Server Communication
1. **API Requests**: RESTful HTTP requests for CRUD operations
2. **WebSocket Events**: Real-time updates for orders, location, and notifications
3. **Authentication**: Session-based auth with secure cookie handling
4. **File Uploads**: Multipart form data for document verification

### Database Schema
- **Delivery Partners**: Complete partner profiles with verification status
- **Orders**: Full order lifecycle with customer and address information
- **Earnings**: Detailed earnings tracking with payout history
- **Locations**: Real-time location tracking and history
- **Customers**: Customer information and delivery addresses

### State Management
- **Client State**: Zustand stores for authentication and UI state
- **Server State**: React Query for API data caching and synchronization
- **Real-time State**: WebSocket event handling for live updates

## External Dependencies

### Google Services
- **Google Maps API**: Maps, geocoding, and directions
- **Google Places API**: Address autocomplete and validation

### Third-party Libraries
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Form Handling**: React Hook Form with Zod validation
- **Date/Time**: Luxon for timezone-aware date handling (IST focus)
- **Authentication**: bcrypt for password hashing

### Development Tools
- **Build Tool**: Vite for fast development and optimized builds
- **Type Safety**: TypeScript with strict configuration
- **Code Quality**: ESLint and Prettier (configured via package.json)

## Deployment Strategy

### Database Migration
- **Current**: MongoDB with Mongoose for rapid development
- **Target**: PostgreSQL with Drizzle ORM for production scalability
- **Migration Path**: Drizzle configuration already in place for seamless transition

### Environment Configuration
- **Development**: Local MongoDB with hot reloading
- **Production**: Containerized deployment with PostgreSQL
- **Environment Variables**: Secure configuration for API keys and database URLs

### Scalability Considerations
- **WebSocket Scaling**: Designed for horizontal scaling with Redis adapter
- **Database Optimization**: Indexed queries and efficient data modeling
- **CDN Integration**: Static asset optimization for mobile networks
- **Caching Strategy**: Multi-layer caching for improved performance

### Security Features
- **Input Validation**: Comprehensive validation using Zod schemas
- **Session Security**: Secure cookie configuration with CSRF protection
- **File Upload Security**: Validated file types and size limits
- **API Rate Limiting**: Protection against abuse and spam

### Indian Market Specific Features
- **Timezone Handling**: IST (Asia/Kolkata) timezone management throughout
- **Regional Compliance**: Aadhaar and PAN integration for KYC
- **Local Payment Methods**: UPI integration and COD handling
- **Regional Languages**: Prepared for multi-language support