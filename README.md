# Outbound DB

Multi-client outbound data warehouse built with Next.js, PostgreSQL, and Prisma.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env and add your DATABASE_URL
```

3. Run database migrations:
```bash
npx prisma migrate deploy
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Seed the database (optional):
```bash
npm run prisma:seed
```

6. Run the development server:
```bash
npm run dev
```

## Deployment to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
4. The build process will automatically:
   - Generate Prisma Client
   - Run database migrations
   - Build the Next.js app

## Database Migrations

- **Local development**: Use `npm run prisma:migrate` to create and apply migrations
- **Production (Vercel)**: Migrations run automatically during build via `prisma migrate deploy`

## Default Credentials

- **Admin**: username: `admin`, password: `admin123` (change in production!)

## Features

- Multi-client data isolation
- CSV upload for raw and enriched data
- Client-specific niche management
- User access control (all clients or specific client)
- Analytics dashboard
- Data filtering and export
