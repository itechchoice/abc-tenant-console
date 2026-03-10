# ABC Tenant Console

Multi-tenant AI Agent platform frontend — LLM streaming chat, visual workflow orchestration, and generative UI, built with **Pure JSX** (no TypeScript).

## Tech Stack

| Category | Technology |
|----------|-----------|
| Framework | React 18.3 (CSR, no Server Components) |
| Build | Vite 7 |
| Styling | TailwindCSS v4 + shadcn/ui (Pure JSX) |
| Animation | framer-motion |
| Icons | lucide-react |
| State | zustand (client) + @tanstack/react-query (server) |
| LLM Streaming | @microsoft/fetch-event-source (SSE) |
| HTTP | axios (wrapped as `apiClient`) |
| Workflow Canvas | @xyflow/react (React Flow) |
| Validation | zod (runtime schema) + JSDoc (editor types) |
| Linting | ESLint 9 (Flat Config, Airbnb base) |
| Package Manager | pnpm |

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 9

## Getting Started

```bash
# Install dependencies
pnpm install

# Start dev server (proxies API to staging backend)
pnpm dev

# Start with staging env
pnpm stg

# Start with production env
pnpm prod
```

The dev server runs at `http://localhost:5173` by default.

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start Vite dev server (development mode) |
| `pnpm stg` | Start Vite dev server (staging mode) |
| `pnpm prod` | Start Vite dev server (production mode) |
| `pnpm build` | Production build to `dist/` |
| `pnpm preview` | Preview production build locally |
| `pnpm lint` | Run ESLint checks |
| `pnpm lint:fix` | Auto-fix ESLint issues |

## Project Structure

```
src/
  main.jsx                # Entry point
  App.jsx                 # Root component (authenticated layout)
  router.jsx              # Route configuration (react-router-dom v7)
  index.css               # Global styles (TailwindCSS v4 import)
  components/
    ui/                   # shadcn/ui Pure JSX components
    GenerativeUI/         # AI-driven polymorphic components
      MarkdownMessage.jsx #   Rich-text renderer (Markdown + syntax highlight)
      ToolCallCard.jsx    #   Tool execution lifecycle card
      InteractionForm.jsx #   Dynamic client interaction form
    Workflow/             # React Flow canvas & node layer
      nodes/              #   Custom node types (AgentNode, etc.)
  lib/
    utils.js              # cn() utility (clsx + tailwind-merge)
  http/
    client.js             # axios singleton (Token injection + 401 redirect)
  hooks/
    useAgentChat.js       # SSE streaming lifecycle + event router
    useChatHistory.js     # React Query wrappers for conversation CRUD
  stores/
    chatStore.js          # Zustand — chat + workflow state
    authStore.js          # Zustand + persist — auth credentials
  schemas/
    chatSchema.js         # Zod SSOT — Message, ToolCall, Role, Status
    aiResponseSchemas.js  # Zod — Tool Call args, Interaction widgets
  utils/
    safeParser.js         # Defensive AI JSON parser (zod + try-catch)
  pages/
    Home/
      index.jsx           # Main chat interface
      components/         # Page-private components
    Login/
      index.jsx           # Authentication page
    NotFound/
      index.jsx           # 404 page
  assets/                 # Static resources (images, fonts)
```

## Architecture Overview

The application is built around four core layers:

**1. State & Network Engine** — `zustand` as the central state brain (`chatStore`), `@microsoft/fetch-event-source` for SSE streaming with a custom event router that handles 10+ backend event types (text chunks, tool calls, workflow lifecycle, client interactions).

**2. Runtime Security** — `zod` schemas as the single source of truth for all data structures. Every piece of LLM-generated JSON is validated before entering the store or rendering. Parse failures are caught gracefully — never a white screen.

**3. Generative UI** — Polymorphic message dispatcher that renders different components based on message type: rich Markdown, tool call cards, or dynamic interaction forms. All generative components live in `src/components/GenerativeUI/`.

**4. Workflow Canvas** — `@xyflow/react` powers the visual workflow editor. Node execution state flows from SSE events through zustand to the canvas, driving real-time breathing-light animations on active nodes.

For the full architecture specification, see [`doc/ARCHITECTURE.md`](doc/ARCHITECTURE.md).

## Environment Configuration

The project uses three environment files:

| File | Mode | Usage |
|------|------|-------|
| `.env.development` | `pnpm dev` | Local development with proxy |
| `.env.staging` | `pnpm stg` | Staging environment |
| `.env.production` | `pnpm prod` / `pnpm build` | Production environment |

Key variables:

```bash
VITE_APP_BASE_PATH=/              # Router basename ("/" or "/console/")
VITE_API_BASE_URL=/tenant-console-api  # Axios baseURL (proxied in dev)
VITE_PROXY_TARGET=https://...     # Real backend URL (dev proxy target)
```

API request routing in development: `apiClient baseURL` → `Vite Proxy intercept` → `Rewrite to /api/v1` → backend.

## Key Conventions

- **Pure JSX** — No TypeScript. Type safety via `zod` schemas + `JSDoc @typedef`.
- **English-Only UI** — All user-facing text must be in English. No Chinese characters in JSX/JS.
- **shadcn components** — Never run `npx shadcn add`. Components are manually converted from TS source to Pure JSX with full JSDoc annotations.
- **Networking** — REST via `apiClient` from `@/http/client`, SSE via `@microsoft/fetch-event-source`. Never use raw `fetch`, direct `axios.get`, or `vercel/ai`.
- **API paths** — Always use clean business paths (`/users`, `/conversations`). Never include `/api` or `/v1` prefixes — the proxy handles rewriting.
- **Component colocation** — Page-specific components go in `src/pages/<Page>/components/`. Only truly shared components go in `src/components/`.

## License

Private — All rights reserved.
