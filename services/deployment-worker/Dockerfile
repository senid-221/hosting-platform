FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git docker.io ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /worker
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
CMD ["npm","run","worker"]
