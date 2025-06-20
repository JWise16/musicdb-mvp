# MusicDB MVP

A comprehensive music venue and event management system built with React, TypeScript, and Supabase.

## 🎯 Overview

MusicDB MVP is a modern web application designed to help venue managers and event organizers track events, manage artists, and analyze performance metrics. The system provides role-based access control with secure Row Level Security (RLS) policies.

## 🛠️ Tech Stack

- **Frontend**: React 19.1.0 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Icons**: Heroicons
- **Routing**: React Router DOM

## 🗄️ Database Schema

### Tables Overview

The database contains **6 tables** in the public schema:

| Table | Purpose | Records |
|-------|---------|---------|
| `artists` | Store artist information | TBD |
| `events` | Track venue events | TBD |
| `venues` | Venue details and locations | TBD |
| `event_artists` | Many-to-many relationship between events and artists | TBD |
| `event_metrics` | Performance analytics and financial data | TBD |
| `user_venues` | User-venue associations with roles | TBD |

### Table Details

#### `artists`
- **Primary Key**: `id` (UUID, auto-generated)
- **Required Fields**: `name` (text)
- **Optional Fields**: `genre`, `description`, `contact_info`, `social_media` (JSONB)
- **Timestamps**: `created_at`, `updated_at`

#### `events`
- **Primary Key**: `id` (UUID, auto-generated)
- **Required Fields**: `name`, `date`, `ticket_price`, `total_tickets`
- **Optional Fields**: `venue_id`, `tickets_sold`, `bar_sales`, `notes`
- **Foreign Keys**: `venue_id` → `venues.id`
- **Timestamps**: `created_at`, `updated_at`

#### `venues`
- **Primary Key**: `id` (UUID, auto-generated)
- **Required Fields**: `name`, `location`, `address`
- **Optional Fields**: `capacity`, `description`, `contact_email`, `contact_phone`
- **Timestamps**: `created_at`, `updated_at`

#### `event_artists`
- **Primary Key**: `id` (UUID, auto-generated)
- **Foreign Keys**: 
  - `event_id` → `events.id`
  - `artist_id` → `artists.id`
- **Optional Fields**: `is_headliner` (boolean, default: false), `performance_order`
- **Timestamps**: `created_at`

#### `event_metrics`
- **Primary Key**: `id` (UUID, auto-generated)
- **Foreign Keys**: `event_id` → `events.id`
- **Optional Fields**: `attendance`, `bar_sales_per_attendee`, `ticket_revenue`, `total_revenue`
- **Visibility**: `is_public` (boolean, default: true)
- **Timestamps**: `created_at`, `updated_at`

#### `user_venues`
- **Primary Key**: `id` (UUID, auto-generated)
- **Foreign Keys**: `venue_id` → `venues.id`
- **Required Fields**: `role` (text)
- **Unique Constraint**: `(user_id, venue_id)` - prevents duplicate associations
- **Timestamps**: `created_at`

## 🔐 Row Level Security (RLS)

**All tables have RLS enabled** with comprehensive security policies:

### Artists Table
- ✅ **Public Read Access**: Everyone can view artists
- ✅ **Authenticated Create**: Users can create new artists

### Events Table
- ✅ **Authenticated Read**: Only authenticated users can view events
- ✅ **Venue Manager Create**: Users can only create events for venues they manage
- ✅ **Venue Manager Update**: Users can only update events for venues they manage
- ✅ **Venue Manager Read**: Users can only view events for venues they manage

### Venues Table
- ✅ **Admin Read All**: Users with admin role can view all venues
- ✅ **Authenticated Create**: Any authenticated user can create venues
- ✅ **Authenticated Search**: All authenticated users can view venues for search
- ✅ **Venue Manager Update**: Users can only update venues they manage
- ✅ **Venue Manager Read**: Users can only view venues they manage

### Event Artists Table
- ✅ **Venue Manager Create**: Users can only create event-artist relationships for their venues
- ✅ **Venue Manager Update**: Users can only update event-artist relationships for their venues
- ✅ **Venue Manager Read**: Users can only view event-artist relationships for their venues

### Event Metrics Table
- ✅ **Public Metrics**: Public metrics are viewable by all users
- ✅ **Venue Manager Create**: Users can only create metrics for their venue events
- ✅ **Venue Manager Read**: Users can only view metrics for their venue events

### User Venues Table
- ✅ **Self-Management**: Users can only manage their own venue associations
- ✅ **CRUD Operations**: Full CRUD access for own records

## 🔗 Database Relationships

```
venues (1) ←→ (many) events
events (many) ←→ (many) artists (via event_artists)
events (1) ←→ (many) event_metrics
venues (1) ←→ (many) user_venues
```

## 📊 Indexes

- **Primary Keys**: All tables have B-tree indexes on their UUID primary keys
- **Unique Constraint**: `user_venues` has a unique composite index on `(user_id, venue_id)`

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── features/        # Feature-specific components
│   └── layout/          # Layout components
├── pages/               # Route components
├── services/            # API service functions
├── types/               # TypeScript type definitions
├── hooks/               # Custom React hooks
└── utils/               # Utility functions
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### TypeScript

The project uses TypeScript with strict type checking. Database types are automatically generated from Supabase and available in `src/types/database.types.ts`.

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

This is a private MVP project. For questions or issues, please contact the development team.
