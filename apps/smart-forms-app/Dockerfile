# Dockerfile

# Step 1: Use a Node.js image to build the app
FROM --platform=$BUILDPLATFORM node:20 AS builder

# Set working directory inside the container
WORKDIR /app

# Install build tools for native dependencies
RUN apt-get update && apt-get install -y python3 build-essential && rm -rf /var/lib/apt/lists/*

# Set npm config for python and permissions (use ENV for cross-platform compatibility)
ENV npm_config_python=python3 \
    npm_config_unsafe_perm=true

# Copy root workspace package files so npm can set up the workspace
COPY package*.json ./

# Copy only the package manifests first (better layer caching for npm install)
COPY packages/sdc-assemble/package*.json ./packages/sdc-assemble/
COPY packages/sdc-populate/package*.json ./packages/sdc-populate/
COPY packages/sdc-template-extract/package*.json ./packages/sdc-template-extract/
COPY packages/smart-forms-renderer/package*.json ./packages/smart-forms-renderer/
COPY apps/smart-forms-app/package*.json ./apps/smart-forms-app/

# npm 10 on Node 20 still runs `prepare` scripts for local workspace packages even with --ignore-scripts,
# because they are symlinked rather than downloaded. Strip prepare scripts from workspace package.json files
# before install to prevent build attempts before source files are copied. Packages are built explicitly below.
RUN node -e "\
  ['packages/sdc-assemble','packages/sdc-populate','packages/sdc-template-extract','packages/smart-forms-renderer']\
  .forEach(p => {\
    const f = p + '/package.json';\
    const pkg = JSON.parse(require('fs').readFileSync(f));\
    delete pkg.scripts.prepare;\
    require('fs').writeFileSync(f, JSON.stringify(pkg, null, 2));\
  });"
RUN npm install --ignore-scripts

# Copy source files for all packages and the app
COPY packages/sdc-assemble/ ./packages/sdc-assemble/
COPY packages/sdc-populate/ ./packages/sdc-populate/
COPY packages/sdc-template-extract/ ./packages/sdc-template-extract/
COPY packages/smart-forms-renderer/ ./packages/smart-forms-renderer/
COPY apps/smart-forms-app/ ./apps/smart-forms-app/

# Build packages in dependency order (mirrors deploy_app.yml)
RUN npm run build --workspace=packages/sdc-assemble
RUN npm run build --workspace=packages/sdc-populate
RUN npm run build --workspace=packages/sdc-template-extract
RUN npm run build --workspace=packages/smart-forms-renderer

# Build the app
RUN npm run build --workspace=apps/smart-forms-app


# Step 2: Use an Nginx image to serve the static files
FROM --platform=$BUILDPLATFORM nginx:alpine

# Copy the build files from the builder stage to the Nginx web directory
COPY --from=builder /app/apps/smart-forms-app/dist /usr/share/nginx/html

# Copy your Nginx configuration file into the container
COPY --from=builder /app/apps/smart-forms-app/default.conf /etc/nginx/conf.d/

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
