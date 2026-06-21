# Multi-Tenant Portfolio Platform

A scalable multi-tenant portfolio platform where users can spin up custom pages with dynamic social features (likes, comments, media).

## Architecture

- **Framework**: Next.js (App Router) for hybrid static/dynamic rendering
- **Database & Auth**: Supabase (PostgreSQL + Realtime)
- **Storage**: Cloudinary / Supabase Storage
- **Hosting**: Vercel (Free Tier)

## Features

- ✅ Dynamic portfolio URLs (`platform.com/username`)
- ✅ Creator dashboard with profile management
- ✅ Portfolio item CRUD operations
- ✅ Social features (likes, comments)
- ✅ Responsive design with Tailwind CSS
- ✅ Incremental Static Regeneration (ISR) for performance
- ✅ Row-Level Security (RLS) for data protection
- ✅ Explore page with search functionality
- ✅ Social sharing (Web Share API + copy link)
- ✅ Media upload to Supabase Storage
- ✅ Cloudinary integration support
- ✅ Public homepage with featured portfolios
- ✅ Real-time comment and like counts

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account ([sign up](https://supabase.com))

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: Cloudinary for media storage
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### 3. Setup Database

1. Create a new project at [supabase.com](https://supabase.com)
2. Open the SQL Editor
3. Copy and execute the SQL from `supabase-schema.sql`

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── [username]/              # Public portfolio pages
│   ├── page.tsx            # Server component with ISR
│   ├── layout.tsx          # Dynamic OG tags
│   └── portfolio-client.tsx # Interactive client component
├── dashboard/              # Creator dashboard
│   ├── layout.tsx          # Dashboard layout
│   ├── page.tsx            # Redirect to profile
│   ├── profile/            # Profile management
│   ├── items/              # Portfolio items CRUD
│   └── settings/           # Account settings
├── explore/                # Public portfolio exploration
├── login/                  # Authentication
├── signup/
├── api/                    # API routes
│   ├── auth/
│   ├── portfolio/
│   ├── upload/
│   └── interactions/
├── components/             # Shared components
│   ├── Navbar.tsx
│   ├── SocialShare.tsx
│   ├── MediaUploader.tsx
│   ├── CloudinaryUploader.tsx
│   └── PortfolioForm.tsx
└── layout.tsx              # Root layout with Navbar

supabase-schema.sql         # Database schema with RLS
```

## Development

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project to [Vercel](https://vercel.com/new)
3. Add environment variables from `.env.local`
4. Deploy!

## Cost Optimization

| Component | Free Tier | Optimization |
|-----------|-----------|--------------|
| Vercel | Generous bandwidth | Next.js caching reduces DB reads |
| Supabase | 500MB DB, 50k MAU | Indexes on username column |
| Cloudinary | 25GB storage | Auto-transform to WebP/AVIF |

## Next Steps

- [ ] Add real-time comment updates with Supabase Realtime
- [ ] Add analytics dashboard
- [ ] Implement email notifications
- [ ] Add dark mode toggle
- [ ] Implement portfolio templates
- [ ] Add custom domain support
- [ ] Create mobile app with React Native

## License

MIT
