FROM public.ecr.aws/lambda/nodejs:20

# Install FFmpeg and build tools
RUN yum install -y ffmpeg && yum clean all

# Copy package files
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source files and TypeScript config
COPY index.ts tsconfig.json ${LAMBDA_TASK_ROOT}/

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Set the CMD to your handler (use compiled JS file)
CMD [ "dist/index.handler" ]
