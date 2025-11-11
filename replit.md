# WeooWallet - Digital Wallet Application

## Overview

WeooWallet is a secure digital wallet application inspired by leading Indian fintech platforms (Paytm, PhonePe, Google Pay). The application enables users to create accounts with unique WeooWallet IDs (WWID), manage balances, and perform secure financial transactions. The system emphasizes security, trust, and simplicity with a mobile-first design approach.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching
- Tailwind CSS for utility-first styling with custom design tokens

**UI Component System:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library (New York style variant) for consistent, customizable UI components
- Custom design system with fintech-focused color schemes and spacing units
- Mobile-first responsive design with desktop support

**State Management Strategy:**
- Server state managed through TanStack Query with aggressive caching (staleTime: Infinity)
- Session-based authentication state
- Form state handled through React Hook Form with Zod validation resolvers

**Routing Structure:**
- Multi-step registration flow: Register → WWID Setup → PIN Setup
- Login flow: Login → PIN Verification → Dashboard
- Protected routes redirect unauthenticated users to login

**Design Philosophy:**
- Security-first visual indicators (especially for S-PIN entry)
- Minimal cognitive load with single-action focused interfaces
- Trust and professionalism appropriate for financial applications
- Reference-based approach drawing from established fintech UX patterns

### Backend Architecture

**Framework & Runtime:**
- Express.js server running on Node.js
- TypeScript for type safety across the stack
- ESM module system

**Session Management:**
- Express-session middleware for stateful authentication
- Session store configured for production security (httpOnly, secure cookies)
- Multi-step registration data stored in session between steps
- 7-day session expiration

**API Design:**
- RESTful endpoints under `/api` namespace
- Validation layer using Zod schemas shared between client and server
- Consistent error response format
- Request/response logging middleware for debugging

**Authentication Flow:**
1. Basic registration (username, phone, password)
2. WWID creation and uniqueness validation
3. S-PIN setup with confirmation
4. Login with username/phone and password
5. S-PIN verification before dashboard access

**Security Measures:**
- Password hashing with bcrypt (10 salt rounds)
- S-PIN stored as hashed values
- Session-based authentication prevents token theft
- Input validation on all endpoints using Zod schemas
- CSRF protection through session configuration

### Data Storage

**Database:**
- PostgreSQL via Neon serverless driver
- Drizzle ORM for type-safe database queries and schema management
- WebSocket connection support for serverless environments

**Schema Design:**
- Users table with constraints:
  - UUID primary keys (generated server-side)
  - Unique constraints on username, phone, and WWID
  - Numeric balance field with precision (10,2) for accurate currency handling
  - Hashed password and S-PIN storage

**Data Access Layer:**
- Storage interface pattern (IStorage) for testability and future database migration flexibility
- Centralized database queries through storage service
- Prepared statements via Drizzle ORM prevent SQL injection

**Migration Strategy:**
- Drizzle Kit for schema migrations
- Migration files generated in `/migrations` directory
- Push-based deployment for schema updates

### External Dependencies

**Core Infrastructure:**
- Neon Database (PostgreSQL): Serverless database hosting with WebSocket support
- Express-session with connect-pg-simple: PostgreSQL-backed session store for production scalability

**Authentication & Security:**
- bcrypt: Password and S-PIN hashing with configurable salt rounds

**Frontend Libraries:**
- @tanstack/react-query: Server state management, caching, and synchronization
- wouter: Lightweight routing (4x smaller than React Router)
- react-hook-form: Form state management with performance optimization
- @hookform/resolvers: Zod schema integration for form validation
- zod: Runtime type validation shared across client and server

**UI Component Dependencies:**
- @radix-ui/*: Headless, accessible component primitives (20+ components)
- class-variance-authority: Component variant styling
- tailwind-merge & clsx: Intelligent CSS class merging
- lucide-react: Icon library
- cmdk: Command palette component
- vaul: Drawer component
- date-fns: Date manipulation and formatting

**Development Tools:**
- Vite: Fast development server with HMR
- TypeScript: Static type checking
- Drizzle Kit: Database schema management and migrations
- tsx: TypeScript execution for development server
- esbuild: Production build bundling for server code

**Replit-Specific:**
- @replit/vite-plugin-runtime-error-modal: Development error overlay
- @replit/vite-plugin-cartographer: Development tooling integration
- @replit/vite-plugin-dev-banner: Development environment indicator

**Design System:**
- Tailwind CSS: Utility-first CSS framework
- Custom CSS variables for theming
- Google Fonts: Inter, DM Sans, Fira Code, Geist Mono, Architects Daughter

**Key Architectural Decisions:**

1. **Monorepo Structure**: Client and server code in single repository with shared schema definitions to ensure type consistency
2. **Session-Based Auth**: Chosen over JWT for enhanced security in financial application context
3. **Multi-Step Registration**: Breaks complex signup into manageable steps, reducing cognitive load
4. **Shared Validation**: Zod schemas used on both client and server prevent validation drift
5. **Mobile-First Design**: Primary target is mobile users, with responsive desktop support
6. **Type Safety**: End-to-end TypeScript from database to UI components
7. **Optimistic Caching**: Aggressive query caching strategy reduces unnecessary network requests
8. **Component Composition**: Radix UI primitives allow for flexible, accessible component building