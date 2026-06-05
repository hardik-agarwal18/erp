FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json prisma.config.ts ./
COPY src ./src
COPY prisma ./prisma

RUN npm run build && npm cache clean --force

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node --input-type=module -e "import('http').then(({default: http}) => http.get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)}))"

CMD ["node", "dist/server.js"]
