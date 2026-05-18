# Aegis

**Plataforma de alerta temprana para deslaves en Ecuador**

**Backend:** https://github.com/LuisRoft/back-kid

---

El cambio climático está haciendo que los eventos climáticos extremos sean más frecuentes y más impredecibles. En Ecuador, los deslaves caused by heavy rainfall represent one of the highest risks for rural communities and critical infrastructure. When the warning comes, families have minutes to act — not hours.

Aegis changes that by giving families **72 hours of advance notice** before a landslide risk becomes a real threat to their zone.

---

## Cómo funciona

### Datos que importan, procesados en tiempo real

- **Datos satelitales de precipitación** — información climática actualizada constantemente
- **Modelos de susceptibilidad del terreno** — análisis geoespacial que identifica cuáles zonas son más vulnerables a deslaves based on slope, soil type, and vegetation cover
- **Pronósticos de lluvia a 24, 48 y 72 horas** — para que cada familia sepa qué esperar y pueda planificar

### Un mapa que te muestra la realidad

El mapa no es solo visual — es funcional. Cada capa representa datos específicos que Aegis procesa y renderiza en tiempo real:

- **Corredores viales monitoreados** — las carreteras que importan para tu zona
- **Riesgo por zona administrativa** — cantones y parroquias coloreados según probabilidad de impacto
- **Tramos de riesgo en corredores** — secciones específicas de carretera con probabilidad de ser afectadas
- **Lluvia en tiempo real** — datos actuales de precipitación en todo el país
- **Deslaves reportados** — eventos recientes captados por sistemas de monitoreo
- **Recursos cercanos** — hospitales, clínicas, farmacias y supermercados geolocalizados

### Hermes — tu guía conversacional

Cuando tenés una alerta, necesitás saber qué hacer. Hermes es el agente de IA que:

1. Te explica el riesgo específico de tu zona en lenguaje simple
2. Te guía paso a paso para crear un **plan de acción familiar**
3. Considera tu ubicación, tu familia y los recursos disponibles cerca de ti

El plan no es un documento genérico — es accionable: qué revisar, a dónde ir, y cuándo actuar.

---

## La profundidad de la solución

**Datos geoespaciales en formato GeoJSON** — todo lo que ves en el mapa viene de APIs que sirven FeatureCollections estandarizadas. Esto significa que cada dato tiene coordenadas precisas, niveles de riesgo calculados, y metadatos que permiten renderizado condicional.

**Mapbox GL JS como motor de renderizado** — capas con estilos dinámicos basados en propiedades (color que cambia según probability), clusters que se expanden, popups con información contextual, y bounds que se ajustan automáticamente al seleccionar un corredor específico.

**Cálculos de riesgo en el backend** — cada FeatureCollection no es solo un dump de datos. Los endpoints de `/map/risk-segments` y `/map/zones` computan peak risk, horizon hours, y susceptibility classes en tiempo real.

**SSE para respuestas conversacionales** — Hermes no responde con polling. Usa Server-Sent Events para streaming en tiempo real, lo que significa que empezás a ver la respuesta en milisegundos, no después de un delay de processing.

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | **Next.js 15** (App Router, React 19, TypeScript) |
| UI Components | **Shadcn/UI** + Radix primitives |
| Estilos | Tailwind CSS v4 + CSS custom properties |
| Mapa | **Mapbox GL JS** |
| Auth | **Clerk** (JWT + session management) |
| Package manager | **pnpm** |

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

## Arquitectura de datos

```
Frontend (Next.js + Mapbox GL)
    ↓ fetch /api/v1/map/*
Backend (FastAPI + PostGIS + GeoAlchemy)
    ↓ procesa y computa
Satellite data / Weather models / LHASA NRT
```