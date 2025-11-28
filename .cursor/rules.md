# Project context

We are building a TwelveLabs-powered demo for a youth milk campaign ("Milk Mobs").

Architecture:
- Next.js apps in /apps/consumer-web and /apps/admin-web
- Shared types in /packages/core-types
- Later: AWS backend (API Gateway + Lambdas + S3 + DynamoDB), but for now we can stub APIs as Next.js route handlers.

Conventions:
- Use TypeScript everywhere.
- Prefer Next.js App Router.
- Use Tailwind for styling.
- Keep components small and focused.
- Frontends talk to REST endpoints under /api; these can later proxy to AWS.

Preferences:
- Clean, consistent formatting (no weird whitespace).
- Descriptive but concise names.
- Avoid unnecessary abstractions until a pattern emerges.