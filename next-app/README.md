# Fortnite Island Analyzer Web Interface

A Next.js web interface for the Fortnite Island Analyzer project. This application allows users to:

- View Fortnite island data and statistics
- Search for islands by code
- Visualize player counts over time
- Manage user profiles

## Features

- **Island Data Visualization**: Interactive charts showing player count trends
- **Island Search**: Look up any Fortnite Creative island by code
- **User Profiles**: Demo mode for user profile management
- **Responsive Design**: Works on desktop and mobile

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.7+ (for the backend scripts)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your environment variables:

```
# Supabase Configuration (optional - demo mode works without this)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Fortnite API Configuration
FORTNITE_API_KEY=your-fortnite-api-key
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
next-app/
├── app/                    # Next.js app directory
│   ├── api/                # API routes
│   │   ├── health/         # Health check endpoint
│   │   ├── profile/        # User profile endpoints
│   │   └── scrape/         # Island data scraping endpoint
│   ├── auth/               # Authentication pages
│   └── dashboard/          # Dashboard page
├── public/                 # Static files
├── types/                  # TypeScript type definitions
├── utils/                  # Utility functions
└── next.config.ts          # Next.js configuration
```

## API Routes

- `GET /api/health` - Health check endpoint
- `GET /api/profile` - Get user profile
- `POST /api/profile` - Update user profile
- `POST /api/scrape` - Fetch island data by code

## Demo Mode

The application includes a demo mode that works without Supabase authentication. This allows you to test the functionality without setting up a Supabase project.

## Building for Production

```bash
npm run build
npm start
```

## Deployment

This Next.js app can be deployed to Vercel or any other Next.js-compatible hosting service.
