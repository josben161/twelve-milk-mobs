## Admin Web (Barn Social – Admin)

This app is the admin dashboard for monitoring ingestion, validation quality, and campaign performance.

### API base URL configuration

All data is fetched from the MilkMobs API Gateway using the `NEXT_PUBLIC_API_BASE` environment variable.

1. Deploy the infrastructure stack in `services/infra` and note the `ApiBaseUrl` CloudFormation output.
2. Set `NEXT_PUBLIC_API_BASE` in your environment to that value:

```bash
# apps/admin-web/.env.local
NEXT_PUBLIC_API_BASE="https://abcd1234.execute-api.us-east-1.amazonaws.com/prod"
```

On Vercel, configure the same value in **Project Settings → Environment Variables**.

If this variable is missing, pages will show a clear error:

> API base URL is not configured. Set NEXT_PUBLIC_API_BASE to the MilkMobs API Gateway base URL (see CloudFormation output ApiBaseUrl).

### Local development

From the repo root:

```bash
cd twelve-milk-mobs/apps/admin-web
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.
