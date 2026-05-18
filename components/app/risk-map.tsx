'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

const API = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000'}/api/v1`

export type RiskHorizon = 24 | 48 | 72
export type MapLayerId =
  | 'zones'
  | 'rain'
  | 'landslideRisk'
  | 'landslideReports'
  | 'resources'
  | 'corridors'
export type MapLayerState = Record<MapLayerId, boolean>

const RISK_LABELS: Record<string, string> = {
  none: 'Sin riesgo',
  low: 'Bajo',
  moderate: 'Moderado',
  high: 'Alto',
  critical: 'Crítico',
}

const SUSCEPTIBILITY_LABELS: Record<number, string> = {
  0: 'Agua / sin dato',
  1: 'Baja',
  2: 'Baja',
  3: 'Moderada',
  4: 'Alta',
  5: 'Alta',
}

const EMPTY_FEATURE_COLLECTION: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
}

const LAYER_GROUPS: Record<MapLayerId, readonly string[]> = {
  zones: ['zones-fill', 'zones-border'],
  rain: ['rain-realtime-heatmap'],
  landslideRisk: ['risk-segments-line'],
  landslideReports: ['landslides-realtime-circle'],
  resources: [
    'pois-cluster-circle',
    'pois-cluster-count',
    'pois-icon-bg',
    'pois-symbol',
  ],
  corridors: ['corridors-halo', 'corridors-line'],
}

function applyLayerVisibility(map: mapboxgl.Map, layers: MapLayerState) {
  for (const [key, layerIds] of Object.entries(LAYER_GROUPS) as [
    MapLayerId,
    readonly string[],
  ][]) {
    for (const id of layerIds) {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', layers[key] ? 'visible' : 'none')
      }
    }
  }
}

function normalizeCorridorName(name: unknown): string {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function extendBoundsWithPosition(
  bounds: mapboxgl.LngLatBounds,
  position: GeoJSON.Position,
) {
  if (typeof position[0] === 'number' && typeof position[1] === 'number') {
    bounds.extend([position[0], position[1]])
  }
}

function extendBoundsWithGeometry(
  bounds: mapboxgl.LngLatBounds,
  geometry: GeoJSON.Geometry | null,
) {
  if (!geometry) return

  switch (geometry.type) {
    case 'Point':
      extendBoundsWithPosition(bounds, geometry.coordinates)
      break
    case 'MultiPoint':
    case 'LineString':
      geometry.coordinates.forEach((position) => extendBoundsWithPosition(bounds, position))
      break
    case 'MultiLineString':
    case 'Polygon':
      geometry.coordinates.forEach((line) => {
        line.forEach((position) => extendBoundsWithPosition(bounds, position))
      })
      break
    case 'MultiPolygon':
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach((line) => {
          line.forEach((position) => extendBoundsWithPosition(bounds, position))
        })
      })
      break
    case 'GeometryCollection':
      geometry.geometries.forEach((item) => extendBoundsWithGeometry(bounds, item))
      break
  }
}

function fitToRiskSegments(
  map: mapboxgl.Map,
  featureCollection: GeoJSON.FeatureCollection | null,
  corridorName: string,
) {
  if (!featureCollection) return

  const target = normalizeCorridorName(corridorName)
  const bounds = new mapboxgl.LngLatBounds()

  for (const feature of featureCollection.features) {
    const properties = feature.properties ?? {}
    const featureName = normalizeCorridorName(
      properties.corridor_name ?? properties.name,
    )

    if (featureName === target) {
      extendBoundsWithGeometry(bounds, feature.geometry)
    }
  }

  if (!bounds.isEmpty()) {
    map.fitBounds(bounds, {
      padding: { top: 96, right: 96, bottom: 96, left: 420 },
      maxZoom: 10,
      duration: 900,
    })
  }
}

