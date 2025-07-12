# Delivery Partner Management System

## Overview

This is a full-stack delivery partner management application built with React, TypeScript, Express.js, and PostgreSQL. The system provides a mobile-first interface for delivery partners to manage their orders, track earnings, and update their status and location in real-time.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: React Router DOM for client-side routing
- **State Management**: Zustand for authentication state and local state management
- **Data Fetching**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: MongoDB with Mongoose ODM
- **Real-time Communication**: WebSocket for live order updates
- **Session Management**: Express sessions with in-memory store
- **Authentication**: Header-based partner authentication with MongoDB ObjectIds

### Mobile-First Design
- Responsive design optimized for mobile devices
- Touch-friendly interface with bottom navigation
- PWA-ready architecture for app-like experience

## Key Components

### Authentication System
- Partner registration and login functionality
- Persistent authentication state using Zustand with localStorage
- Header-based authentication for API requests

### Real-time Features
- WebSocket connection for live order updates
- Geolocation tracking for partner location updates
- Real-time status synchronization

### Order Management
- Order acceptance and status tracking
- Multi-stage order workflow (assigned → picked_up → on_the_way → delivered)
- Customer information and delivery address management

### Earnings Tracking
- Daily earnings calculation
- Historical earnings with date grouping
- Integration with order completion

### Location Services
- Automatic geolocation tracking with browser GPS
- Google Maps integration with real-time tracking
- Interactive maps with route planning and navigation
- Location history storage
- Real-time location updates to server via WebSocket

### Competitive Features (Zomato/Swiggy Parity)
- **Surge Pricing**: Dynamic pricing with real-time demand indicators and multipliers
- **Order Batching**: Group multiple orders for optimized routes and 40% bonus earnings
- **Shift Management**: Flexible working hours with preferred time slots and auto-accept settings
- **Daily Payouts**: Instant earnings withdrawal with minimum threshold controls
- **Dark Mode**: Complete theme switching with persistent user preference
- **Heat Maps**: Visual demand density with surge zones and hotspot indicators

## Data Flow

1. **Authentication Flow**: Partner logs in → JWT/session stored → Headers attached to requests
2. **Order Flow**: Orders created → WebSocket notification → Partner accepts → Status updates → Completion
3. **Location Flow**: Browser geolocation → Background updates → Server storage → Real-time sharing
4. **Earnings Flow**: Order completion → Automatic earning calculation → Dashboard updates

## External Dependencies

### Frontend Dependencies
- **@radix-ui/***: Headless UI components for accessibility
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight routing solution
- **zustand**: State management library
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Backend Dependencies
- **drizzle-orm**: Type-safe SQL query builder
- **@neondatabase/serverless**: PostgreSQL database adapter
- **express**: Web application framework
- **ws**: WebSocket library for real-time communication
- **zod**: Schema validation library

### Database
- **MongoDB**: Primary NoSQL database for data persistence
- **Mongoose**: ODM for type-safe database operations and schema validation
- **MongoDB Atlas**: Cloud-hosted MongoDB database with provided connection URI

## Deployment Strategy

### Development
- Vite dev server for frontend with HMR
- tsx for TypeScript execution in development
- Concurrent client and server development

### Production Build
- Vite builds optimized frontend bundle
- esbuild bundles server code for Node.js
- Static assets served from Express server
- Environment-based configuration

### Database Management
- MongoDB schemas with Mongoose for data modeling
- Automatic sample data initialization on first run
- Environment variable configuration for MongoDB connection URI

## Changelog
- July 05, 2025. Initial setup with PostgreSQL/Drizzle
- July 05, 2025. Successfully migrated from PostgreSQL/Drizzle to MongoDB/Mongoose per user requirements
- July 05, 2025. Migrated routing from wouter to React Router DOM per user requirements  
- July 05, 2025. Integrated Google Maps with GPS tracking using API key: AIzaSyAnwH0jPc54BR-sdRBybXkwIo5QjjGceSI
- July 05, 2025. Added competitive features matching Zomato/Swiggy: surge pricing, order batching, shift management, daily payouts, and dark mode theme
- July 05, 2025. Enhanced Google Maps features: Added partner location component with real-time GPS tracking and address display via reverse geocoding
- July 05, 2025. Added delivery zones component showing nearby high-demand areas with surge pricing indicators, distance calculation, and navigation integration
- July 05, 2025. Created route navigation component with Google Maps Directions API for real-time route planning, fuel cost calculation, and turn-by-turn navigation
- July 05, 2025. **Major Update**: Implemented mobile-first OTP authentication system for Indian users, replacing email-based auth with phone number + OTP verification for better user adoption in India. Updated to English-only interface per user request (removed Hindi language support).
- July 05, 2025. **Critical Features for India**: Added mandatory India-specific features including document verification system (Aadhaar, PAN, driving license, vehicle registration), Emergency SOS button for delivery partner safety, and Cash on Delivery (COD) management system. Updated profile page with tabbed interface for verification and safety features.
- July 05, 2025. **Production Ready**: Fixed all critical bugs including order ID parameter types, earnings data format handling, and WebSocket interference. Application fully functional with complete authentication system, order management, real-time tracking, and all India-specific features. Ready for production deployment.
- July 12, 2025. **Timezone Implementation**: Added comprehensive Asia/Kolkata (IST) timezone support using Luxon library. All date/time displays, earnings calculations, and order tracking now use Indian Standard Time. Created shared timezone utilities for consistent time handling across the application.
- July 12, 2025. **Enhanced Real-Time GPS Tracking**: Implemented comprehensive real-time location tracking system for active deliveries. Features include: live partner location updates via WebSocket, Google Maps integration with custom SVG markers, automatic route calculation with turn-by-turn directions, real-time location broadcasting to customers, location history storage, and seamless integration with order management system. Partners' GPS coordinates are automatically tracked and shared when orders are in 'picked_up' or 'on_the_way' status.

## User Preferences

Preferred communication style: Simple, everyday language.
Interface language: English only (Hindi language support removed per user request).