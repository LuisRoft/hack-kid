'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  saveCitizenProfile,
  type OnboardingActionState,
} from '@/app/onboarding/actions'
import { reverseGeocode } from '@/lib/reverse-geocode'

const fieldClass =
  'w-full rounded-xs border border-border-subtle bg-surface-base px-3 py-2 text-xs text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-brand focus:ring-2 focus:ring-brand/15'

const labelClass = 'text-xs font-medium text-text-primary'

const checkboxClass =
  'size-4 rounded border-border-subtle text-brand focus:ring-brand/20'

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex w-full items-center justify-center rounded-[var(--radius-xs)] border border-brand bg-brand px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-[#0a2d6e] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? 'Guardando perfil...' : 'Crear mi plan base'}
    </button>
  )
}

export function CitizenOnboardingForm() {
  const [state, formAction] = useActionState<OnboardingActionState, FormData>(
    saveCitizenProfile,
    {},
  )
  const [locationLabel, setLocationLabel] = useState('Casa')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [detectedPlace, setDetectedPlace] = useState<string | null>(null)
  const [locationStatus, setLocationStatus] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)

  const hasCoordinates = lat.length > 0 && lon.length > 0

  function requestBrowserLocation() {
    if (!navigator.geolocation) {
      setDetectedPlace(null)
      setLocationStatus('Tu navegador no permite detectar ubicación.')
      return
    }

    setIsLocating(true)
    setDetectedPlace(null)
    setLocationStatus(null)
    setLat('')
    setLon('')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLat = position.coords.latitude
        const nextLon = position.coords.longitude

        setLat(String(nextLat))
        setLon(String(nextLon))

        const placeName = await reverseGeocode(nextLat, nextLon)
        setDetectedPlace(placeName)
        setLocationStatus(null)
        setIsLocating(false)
      },
      () => {
        setLat('')
        setLon('')
        setDetectedPlace(null)
        setLocationStatus(
          'No pudimos leer tu ubicación. Revisa los permisos del navegador e inténtalo de nuevo.',
        )
        setIsLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <form action={formAction} className="space-y-5">
      <section className="space-y-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-muted">
            Hogar
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-text-primary">
            Donde debe empezar el plan
          </h2>
        </div>

        <div className="space-y-1.5">
          <span className={labelClass}>Nombre del lugar</span>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              name="location_label"
              value={locationLabel}
              onChange={(event) => setLocationLabel(event.target.value)}
              className={fieldClass}
              placeholder="Casa"
              required
            />
            <button
              type="button"
              onClick={requestBrowserLocation}
              disabled={isLocating}
              className="self-end rounded-xs border border-border-subtle px-4 py-2 text-xs font-medium whitespace-nowrap text-text-primary transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLocating ? 'Detectando...' : 'Usar mi ubicación'}
            </button>
          </div>
        </div>

        {locationStatus ? (
          <p className="text-xs leading-5 text-text-muted">{locationStatus}</p>
        ) : null}

        {detectedPlace ? (
          <div className="rounded-xs border border-border-subtle bg-surface-raised px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-muted">
              Ubicación detectada
            </p>
            <p className="mt-1 text-sm leading-snug text-text-primary">
              {detectedPlace}
            </p>
          </div>
        ) : null}

        <input type="hidden" name="lat" value={lat} />
        <input type="hidden" name="lon" value={lon} />

        {!hasCoordinates && !state.error ? (
          <p className="text-xs text-text-muted">
            Usa el botón de ubicación para continuar.
          </p>
        ) : null}
      </section>

      <section className="space-y-2.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-text-muted">
            Familia
          </p>
          <h2 className="mt-0.5 text-sm font-semibold text-text-primary">
            A quién hay que proteger
          </h2>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Tamaño familiar</span>
          <input
            name="family_size"
            className={fieldClass}
            type="number"
            min={1}
            max={20}
            defaultValue={4}
            required
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xs border border-border-subtle px-3 py-2 text-xs text-text-primary">
            <input name="has_kids" type="checkbox" className={checkboxClass} />
            Hay niños
          </label>
          <label className="flex items-center gap-2 rounded-xs border border-border-subtle px-3 py-2 text-xs text-text-primary">
            <input name="has_elderly" type="checkbox" className={checkboxClass} />
            Adultos mayores
          </label>
          <label className="flex items-center gap-2 rounded-xs border border-border-subtle px-3 py-2 text-xs text-text-primary">
            <input name="has_vehicle" type="checkbox" className={checkboxClass} />
            Tenemos vehículo
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Condiciones médicas</span>
          <textarea
            name="medical_conditions"
            className={`${fieldClass} min-h-20 resize-none`}
            placeholder="diabetes, hipertensión, movilidad reducida"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Refugio alterno</span>
          <input
            name="alternate_shelter"
            className={fieldClass}
            placeholder="Casa de familiar, escuela cercana, ninguno"
          />
        </label>
      </section>

      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}

      <SubmitButton disabled={!hasCoordinates} />
    </form>
  )
}