export function RiskMap({
  isDemo,
  horizon,
  layers,
  selectedCorridorName,
}: {
  isDemo: boolean
  horizon: RiskHorizon
  layers: MapLayerState
  selectedCorridorName: string | null
}) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const loadedRef = useRef(false)
  const selectedCorridorRef = useRef<string | null>(selectedCorridorName)
  const riskSegmentsRef = useRef<GeoJSON.FeatureCollection | null>(null)
  const layersRef = useRef<MapLayerState>(layers)

  useEffect(() => {
    layersRef.current = layers
    if (loadedRef.current && mapRef.current) {
      applyLayerVisibility(mapRef.current, layers)
    }
  }, [layers])

  useEffect(() => {
    selectedCorridorRef.current = selectedCorridorName
    if (loadedRef.current && mapRef.current && selectedCorridorName) {
      fitToRiskSegments(mapRef.current, riskSegmentsRef.current, selectedCorridorName)
    }
  }, [selectedCorridorName])

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
    const canvas = map.getCanvas()

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right')

    // Cuando la ventana cambia de tamaño, actualizar el viewport GL.
    // Debounce de 50ms para no hacer resize en cada pixel del drag.
    let stableTimer: ReturnType<typeof setTimeout>

    const observer = new ResizeObserver(() => {
      clearTimeout(stableTimer)
      stableTimer = setTimeout(() => map.resize(), 50)
    })
    observer.observe(containerRef.current)

    const popup = new mapboxgl.Popup({ closeButton: false, maxWidth: '300px' })
    const abortCtrl = new AbortController()

    map.on('load', async () => {
      // ── Lluvia actual nacional ────────────────────────────────────
      map.addSource('rain-realtime', {
        type: 'geojson',
        data: isDemo
          ? EMPTY_FEATURE_COLLECTION
          : `${API}/map/rain/realtime?within_minutes=360`,
      })
      map.addLayer({
        id: 'rain-realtime-heatmap',
        type: 'heatmap',
        source: 'rain-realtime',
        paint: {
          'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'precipitation_mm_h'],
            0, 0,
            20, 1,
          ],
          'heatmap-intensity': 0.9,
          'heatmap-radius': 28,
          'heatmap-opacity': 0.55,
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(59,130,246,0)',
            0.25, '#93c5fd',
            0.55, '#38bdf8',
            0.8, '#facc15',
            1, '#ef4444',
          ],
        },
      })

      // ── Riesgo por zona administrativa ────────────────────────────
      map.addSource('zones', {
        type: 'geojson',
        data: isDemo ? EMPTY_FEATURE_COLLECTION : `${API}/map/zones?horizon=${horizon}`,
      })
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['coalesce', ['get', 'risk_color'], '#22c55e'],
          'fill-opacity': [
            'case',
            ['==', ['get', 'risk_level'], 'none'],
            0.03,
            ['==', ['get', 'risk_level'], 'low'],
            0.12,
            0.3,
          ],
        },
      })
      map.addLayer({
        id: 'zones-border',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': '#64748b',
          'line-width': 0.7,
          'line-opacity': 0.35,
        },
      })

      // ── Red monitoreada base ──────────────────────────────────────
      map.addSource('corridors', {
        type: 'geojson',
        data: `${API}/map/corridors?is_demo=${isDemo}`,
      })
      map.addLayer({
        id: 'corridors-halo',
        type: 'line',
        source: 'corridors',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#ecfeff',
          'line-width': 7,
          'line-opacity': 0.85,
        },
      })
      map.addLayer({
        id: 'corridors-line',
        type: 'line',
        source: 'corridors',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': '#0f766e',
          'line-width': 3.4,
          'line-opacity': 0.96,
        },
      })

      // ── Tramos afectados ──────────────────────────────────────────
      let riskSegments: GeoJSON.FeatureCollection = EMPTY_FEATURE_COLLECTION
      try {
        const res = await fetch(
          `${API}/map/risk-segments?horizon=${horizon}&min_probability=0.2&is_demo=${isDemo}`,
          { signal: abortCtrl.signal },
        )
        if (!res.ok) throw new Error(res.statusText)
        riskSegments = await res.json()
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error('risk segments fetch failed', e)
        }
      }
      riskSegmentsRef.current = riskSegments

      map.addSource('risk-segments', { type: 'geojson', data: riskSegments })
      map.addLayer({
        id: 'risk-segments-line',
        type: 'line',
        source: 'risk-segments',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'risk_color'], '#f97316'],
          'line-width': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'probability'], 0],
            0.2, 2,
            0.65, 5,
            0.85, 7,
          ],
          'line-opacity': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', 'probability'], 0],
            0.2, 0.38,
            0.65, 0.78,
            0.85, 0.96,
          ],
        },
      })

      // ── Deslaves reportados recientemente ────────────────────────
      map.addSource('landslides-realtime', {
        type: 'geojson',
        data: isDemo
          ? EMPTY_FEATURE_COLLECTION
          : `${API}/map/landslides/realtime?hours=24`,
      })
      map.addLayer({
        id: 'landslides-realtime-circle',
        type: 'circle',
        source: 'landslides-realtime',
        paint: {
          'circle-color': '#111827',
          'circle-radius': 5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
          'circle-opacity': 0.9,
        },
      })

      // ── POIs útiles para el ciudadano ─────────────────────────────
      map.addSource('pois', {
        type: 'geojson',
        data: isDemo
          ? EMPTY_FEATURE_COLLECTION
          : `${API}/map/pois?types=hospital,clinic,pharmacy,supermarket&limit=1200`,
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 24,
      })
      map.addLayer({
        id: 'pois-cluster-circle',
        type: 'circle',
        source: 'pois',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#0f172a',
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            9,
            25,
            12,
            100,
            15,
          ],
          'circle-stroke-color': '#67e8f9',
          'circle-stroke-width': 1,
          'circle-opacity': 0.76,
        },
      })
      map.addLayer({
        id: 'pois-cluster-count',
        type: 'symbol',
        source: 'pois',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 9,
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true,
        },
        paint: {
          'text-color': '#ffffff',
        },
      })
      map.addLayer({
        id: 'pois-icon-bg',
        type: 'circle',
        source: 'pois',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match',
            ['get', 'type'],
            'hospital', '#dc2626',
            'clinic', '#f97316',
            'pharmacy', '#16a34a',
            'supermarket', '#2563eb',
            '#64748b',
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5, 2.2,
            9, 3.6,
            13, 5.2,
          ],
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 0.8,
          'circle-opacity': 0.78,
        },
      })
      map.addLayer({
        id: 'pois-symbol',
        type: 'symbol',
        source: 'pois',
        minzoom: 8.5,
        filter: ['!', ['has', 'point_count']],
        layout: {
          'text-field': [
            'match',
            ['get', 'type'],
            'hospital', 'H',
            'clinic', '+',
            'pharmacy', 'Rx',
            'supermarket', 'M',
            '•',
          ],
          'text-size': [
            'match',
            ['get', 'type'],
            'pharmacy', 8,
            10,
          ],
          'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': false,
          'text-ignore-placement': false,
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(0,0,0,0.18)',
          'text-halo-width': 0.4,
        },
      })

