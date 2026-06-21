# Multi-Tenant Portfolio Platform

## Setup Instructions

### 1. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and service role key
3. Paste them into `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   ```
4. Run the SQL schema in the Supabase SQL Editor:
   - Open `supabase-schema.sql`
   - Copy and execute all SQL statements

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

### 4. Configure Environment

Update `.env.local` with your credentials before starting development.

## Project Structure

```
app/
├── [username]/           # Dynamic portfolio routes
│   ├── page.tsx         # Server component for portfolio rendering
│   ├── layout.tsx       # Metadata and OG tags
│   └── portfolio-client.tsx  # Interactive client component
├── dashboard/           # Creator dashboard (to be implemented)
├── api/                 # API routes
│   └── interactions/
│       └── like/        # Like interaction endpoint
└── page.tsx             # Landing page
```

## Next Steps

1. ✅ Install Supabase client
2. ✅ Create database schema
3. ✅ Set up dynamic routing
4. ⏳ Implement creator dashboard
5. ⏳ Add media upload functionality
6. ⏳ Implement comment system
7. ⏳ Add social sharing features

## Free Tier Optimization

- **Vercel**: Next.js caching minimizes database reads
- **Supabase**: 500MB database, 50k MAU
- **Cloudinary**: 25GB storage (optional)
