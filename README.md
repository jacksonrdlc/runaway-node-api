# Runaway Node API

A Node.js Express API that integrates with Supabase to manage activities, athletes, and OAuth tokens. This API serves as a backend service for managing Strava activities and athlete data.

## Features

- Activity management (CRUD operations)
- Athlete profile and stats management
- OAuth token management for Strava integration
- Supabase database integration
- RESTful API endpoints

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API Documentation**: JSDoc

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account and project
- Strava API credentials (for OAuth integration)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/runaway-node-api.git
cd runaway-node-api
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
PORT=3000
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on port 3000 (or the port specified in your .env file).

## API Endpoints

### Activities
- `GET /activities` - Get all activities
- `GET /activities/:id` - Get activity by ID
- `POST /activities` - Create new activity

### Tokens
- `POST /tokens` - Update tokens (refresh and access)
- `GET /tokens/:user_id` - Get access token by user ID
- `GET /refresh-tokens/:user_id` - Get refresh token by user ID

### Athletes
- `POST /athletes/:id` - Update athlete profile
- `POST /athletes/:id/stats` - Update athlete statistics

## Dependencies

### Production Dependencies
- `express`: ^4.x - Web framework
- `@supabase/supabase-js`: ^2.x - Supabase client
- `dotenv`: ^16.x - Environment variable management
- `cors`: ^2.8.5 - Cross-origin resource sharing

### Development Dependencies
- `nodemon`: ^3.x - Auto-reload for development

## Database Schema

### Tokens Table
```sql
create table tokens (
    user_id text primary key,
    refresh_token text not null,
    access_token text not null,
    expires_at timestamp with time zone not null,
    updated_at timestamp with time zone not null
);
```

### Activities Table
```sql
create table activities (
    id bigint primary key generated always as identity,
    external_id text,
    upload_id bigint,
    name text,
    detail text,
    distance double precision,
    moving_time double precision,
    elapsed_time double precision,
    high_elevation double precision,
    low_elevation double precision,
    total_elevation_gain double precision,
    start_date timestamp with time zone,
    start_date_local timestamp with time zone,
    time_zone text,
    achievement_count integer,
    kudos_count integer,
    comment_count integer,
    athlete_count integer,
    photo_count integer,
    total_photo_count integer,
    trainer boolean,
    commute boolean,
    manual boolean,
    private boolean,
    flagged boolean,
    average_speed double precision,
    max_speed double precision,
    calories double precision,
    has_kudoed boolean,
    kilo_joules double precision,
    average_power double precision,
    max_power double precision,
    device_watts boolean,
    has_heart_rate boolean,
    average_heart_rate double precision,
    max_heart_rate double precision
);
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 