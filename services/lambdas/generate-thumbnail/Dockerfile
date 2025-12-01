FROM public.ecr.aws/lambda/nodejs:20

# Install required tools for archive extraction (tar, gzip, xz)
RUN microdnf install -y tar gzip xz && microdnf clean all

# Install FFmpeg static binary (not available in default Amazon Linux 2023 repos)
# Using static binary to avoid dependency issues
RUN curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz && \
    cd /tmp && \
    tar -xJf ffmpeg.tar.xz && \
    mv ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ && \
    mv ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ && \
    chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe && \
    rm -rf /tmp/ffmpeg* && \
    ffmpeg -version

# Copy package files
COPY package*.json ${LAMBDA_TASK_ROOT}/

# Install dependencies (including devDependencies for TypeScript compilation)
RUN npm ci

# Copy source files and TypeScript config
COPY index.ts tsconfig.json ${LAMBDA_TASK_ROOT}/

# Build TypeScript
RUN npm run build

# Verify the build output exists
RUN echo "=== Verifying TypeScript build ===" && \
    ls -la dist/ && \
    test -f dist/index.js || (echo "ERROR: dist/index.js not found after build" && exit 1) && \
    echo "✓ dist/index.js exists"

# Move the compiled handler to the root (Lambda expects handler at root level)
RUN echo "=== Moving handler to root ===" && \
    mv dist/index.js ${LAMBDA_TASK_ROOT}/index.js && \
    ls -la ${LAMBDA_TASK_ROOT}/index.js && \
    test -f ${LAMBDA_TASK_ROOT}/index.js || (echo "ERROR: index.js not found after move" && exit 1) && \
    echo "✓ index.js moved to ${LAMBDA_TASK_ROOT}"

# Verify handler export exists and is a function
RUN echo "=== Verifying handler export ===" && \
    node -e "const m = require('./index.js'); console.log('Handler type:', typeof m.handler); if (typeof m.handler !== 'function') { console.error('ERROR: handler is not a function'); process.exit(1); } console.log('✓ Handler export is valid');" && \
    echo "✓ Handler verification complete"

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Set the CMD to your handler (Lambda container images expect format: "filename.exportName")
CMD [ "index.handler" ]
