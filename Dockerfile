# Specify the base Docker image. You can read more about
# the available images at https://crawlee.dev/docs/guides/docker-images
# You can also use any other image from Docker Hub.
FROM apify/actor-node-playwright-chrome:18 AS builder

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY --chown=myuser package*.json ./

# Install all dependencies. 跳过 安全审计 速度更快
RUN npm install --include=dev --audit=false
# 重新下载 Chromium 版本
RUN npx playwright install
# Next, copy the source files using the user set
# in the base image.
COPY --chown=myuser . ./

RUN npm run migrate:up -- --env test
# Run the test. Check crawler server is work
RUN npm run test:f knowledge_base/process/__tests__/crawler.service.spec.ts

# Install all dependencies and build the project.
# Don't audit to speed up the installation.
RUN npm run build


# Create final image
FROM apify/actor-node-playwright-chrome:18

# Copy only built JS files from builder image
COPY --from=builder --chown=myuser /home/myuser/dist ./dist
# Copy only built browsers from builder image
COPY --from=builder --chown=myuser /home/myuser/pw-browsers ./pw-browsers

# Copy just package.json and package-lock.json
# to speed up the build using Docker layer cache.
COPY --chown=myuser package*.json ./
# Install NPM packages, skip optional and development dependencies to
# keep the image small. Avoid logging too much and print the dependency
# tree for debugging
RUN npm --quiet set progress=true \
  && npm install --omit=dev --omit=optional \
  && echo "Installed NPM packages:" \
  && (npm list --omit=dev --all || true) \
  && echo "Node.js version:" \
  && node --version \
  && echo "NPM version:" \
  && npm --version

# Next, copy the remaining files and directories with the source code.
# Since we do this after NPM install, quick build will be really fast
# for most source file changes.
COPY --chown=myuser . ./

CMD yarn start:prod
