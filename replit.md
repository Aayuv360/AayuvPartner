# Delivery Partner Management System

## Overview

This is a full-stack delivery partner management application built with React, TypeScript, Express.js, and PostgreSQL. The system provides a mobile-first interface for delivery partners to manage their orders, track earnings, and update their status and location in real-time.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand for authentication state and local state management
- **Data Fetching**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time Communication**: WebSocket for live order updates
- **Session Management**: Express sessions with PostgreSQL store
- **Authentication**: Header-based partner authentication

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
- Automatic geolocation tracking
- Location history storage
- Real-time location updates to server

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
- **PostgreSQL**: Primary database for data persistence
- **Drizzle**: ORM for type-safe database operations
- **Neon**: Serverless PostgreSQL hosting (configured)

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
- Drizzle migrations for schema management
- `db:push` script for development schema updates
- Environment variable configuration for database URL

## Changelog
- July 05, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.