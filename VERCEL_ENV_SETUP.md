# Environment Variables for Vercel Deployment

## Add these to Vercel Dashboard:

1. Go to: https://vercel.com/your-project/settings/environment-variables

2. Add these variables:

**VITE_API_URL**
- Value: https://your-render-backend-url.onrender.com/api
- Replace with your actual Render backend URL

**VITE_SOCKET_URL**
- Value: https://your-render-backend-url.onrender.com
- Replace with your actual Render backend URL

## Example:
If your Render backend is: `https://teen-patti-server.onrender.com`

Then set:
- VITE_API_URL = `https://teen-patti-server.onrender.com/api`
- VITE_SOCKET_URL = `https://teen-patti-server.onrender.com`

## Local Development (.env.local)
Create `client/.env.local` for local testing:

```
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

## After Setting Variables:
1. Redeploy your Vercel app (or it will auto-deploy)
2. The frontend will now connect to your deployed backend
