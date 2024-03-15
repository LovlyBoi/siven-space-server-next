FROM node:20-alpine AS base

FROM base AS deps

RUN apk --update add tzdata python3 && \
    ln -sf /usr/bin/python3 /usr/bin/python && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone && \
    apk del tzdata && \
    rm -rf /var/cache/apk/*

WORKDIR /app

COPY package.json yarn.lock* ./

RUN yarn config set registry https://registry.npmmirror.com/ && \
    yarn install && \
    yarn add sharp --ignore-engines && \
    yarn cache clean

# Rebuild the source code only when needed
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . /app

RUN yarn build

# Final image containing the production build
FROM base AS production

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/.env* ./

EXPOSE 12345

# Start the server using the production build
CMD yarn start:prod
