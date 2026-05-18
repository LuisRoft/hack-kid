# hack-kid — Frontend Aegis

**Aplicación ciudadana de gestión de riesgo catastrófico — Hackathon Latam (Track DEF/ACC)**

Mapa vivo con capas de riesgo + Agente conversacional Hermes que genera planes de acción personalizados para el ciudadano.

---

## Qué hace

- **Mapa interactivo** con capas de riesgo por corredor vial, zona administrativa, precipitación y POIs útiles
- **Panel de alertas** en tiempo real basadas en forecasts 24/48/72h
- **Agente Hermes** — chat conversacional que responde sobre riesgos y genera planes de acción
- **Onboarding** — registro del perfil del ciudadano (ubicación, familia, recursos)

---

## Stack

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 15** (App Router, React 19, TypeScript) |
| UI Components | **Shadcn/UI** + Radix primitives |
| Estilos | Tailwind CSS v4 + CSS animations |
| Mapa | **Mapbox GL JS** |
| Auth | **Clerk** (JWT + session management) |
| Server | Next.js server components + Route Handlers |
| Package manager | **pnpm** |

---

## Estructura

```
app/
├── page.tsx                 # Landing page pública
├── app/
│   ├── page.tsx            # App principal (mapa + alertas + chat)
│   └── layout.tsx          # App shell con sidebar
├── onboarding/
│   ├── page.tsx            # Formulario perfil ciudadano
│   └── actions.ts          # Server actions para guardar perfil
├── sign-in/                 # Clerk sign-in pages
├── sign-up/                 # Clerk sign-up pages
└── api/
    └── citizen-profile/    # Route handler — guarda perfil en Clerk unsafeMetadata

components/
├── app/
│   ├── app-shell.tsx       # Layout principal: sidebar + mapa + panel
│   ├── risk-map.tsx        # Mapa Mapbox GL con todas las capas
│   ├── alerts-panel.tsx    # Panel de alertas activas
│   ├── chat-widget.tsx     # Widget Hermes (SSE, requiere JWT)
│   └── action-plan-panel.tsx # Plan de acción generado por Hermes
│
├── landing/                # Secciones de la landing page
│   ├── hero-section.tsx
│   ├── problem-section.tsx
│   ├── cascades-section.tsx
│   ├── how-it-works-section.tsx
│   ├── data-sources-section.tsx
│   └── ...
│
├── auth/                   # Componentes Clerk autenticación
│   ├── sign-up-form.tsx
│   ├── sign-in-form.tsx
│   └── ...
│
├── chat/                   # Chat UI (burbujas, toolbar, markdown render)
│   ├── chat.tsx
│   ├── chat-messages.tsx
│   ├── chat-toolbar.tsx
│   └── chat-header.tsx
│
└── ui/                     # Shadcn primitives (button, sheet, textarea, avatar)

lib/
├── auth-routes.ts          # Paths de autenticación
├── auth-navigation.ts      # Navegación post-auth (redirects)
├── onboarding.ts          # Lógica de onboarding check
├── action-plan.ts         # Parser del response de Hermes → ActionPlan
└── reverse-geocode.ts     # Reverse geocoding para ubicación ciudadano
```

---

## Capas del Mapa

| Layer ID | Fuente backend | Descripción |
|---|---|---|
| `corridors` | `/map/corridors` | Red monitoreada base (verde) |
| `risk-segments` | `/map/risk-segments?horizon=24\|48\|72` | Tramos afectados (rojo/naranja) |
| `zones` | `/map/zones?horizon=24\|48\|72` | Zonas administrativas |
| `rain` | `/map/rain/realtime` | Lluvia actual (heatmap) |
| `landslideReports` | `/map/landslides/realtime` | Deslaves recientes |
| `resources` | `/map/pois` | Hospitales, clínicas, farmacias, supermercados |

---

## Flujo de Datos

```
Usuario interactúa con mapa
  ↓
RiskMap.tsx fetchea endpoints /api/v1/map/*
  ↓
Backend (back-kid) sirve GeoJSON pre-computado
  ↓
Mapbox GL renderiza capas con estilos condicionales por risk_level

---

Usuario abre chat Hermes
  ↓
ChatWidget.tsx obtiene Clerk JWT
  ↓
POST /api/v1/agent/chat con Bearer token
  ↓
Backend responde via SSE
  ↓
Markdown renderizado en burbujas
  ↓
Si "Modo plan" → action-plan.ts parsea respuesta → ActionPlanPanel
```

---

## Hermes — Agente Conversacional

Integrado via **SSE (Server-Sent Events)**. Flujo:

1. Usuario autenticado con Clerk
2. `ChatWidget` obtiene JWT template
3. `POST /api/v1/agent/chat` con `Authorization: Bearer <jwt>`
4. Backend verifica JWT, extrae perfil del `unsafeMetadata`
5. Claude Agent SDK responde via SSE con `type: text` chunks
6. `type: done` indica fin del stream

**Modo plan de acción:** Cuando el usuario activa el toggle "Modo plan", el siguiente mensaje incluye `PLAN_MODE_INSTRUCTION` — una instrucción que fuerza a Hermes a responder con un formato estructurado que `action-plan.ts` parsea a un `ActionPlan` consumible por `ActionPlanPanel`.

---

## Auth con Clerk

- **Sign-up/Sign-in** handled by Clerk's hosted UI (`<SignUp>` / `<SignIn>` components)
- **JWT Template** configurado en Clerk dashboard para emitir tokens custom
- **Perfil ciudadano** almacenado en Clerk `unsafeMetadata` (no hay tabla `users` en backend)
- **Onboarding guard** en `app/app/page.tsx` — redirige si `hasCompletedOnboarding` es false

---

## Lo que demuestra ingeniería

1. **App Router + Server Components** — páginas asíncronas, datos en server, zero client-side fetching para datos iniciais
2. **Componentes de UI accesibles** — Shadcn/Radix, semantic HTML, ARIA labels
3. **Mapbox GL avanzado** — GeoJSON sources, capas condicionales, clusters, popups, fit-to-bounds
4. **SSE streaming** — consumo de streams del backend con `ReadableStream` reader, parsing línea a línea
5. **Markdown renderer custom** — sin dependencias externas, soporta negritas, links, listas, headings
6. **TypeScript strict** — tipos en todo, ningún `any`
7. **Tailwind v4** — CSS-first approach, design tokens, sin archivos CSS separados
8. **Clerk integration** — JWT template, `getToken()` con template, `useAuth()` hook

---

## Quickstart

```bash
# Instalar dependencias
pnpm install

# Variables de entorno
cp .env.local.example .env.local
# NEXT_PUBLIC_MAPBOX_TOKEN=...
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
# NEXT_PUBLIC_CLERK_JWT_TEMPLATE=...

# Desarrollo
pnpm dev
```

---

## Variables de Entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Token Mapbox GL |
| `NEXT_PUBLIC_API_URL` | URL del backend (default: `http://127.0.0.1:8000`) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `NEXT_PUBLIC_CLERK_JWT_TEMPLATE` | Nombre del JWT template en Clerk |

---

## Deployment

| Componente | Plataforma |
|---|---|
| Frontend | **Vercel** |
| Auth | **Clerk** (gestionado) |