// Marcar mapa como listo
      loadedRef.current = true
      applyLayerVisibility(map, layersRef.current)
      if (selectedCorridorRef.current) {
        fitToRiskSegments(map, riskSegmentsRef.current, selectedCorridorRef.current)
      }

      // Sincronizar el color de fondo al container Y al canvas para que el
      // buffer GL al borrarse (resize final) no deje ver el blanco del body.
      try {
        const bgLayer = map.getStyle()?.layers?.find(
          (l) => l.type === 'background'
        ) as { id: string; paint?: Record<string, unknown> } | undefined

        let bgColor: string | undefined

        if (bgLayer) {
          // getPaintProperty devuelve el valor computado actual (más fiable)
          try {
            const val = map.getPaintProperty(bgLayer.id, 'background-color')
            if (typeof val === 'string') bgColor = val
          } catch {}

          // Fallback: leer directamente del spec del estilo
          if (!bgColor) {
            const raw = bgLayer.paint?.['background-color']
            if (typeof raw === 'string') bgColor = raw
          }
        }

        const bg = bgColor ?? '#0e1923'
        if (containerRef.current) containerRef.current.style.backgroundColor = bg
        canvas.style.backgroundColor = bg
      } catch {
        canvas.style.backgroundColor = '#0e1923'
      }

      // ── Popups: Red base ──────────────────────────────────────────
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

      // ── Popups: Tramos afectados ──────────────────────────────────
      map.on('mouseenter', 'risk-segments-line', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'risk-segments-line', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('mousemove', 'risk-segments-line', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties as Record<string, unknown>
        popup.setLngLat(e.lngLat).setHTML(riskSegmentPopupHTML(p)).addTo(map)
      })

      // ── Popups: Zonas ─────────────────────────────────────────────
      map.on('mouseenter', 'zones-fill', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'zones-fill', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('mousemove', 'zones-fill', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties as Record<string, unknown>
        popup.setLngLat(e.lngLat).setHTML(zonePopupHTML(p)).addTo(map)
      })

      // ── Popups: Deslaves recientes ────────────────────────────────
      map.on('mouseenter', 'landslides-realtime-circle', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'landslides-realtime-circle', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('click', 'landslides-realtime-circle', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties as Record<string, unknown>
        popup.setLngLat(e.lngLat).setHTML(landslidePopupHTML(p)).addTo(map)
      })

      // ── Popups: POIs ──────────────────────────────────────────────
      map.on('mouseenter', 'pois-cluster-circle', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'pois-cluster-circle', () => {
        map.getCanvas().style.cursor = ''
      })
      map.on('click', 'pois-cluster-circle', (e) => {
        const feature = e.features?.[0]
        if (!feature?.properties) return
        const clusterId = feature.properties.cluster_id
        const source = map.getSource('pois') as mapboxgl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error || zoom == null) return
          const geometry = feature.geometry
          if (geometry.type !== 'Point') return
          map.easeTo({
            center: geometry.coordinates as [number, number],
            zoom,
          })
        })
      })
      map.on('mouseenter', 'pois-icon-bg', () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', 'pois-icon-bg', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
      map.on('click', 'pois-icon-bg', (e) => {
        if (!e.features?.length) return
        const p = e.features[0].properties as Record<string, unknown>
        popup.setLngLat(e.lngLat).setHTML(poiPopupHTML(p)).addTo(map)
      })
    })

    return () => {
      clearTimeout(stableTimer)
      observer.disconnect()
      abortCtrl.abort()
      loadedRef.current = false
      riskSegmentsRef.current = null
      map.remove()
    }
  }, [isDemo, horizon])

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, backgroundColor: '#0e1923' }} />
}

