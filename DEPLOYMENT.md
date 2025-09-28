# Vercel Deployment Guide for Safe Tourist Watch

## Prerequisites
- Vercel account
- GitHub repository connected to Vercel
- Supabase project with credentials

## Quick Deployment Steps

### 1. Environment Variables
In your Vercel dashboard, add these environment variables:

```
VITE_SUPABASE_URL=https://your_project_id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
VITE_SUPABASE_PROJECT_ID=your_project_id_here
NODE_ENV=production
```

### 2. Build Settings
The project is pre-configured with `vercel.json`. Vercel will automatically:
- Detect Vite framework
- Use `npm run build` command
- Deploy from `dist` folder
- Handle SPA routing

### 3. Deployment
1. Connect your GitHub repository to Vercel
2. Import the project
3. Add environment variables
4. Deploy!

## Build Optimizations Applied

### Code Splitting
- ✅ Lazy loading for all major components
- ✅ Separate chunks for React, UI libraries, Maps, and Supabase
- ✅ Reduced main bundle size from 1.1MB to manageable chunks

### Bundle Analysis
```
Main Chunks:
- react-vendor: 141KB (React core)
- map-vendor: 149KB (Leaflet maps)  
- supabase-vendor: 125KB (Database)
- ui-vendor: 37KB (UI components)
- SosIncidentsPage: 473KB (Largest page component)
```

### Performance Features
- ✅ Lazy component loading with Suspense
- ✅ Optimized Vite build configuration
- ✅ Static asset caching headers
- ✅ Console removal in production
- ✅ SPA routing configuration

## Troubleshooting

### Build Errors
- All react-leaflet dependencies removed
- Pure Leaflet implementation used
- TypeScript strict mode disabled for compatibility

### Runtime Issues
- Geolocation permissions handled gracefully
- Fallback loading states for all components
- Error boundaries for map components

### Performance
- Large chunks split into smaller ones
- Dynamic imports for better loading
- Asset optimization enabled

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | `eyJhbG...` |
| `VITE_SUPABASE_PROJECT_ID` | Supabase project ID | `abc123xyz` |
| `NODE_ENV` | Environment mode | `production` |

## Deployment Checklist

- ✅ Build passes locally (`npm run build`)
- ✅ All environment variables configured
- ✅ Supabase tables and policies set up
- ✅ Domain configured (if custom domain needed)
- ✅ SSL enabled (automatic with Vercel)

## Post-Deployment

1. Test all map functionality
2. Verify authentication flow
3. Check database connections
4. Monitor performance metrics
5. Set up error tracking (optional)

Your application should now be successfully deployed on Vercel!