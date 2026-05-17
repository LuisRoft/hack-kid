'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const API = 'http://localhost:8000/api/v1'

export type MapView = 'logistics' | 'health'

const RISK_LABELS: Record<string, string> = {
  none: 'Sin riesgo',
  low: 'Bajo',
  moderate: 'Moderado',
  high: 'Alto',
  critical: 'Crítico',
}

const LOGISTICS_LAYERS = ['corridors-line', 'rerouting-line'] as const
const HEALTH_LAYERS = ['municipalities-fill', 'municipalities-border'] as const

function applyView(map: mapboxgl.Map, view: MapView) {
  const show = (ids: readonly string[], visible: boolean) => {
    for (const id of ids) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
      }
    }
  }
  show(LOGISTICS_LAYERS, view === 'logistics')
  show(HEALTH_LAYERS, view === 'health')
}

interface Municipality {
  id: string
  name: string
  geometry: GeoJSON.Geometry
  epi_profile: {
    dengue_cases_per_100k: number
    diarrhea_risk: string
    cholera_risk: string
    health_facilities: number
    vulnerable_population: number
  }
}

export function RiskMap({ view }: { view: MapView }) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)
  const viewRef = useRef<MapView>(view)

  useEffect(() => {
    viewRef.current = view
    if (loadedRef.current && mapRef.current) {
      applyView(mapRef.current, view)
    }
  }, [view])

  useEffect(() => {
    if (!containerRef.current) return

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/luisroftl/cmp9czoao000401s3dya2h1i0',
      center: [-78.5, -1.5],
      zoom: 6.2,
    })
    mapRef.current = map

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    // Fuerza resize cuando el container tenga dimensiones reales
    const observer = new ResizeObserver(() => map.resize())
    observer.observe(containerRef.current)

    const popup = new mapboxgl.Popup({ closeButton: false, maxWidth: '300px' })
    const abortCtrl = new AbortController()

    map.on('load', async () => {
      // ── Corredores ────────────────────────────────────────────────
      map.addSource('corridors', {
        type: 'geojson',
        data: `${API}/map/corridors?is_demo=true`,
      })
      map.addLayer({
        id: 'corridors-line',
        type: 'line',
        source: 'corridors',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['get', 'risk_color'],
          'line-width': 4,
        },
      })

      // ── Rutas alternas ────────────────────────────────────────────
      map.addSource('rerouting', {
        type: 'geojson',
        data: `${API}/map/rerouting-plans?is_demo=true`,
      })
      map.addLayer({
        id: 'rerouting-line',
        type: 'line',
        source: 'rerouting',
        layout: { 'line-cap': 'round' },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      })

      // ── Municipios (fetch + transform a FeatureCollection) ────────
      try {
        const res = await fetch(`${API}/municipalities`, { signal: abortCtrl.signal })
        const items: Municipality[] = await res.json()

        const geojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features: items.map((m) => ({
            type: 'Feature',
            geometry: m.geometry,
            properties: {
              id: m.id,
              name: m.name,
              diarrhea_risk: m.epi_profile?.diarrhea_risk ?? 'none',
              cholera_risk: m.epi_profile?.cholera_risk ?? 'none',
              dengue_cases_per_100k: m.epi_profile?.dengue_cases_per_100k ?? 0,
              health_facilities: m.epi_profile?.health_facilities ?? 0,
              vulnerable_population: m.epi_profile?.vulnerable_population ?? 0,
            },
          })),
        }

        map.addSource('municipalities', { type: 'geojson', data: geojson })
        map.addLayer({
          id: 'municipalities-fill',
          type: 'fill',
          source: 'municipalities',
          paint: {
            'fill-color': [
              'match',
              ['get', 'diarrhea_risk'],
              'critical', '#fecaca',
              'high', '#fed7aa',
              'moderate', '#fef08a',
              'low', '#bbf7d0',
              '#f1f5f9',
            ],
            'fill-opacity': 0.65,
          },
        })
        map.addLayer({
          id: 'municipalities-border',
          type: 'line',
          source: 'municipalities',
          paint: { 'line-color': '#94a3b8', 'line-width': 1 },
        })
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error('municipalities fetch failed', e)
        }
      }

      // Aplicar vista inicial y marcar mapa como listo
      applyView(map, viewRef.current)
      loadedRef.current = true

      // ── Popups: Corredores ────────────────────────────────────────
      map.on('mouseenter', 'corridors-line', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'corridors-line', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('mousemove', 'corridors-line', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties as Record<string, unknown>
        popup.setLngLat(e.lngLat).setHTML(corridorPopupHTML(p)).addTo(map)
      })

      // ── Popups: Municipios ────────────────────────────────────────
      map.on('mouseenter', 'municipalities-fill', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'municipalities-fill', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('click', 'municipalities-fill', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties as Record<string, unknown>
        popup.setLngLat(e.lngLat).setHTML(municipalityPopupHTML(p)).addTo(map)
      })
    })

    return () => {
      observer.disconnect()
      abortCtrl.abort()
      loadedRef.current = false
      map.remove()
    }
  }, [])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
}

function corridorPopupHTML(p: Record<string, unknown>): string {
  const risk = String(p.risk_level ?? '')
  const color = String(p.risk_color ?? '#555')
  const prob = Math.round(Number(p.probability ?? 0) * 100)
  const impact = Number(p.population_impact ?? 0).toLocaleString('es-EC')
  return `
    <div style="font-size:13px;line-height:1.6;padding:2px 0">
      <p style="font-weight:600;margin:0 0 6px;font-size:14px">${p.name}</p>
      <p style="margin:0;color:#555">Riesgo: <strong style="color:${color}">${RISK_LABELS[risk] ?? risk}</strong></p>
      <p style="margin:0;color:#555">Probabilidad: <strong>${prob}%</strong></p>
      <p style="margin:0;color:#555">Horizonte: <strong>${p.horizon_hours}h</strong></p>
      <p style="margin:0;color:#555">Impacto: <strong>${impact} hab.</strong></p>
    </div>
  `
}

function municipalityPopupHTML(p: Record<string, unknown>): string {
  const vulPop = Number(p.vulnerable_population ?? 0).toLocaleString('es-EC')
  return `
    <div style="font-size:13px;line-height:1.6;padding:2px 0">
      <p style="font-weight:600;margin:0 0 6px;font-size:14px">${p.name}</p>
      <p style="margin:0;color:#555">Dengue: <strong>${p.dengue_cases_per_100k} por 100k</strong></p>
      <p style="margin:0;color:#555">Riesgo diarrea: <strong>${RISK_LABELS[String(p.diarrhea_risk)] ?? p.diarrhea_risk}</strong></p>
      <p style="margin:0;color:#555">Riesgo cólera: <strong>${RISK_LABELS[String(p.cholera_risk)] ?? p.cholera_risk}</strong></p>
      <p style="margin:0;color:#555">Centros de salud: <strong>${p.health_facilities}</strong></p>
      <p style="margin:0;color:#555">Pob. vulnerable: <strong>${vulPop}</strong></p>
    </div>
  `
}