function corridorPopupHTML(p: Record<string, unknown>): string {
  const risk = String(p.peak_risk_level ?? p.risk_level ?? 'none')
  const color = String(p.peak_risk_color ?? p.risk_color ?? '#64748b')
  const impact = Number(p.population_impact ?? 0).toLocaleString('es-EC')
  return `
    <div style="font-size:13px;line-height:1.6;padding:2px 0">
      <p style="font-weight:600;margin:0 0 6px;font-size:14px">${p.name}</p>
      <p style="margin:0;color:#555">Red monitoreada base</p>
      <p style="margin:0;color:#555">Peor riesgo: <strong style="color:${color}">${RISK_LABELS[risk] ?? risk}</strong></p>
      <p style="margin:0;color:#555">Impacto: <strong>${impact} hab.</strong></p>
    </div>
  `
}

function formatNumber(value: unknown, digits = 1): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return numeric.toLocaleString('es-EC', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function formatUpdatedAgo(value: unknown): string {
  if (!value) return '—'
  const date = new Date(String(value))
  const time = date.getTime()
  if (!Number.isFinite(time)) return '—'

  const diffMs = Date.now() - time
  if (diffMs < 0) return date.toLocaleString('es-EC')

  const minutes = Math.round(diffMs / 60_000)
  if (minutes < 1) return 'hace menos de 1 min'
  if (minutes < 60) return `hace ${minutes} min`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`

  const days = Math.round(hours / 24)
  return `hace ${days} d`
}

function susceptibilityLabel(value: unknown): string {
  if (value == null) return '—'
  const cls = Number(value)
  if (!Number.isFinite(cls)) return '—'
  const rounded = Math.round(cls)
  const label = SUSCEPTIBILITY_LABELS[rounded] ?? '—'
  return label === '—' ? label : `${label} (clase ${rounded})`
}

function riskSegmentPopupHTML(p: Record<string, unknown>): string {
  const risk = String(p.risk_level ?? '')
  const color = String(p.risk_color ?? '#f97316')
  const prob = Math.round(Number(p.probability ?? 0) * 100)
  const susceptibility = susceptibilityLabel(p.susceptibility_class)
  return `
    <div style="font-size:13px;line-height:1.6;padding:2px 0">
      <p style="font-weight:600;margin:0 0 6px;font-size:14px">${p.corridor_name ?? p.name ?? 'Tramo afectado'}</p>
      <p style="margin:0;color:#555">Riesgo: <strong style="color:${color}">${RISK_LABELS[risk] ?? risk}</strong></p>
      <p style="margin:0;color:#555">Probabilidad: <strong>${prob}%</strong></p>
      <p style="margin:0;color:#555">Horizonte: <strong>${p.horizon_hours}h</strong></p>
      <p style="margin:0;color:#555">Susceptibilidad: <strong>${susceptibility}</strong></p>
      <p style="margin:0;color:#555">Segmento: <strong>${p.segment_index ?? '-'}</strong></p>
    </div>
  `
}

function zonePopupHTML(p: Record<string, unknown>): string {
  const risk = String(p.risk_level ?? 'none')
  const color = String(p.risk_color ?? '#22c55e')
  const probability = p.probability == null ? null : Math.round(Number(p.probability) * 100)
  const horizon = p.horizon_hours ?? '-'
  const rainfall = p.expected_rainfall_mm == null ? '—' : `${formatNumber(p.expected_rainfall_mm)} mm`
  const susceptibility = susceptibilityLabel(p.peak_susceptibility_class)
  const updated = formatUpdatedAgo(p.computed_at)
  return `
    <div style="font-size:13px;line-height:1.6;padding:2px 0">
      <p style="font-weight:600;margin:0 0 6px;font-size:14px">${p.name ?? 'Zona'}</p>
      <p style="margin:0;color:#555">Riesgo ${horizon}h: <strong style="color:${color}">${RISK_LABELS[risk] ?? risk}</strong> <strong>${probability == null ? '—' : `${probability}%`}</strong></p>
      <p style="margin:0;color:#555">Lluvia esperada: <strong>${rainfall}</strong></p>
      <p style="margin:0;color:#555">Susceptibilidad: <strong>${susceptibility}</strong></p>
      <p style="margin:0;color:#555">Actualizado: <strong>${updated}</strong></p>
    </div>
  `
}

function landslidePopupHTML(p: Record<string, unknown>): string {
  const reportedAt = p.reported_at ? new Date(String(p.reported_at)).toLocaleString('es-EC') : '-'
  return `
    <div style="font-size:13px;line-height:1.6;padding:2px 0">
      <p style="font-weight:600;margin:0 0 6px;font-size:14px">Deslave reportado</p>
      <p style="margin:0;color:#555">Severidad: <strong>${p.severity ?? '-'}</strong></p>
      <p style="margin:0;color:#555">Fuente: <strong>${p.source ?? 'LHASA NRT'}</strong></p>
      <p style="margin:0;color:#555">Reportado: <strong>${reportedAt}</strong></p>
    </div>
  `
}

function poiPopupHTML(p: Record<string, unknown>): string {
  const type = String(p.type ?? 'poi')
  const labels: Record<string, string> = {
    hospital: 'Hospital',
    clinic: 'Clínica',
    pharmacy: 'Farmacia',
    supermarket: 'Supermercado',
  }
  return `
    <div style="font-size:13px;line-height:1.6;padding:2px 0">
      <p style="font-weight:600;margin:0 0 6px;font-size:14px">${p.name ?? labels[type] ?? 'Punto útil'}</p>
      <p style="margin:0;color:#555">Tipo: <strong>${labels[type] ?? type}</strong></p>
      ${p.address ? `<p style="margin:0;color:#555">Dirección: <strong>${p.address}</strong></p>` : ''}
    </div>
  `
}
