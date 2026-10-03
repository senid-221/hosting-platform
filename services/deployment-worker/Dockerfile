FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git docker.io ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /worker
COPY services/deployment-worker/package.json services/deployment-worker/tsconfig.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY services/deployment-worker/src ./src
CMD ["npm","run","worker"]
