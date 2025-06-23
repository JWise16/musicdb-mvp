# MusicDB MVP

A comprehensive music venue and event management platform that helps venues track their events, analyze performance, and discover insights from the broader music industry.

## 🚀 New User Experience

We've implemented a streamlined onboarding process to help new users get started quickly:

### Welcome Flow
- **Welcome Modal**: New users see a friendly welcome message explaining the platform
- **Step-by-Step Guidance**: Clear instructions for venue verification and event reporting
- **Progress Tracking**: Visual progress indicators showing completion status

### Onboarding Requirements
To unlock full platform access, users must:
1. **Verify their venue** - Search for existing venues or create a new one
2. **Report 3 events** - Add past or upcoming shows to the database
3. **Access everything for free** - Unlock all features and insights

### Features
- **Simplified Event Form**: Streamlined form specifically for onboarding with helpful tips
- **Progress Visualization**: Real-time progress tracking with percentage completion
- **Celebration Modal**: Congratulations screen when onboarding is complete
- **Guided Navigation**: Clear calls-to-action directing users to next steps

## 🎯 Key Features

### For Venues
- **Event Management**: Add, edit, and track events with detailed analytics
- **Performance Insights**: View ticket sales, attendance, and revenue data
- **Artist Management**: Track performers and their performance metrics
- **Venue Analytics**: Comprehensive dashboard with key performance indicators

### For the Industry
- **Events Database**: Browse events from venues across the country
- **Market Insights**: Discover trends and patterns in the music industry
- **Networking**: Connect with other venues and industry professionals

## 🛠 Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Deployment**: Vite for development and build

## 📁 Project Structure

```
src/
├── components/
│   ├── features/
│   │   ├── onboarding/          # New onboarding components
│   │   │   ├── OnboardingModal.tsx
│   │   │   ├── OnboardingEventForm.tsx
│   │   │   └── OnboardingComplete.tsx
│   │   ├── dashboard/           # Dashboard analytics
│   │   ├── events/              # Event management
│   │   └── venues/              # Venue management
│   ├── layout/                  # Layout components
│   └── common/                  # Shared components
├── hooks/
│   ├── useAuth.ts              # Authentication
│   └── useOnboarding.ts        # New onboarding state management
├── pages/                      # Page components
├── services/                   # API services
└── types/                      # TypeScript definitions
```

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd musicdb-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🎨 Design System

The platform uses a custom design system built with Tailwind CSS:

- **Colors**: Custom accent colors for music industry branding
- **Components**: Reusable UI components with consistent styling
- **Typography**: Clean, readable fonts optimized for data display
- **Spacing**: Consistent spacing system for layout harmony

## 📊 Database Schema

The platform uses Supabase with the following main tables:
- `venues` - Venue information and details
- `events` - Event data and financial metrics
- `artists` - Performer information
- `event_artists` - Many-to-many relationship between events and artists
- `user_venues` - User associations with venues
- `event_metrics` - Detailed performance metrics

## 🔐 Authentication

- Supabase Auth for user management
- Protected routes for authenticated users
- Role-based access control for venue associations

## 📈 Analytics

- Real-time dashboard with key metrics
- Time-based filtering (YTD, MTD, All Time)
- Performance comparisons and trends
- Export capabilities for reporting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support or questions, please contact the development team or create an issue in the repository.
