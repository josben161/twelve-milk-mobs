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

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Set the CMD to your handler (use compiled JS file)
CMD [ "dist/index.handler" ]
