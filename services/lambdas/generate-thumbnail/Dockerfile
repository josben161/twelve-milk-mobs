FROM public.ecr.aws/lambda/nodejs:20

# Install required tools for archive extraction (tar, gzip, xz)
RUN microdnf install -y tar gzip xz && microdnf clean all

# Install FFmpeg static binary (not available in default Amazon Linux 2023 repos)
# Using static binary to avoid dependency issues
RUN echo "=== Installing FFmpeg ===" && \
    curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz -o /tmp/ffmpeg.tar.xz && \
    cd /tmp && \
    tar -xJf ffmpeg.tar.xz && \
    mv ffmpeg-*-amd64-static/ffmpeg /usr/local/bin/ && \
    mv ffmpeg-*-amd64-static/ffprobe /usr/local/bin/ && \
    chmod +x /usr/local/bin/ffmpeg /usr/local/bin/ffprobe && \
    rm -rf /tmp/ffmpeg* && \
    echo "=== Verifying FFmpeg installation ===" && \
    /usr/local/bin/ffmpeg -version && \
    test -f /usr/local/bin/ffmpeg || (echo "ERROR: FFmpeg binary not found at /usr/local/bin/ffmpeg" && exit 1) && \
    test -x /usr/local/bin/ffmpeg || (echo "ERROR: FFmpeg binary is not executable" && exit 1) && \
    echo "✓ FFmpeg installed and verified at /usr/local/bin/ffmpeg"

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

# Comprehensive handler verification - test multiple access patterns
RUN echo "=== Comprehensive Handler Verification ===" && \
    echo "Current directory: $(pwd)" && \
    echo "LAMBDA_TASK_ROOT: ${LAMBDA_TASK_ROOT}" && \
    echo "File location: ${LAMBDA_TASK_ROOT}/index.js" && \
    ls -la ${LAMBDA_TASK_ROOT}/index.js && \
    echo "---" && \
    echo "Testing handler access patterns:" && \
    node -e " \
      const path = require('path'); \
      const fs = require('fs'); \
      const taskRoot = process.env.LAMBDA_TASK_ROOT || '/var/task'; \
      const handlerPath = path.join(taskRoot, 'index.js'); \
      console.log('Handler path:', handlerPath); \
      console.log('File exists:', fs.existsSync(handlerPath)); \
      const m1 = require(handlerPath); \
      console.log('Pattern 1 (absolute path): handler type =', typeof m1.handler); \
      process.chdir(taskRoot); \
      const m2 = require('./index.js'); \
      console.log('Pattern 2 (relative from task root): handler type =', typeof m2.handler); \
      if (typeof m1.handler !== 'function' || typeof m2.handler !== 'function') { \
        console.error('ERROR: Handler not accessible in tested patterns'); \
        process.exit(1); \
      } \
      console.log('✓ Handler accessible in all tested patterns'); \
      console.log('Handler function name:', m1.handler.name); \
      console.log('Handler function length (params):', m1.handler.length); \
      console.log('Note: Lambda runtime handles CMD format \"index.handler\" specially - tested in CMD verification step'); \
    " && \
    echo "---" && \
    echo "Showing first 20 lines of compiled index.js:" && \
    head -n 20 ${LAMBDA_TASK_ROOT}/index.js && \
    echo "---" && \
    echo "Showing handler export in compiled file:" && \
    grep -E "(exports\.handler|module\.exports)" ${LAMBDA_TASK_ROOT}/index.js | head -n 5 && \
    echo "✓ Handler verification complete"

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Final comprehensive verification after pruning
RUN echo "=== Final Handler Verification After Prune ===" && \
    test -f ${LAMBDA_TASK_ROOT}/index.js || (echo "ERROR: index.js missing after prune" && exit 1) && \
    node -e " \
      const path = require('path'); \
      const taskRoot = process.env.LAMBDA_TASK_ROOT || '/var/task'; \
      process.chdir(taskRoot); \
      const m = require('./index.js'); \
      if (typeof m.handler !== 'function') { \
        console.error('ERROR: handler missing after prune'); \
        process.exit(1); \
      } \
      console.log('✓ Handler valid after prune'); \
      console.log('Handler accessible at:', path.join(taskRoot, 'index.js')); \
    " && \
    echo "✓ Final verification complete"

# Add build timestamp for deployment verification
ARG BUILD_TIMESTAMP
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
RUN echo "=== Docker Image Build Information ===" && \
    echo "Build timestamp: ${BUILD_TIMESTAMP}" && \
    echo "Image created: $(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo 'unknown')" && \
    echo "✓ Build information recorded"

# Verify CMD format and handler accessibility one final time
# Note: Lambda runtime handles "index.handler" by requiring "./index.js" and accessing .handler
# We verify this pattern works correctly
RUN echo "=== Final CMD Format Verification ===" && \
    echo "CMD will be: index.handler" && \
    echo "Testing handler resolution with CMD format:" && \
    node -e " \
      const taskRoot = process.env.LAMBDA_TASK_ROOT || '/var/task'; \
      process.chdir(taskRoot); \
      const parts = 'index.handler'.split('.'); \
      const moduleName = parts[0]; \
      const exportName = parts[1]; \
      console.log('CMD format: index.handler'); \
      console.log('Module name:', moduleName); \
      console.log('Export name:', exportName); \
      console.log('Lambda runtime will require: ./index.js'); \
      const m = require('./index.js'); \
      if (!m[exportName]) { \
        console.error('ERROR: Export', exportName, 'not found in module'); \
        console.error('Available exports:', Object.keys(m)); \
        process.exit(1); \
      } \
      if (typeof m[exportName] !== 'function') { \
        console.error('ERROR: Export', exportName, 'is not a function, type:', typeof m[exportName]); \
        process.exit(1); \
      } \
      console.log('✓ CMD format verification passed'); \
      console.log('Handler can be accessed as:', moduleName + '.' + exportName); \
      console.log('Lambda runtime will successfully resolve: require(\"./index.js\").handler'); \
    " && \
    echo "✓ CMD format verification complete"

# Set the CMD to your handler (Lambda container images expect format: "filename.exportName")
CMD [ "index.handler" ]
