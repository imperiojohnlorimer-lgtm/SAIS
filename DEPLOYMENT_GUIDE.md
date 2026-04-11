# Deployment Guide to Vercel

## Overview
Your SIAS (Student Internship Attendance System) has been updated to be Vercel-deployment ready. This guide walks through deploying both the React frontend and Node.js backend.

## Prerequisites
- Vercel account (sign up at vercel.com)
- GitHub repository with your code pushed
- MongoDB Atlas (or similar) for database hosting
- Git installed locally

## Step 1: Prepare Your Code

### Frontend (.env setup)
Before deploying, create a `.env.production` file in the `siasprototype/` folder:
```
VITE_API_URL=https://your-backend-domain.vercel.app/api
```

### Backend (.env setup)
Create `.env` file in the `backend/` folder with:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_random_secret_key_minimum_32_characters
JWT_EXPIRE=7d
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.vercel.app
```

**⚠️ NEVER commit `.env` files to Git** - They're already in `.gitignore`

## Step 2: Deploy Backend to Vercel

### Via Vercel CLI
```bash
cd backend
npm install -g vercel
vercel
```

### Via Vercel Dashboard
1. Visit [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select the `backend/` directory as root
4. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Generate a strong random string (min 32 chars)
   - `CLIENT_URL`: Your frontend domain
   - `NODE_ENV`: Set to `production`
5. Click "Deploy"

### After Deployment
- Note your backend URL (e.g., `https://your-api.vercel.app`)
- This becomes your `VITE_API_URL` for the frontend

## Step 3: Deploy Frontend to Vercel

### Via Vercel Dashboard
1. Visit [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Select `siasprototype/` as root directory
4. Build settings (auto-detected):
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: Your deployed backend URL (https://your-api.vercel.app/api)
6. Click "Deploy"

## Step 4: Update CORS on Backend

Once you have your frontend domain, update backend `server.js`:
```javascript
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
```

The `CLIENT_URL` environment variable will automatically handle this.

## Security Checklist

✅ **Completed:**
- [x] Environment variables use `.env.example` templates
- [x] `.env` files are in `.gitignore`
- [x] Hardcoded localhost URLs replaced with environment variables
- [x] `vercel.json` configurations created
- [x] Backend dependencies removed from frontend

⚠️ **Still TODO:**
- [ ] Generate a strong JWT secret (DON'T use placeholder)
- [ ] Rotate MongoDB credentials if already exposed
- [ ] Use HTTPS only (Vercel provides this automatically)
- [ ] Set secure CORS origins
- [ ] Enable rate limiting (Optional: add express-rate-limit)

## Important Notes

### Vercel Functions Limitations
- Maximum 10 seconds execution time on free tier
- MongoDB connection pooling is critical (already optimized)
- Use edge caching for static assets

### MongoDB Connection
Your pool settings are optimized for Vercel:
```javascript
maxPoolSize: 50,
minPoolSize: 5,
maxIdleTimeMS: 10000
```

### Troubleshooting

**502 Bad Gateway Error:**
- Check MongoDB connection string is correct
- Verify JWT_SECRET is set
- Check backend logs in Vercel dashboard

**CORS Errors:**
- Ensure CLIENT_URL matches your frontend domain
- Frontend VITE_API_URL must match backend domain

**Deployment Failures:**
1. Check Vercel build logs
2. Verify Node.js version compatibility
3. Ensure all dependencies are in package.json

## Local Testing Before Deploy

```bash
# Test backend locally
cd backend
npm run dev

# In another terminal, test frontend
cd siasprototype
npm run dev
# Visit http://localhost:5173
```

## Updating After Initial Deployment

Simply push to your Git repository - Vercel will automatically redeploy:
```bash
git push origin main
```

## Database Backups

Since MongoDB is hosted on Atlas, ensure you have:
- Regular automatic backups enabled
- IP whitelist configured (Vercel IPs)
- Connection string secured

## Support

For Vercel-specific questions:
- Vercel Docs: https://vercel.com/docs
- Vercel Community: https://vercel.com/community

For MongoDB Atlas:
- MongoDB Docs: https://docs.mongodb.com/
- Atlas UI: https://cloud.mongodb.com

---
**Last Updated:** April 12, 2026
