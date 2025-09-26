# Numina Backend

A Supabase-powered backend for the Numina story-sharing platform, featuring AI-generated stories, email notifications, and comprehensive user management.

## Features

- **Supabase Database**: PostgreSQL with Row Level Security (RLS)
- **AI Story Generation**: OpenAI GPT-4 or Google Gemini integration
- **Email Service**: Resend API for transactional emails
- **Edge Functions**: Serverless functions for AI generation and email
- **TypeScript**: Full type safety throughout the application

## Architecture

```
backend/
├── supabase/
│   ├── config.toml              # Supabase local configuration
│   ├── migrations/              # Database migrations
│   │   ├── 20250104000000_setup_profiles.sql
│   │   ├── 20250104120000_create_core_tables.sql
│   │   └── 20250104120001_seed_default_data.sql
│   └── functions/               # Edge Functions
│       ├── generate-ai-story/   # AI story generation
│       └── send-email/          # Email service
├── lib/
│   └── supabase.ts             # Supabase client configuration
├── types/
│   └── index.ts                # TypeScript type definitions
└── .env.example                # Environment variables template
```

## Quick Start

### 1. Prerequisites

- Node.js 18+ and pnpm
- Supabase CLI: `npm install -g supabase`
- Docker (for local Supabase)

### 2. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your configuration
```

### 3. Required Environment Variables

```env
# Supabase (get from https://supabase.com/dashboard)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider (choose one)
AI_PROVIDER=gemini                    # or "openai"
GEMINI_API_KEY=your_gemini_key       # if using Gemini
OPENAI_API_KEY=your_openai_key       # if using OpenAI

# Email (get from https://resend.com)
RESEND_API_KEY=your_resend_key
EMAIL_FROM="Your App <hello@yourdomain.com>"
```

### 4. Local Development

```bash
# Install dependencies
pnpm install

# Start local Supabase
pnpm supabase:start

# Apply migrations
pnpm db:migrate

# Generate TypeScript types
pnpm db:generate
```

### 5. Deploy Functions

```bash
# Deploy to your Supabase project
pnpm functions:deploy
```

## Database Schema

### Core Tables

- **profiles**: User profiles with AI-generated stories
- **questions**: Form questions by category
- **answers**: User responses to questions
- **tags**: Interest tags
- **communities**: Events/communities
- **form_settings**: Application configuration

### Key Features

- **Row Level Security (RLS)**: Secure data access
- **Real-time subscriptions**: Live updates
- **Full-text search**: Efficient profile discovery
- **Audit trails**: Created/updated timestamps

## API Endpoints

### Edge Functions

#### Generate AI Story
```typescript
POST /functions/v1/generate-ai-story
{
  "profileId": "uuid",
  "name": "John Doe",
  "location": "San Francisco",
  "storyAnswers": "...",
  "joyHumanityAnswers": "...",
  "passionDreamsAnswers": "...",
  "connectionPreferencesAnswers": "...",
  "openEndedAnswer": "...",
  "interestTags": ["coding", "music"]
}
```

#### Send Email
```typescript
POST /functions/v1/send-email
{
  "to": "user@example.com",
  "subject": "Welcome!",
  "html": "<p>Welcome to Numina</p>",
  "type": "profile_completion"
}
```

### Database Operations

All database operations use Supabase's auto-generated REST API with RLS policies.

## AI Integration

### Supported Providers

- **OpenAI GPT-4**: Premium quality, higher cost
- **Google Gemini**: Good quality, lower cost (default)

### Story Generation

The AI system creates human-like stories in the style of "Humans of New York" using:
- User's question responses
- Interest tags
- Location and personal details
- Dynamic token limits based on content richness

## Email System

### Features

- Transactional emails via Resend
- Template-based HTML emails
- Delivery tracking and analytics
- Support for multiple email types

### Email Types

- `profile_invitation`: Invite users to create profiles
- `profile_completion`: Confirm profile creation
- `event_notification`: Community event updates

## Development

### Available Scripts

```bash
pnpm dev                 # Start development server
pnpm supabase:start     # Start local Supabase
pnpm supabase:stop      # Stop local Supabase
pnpm db:migrate         # Apply migrations
pnpm db:generate        # Generate TypeScript types
pnpm functions:serve    # Serve functions locally
pnpm lint               # Lint code
pnpm typecheck          # Type checking
```

### Adding Migrations

```bash
# Create new migration
supabase migration new your_migration_name

# Apply to local database
pnpm db:migrate

# Deploy to production
supabase db push
```

## Security

- **RLS Policies**: Secure row-level access control
- **API Keys**: Environment-based configuration
- **CORS**: Proper cross-origin resource sharing
- **Input Validation**: TypeScript and runtime validation

## Monitoring

- **Supabase Dashboard**: Database metrics and logs
- **Edge Function Logs**: Real-time function monitoring
- **Email Analytics**: Delivery and engagement tracking

## Deployment

### Production Setup

1. Create a Supabase project
2. Set environment variables in Supabase dashboard
3. Deploy functions: `supabase functions deploy`
4. Apply migrations: `supabase db push`

### Environment Variables in Supabase

Set these in your Supabase project settings:

- `AI_PROVIDER`
- `OPENAI_API_KEY` or `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`

## Troubleshooting

### Common Issues

1. **Migration conflicts**: Reset local DB with `pnpm supabase:reset`
2. **Function timeouts**: Check AI API rate limits
3. **RLS policy errors**: Verify user authentication
4. **Email delivery**: Check Resend dashboard for errors

### Debugging

```bash
# View function logs
supabase functions logs generate-ai-story

# Check database connections
pnpm supabase:status

# Test email delivery
curl -X POST https://your-project.supabase.co/functions/v1/send-email \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","html":"<p>Test</p>","type":"profile_completion"}'
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper TypeScript types
4. Test with local Supabase instance
5. Submit a pull request

## License

MIT License - see LICENSE file for details.