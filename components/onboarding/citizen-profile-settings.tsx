'use client';

import { useEffect, useState } from 'react';
import type { CitizenProfile } from '@/lib/onboarding';

const emptyProfile: CitizenProfile = {
  onboardingComplete: false,
  location: { lat: -2.170998, lon: -79.922359, label: 'Casa' },
  family_size: 4,
  has_kids: false,
  has_elderly: false,
  medical_conditions: [],
  has_vehicle: false,
  alternate_shelter: null,
  alternate_shelter_label: null,
  locale: 'es-EC',
};

const fieldClass =
  'w-full rounded-[4px] border border-[#d9d9df] bg-white px-3 py-2 text-xs text-[#212126] outline-none transition-colors placeholder:text-[#747686] focus:border-[#a7a7af] focus:ring-2 focus:ring-[#212126]/10';

const labelClass = 'text-xs font-medium text-[#212126]';

const optionClass =
  'flex items-center gap-2 rounded-[4px] border border-[#d9d9df] px-3 py-2 text-xs text-[#212126]';

const checkboxClass = 'accent-[#212126]';

function conditionsToText(profile: CitizenProfile): string {
  return profile.medical_conditions.join(', ');
}

function textToConditions(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function CitizenProfileSettings() {
  const [profile, setProfile] = useState<CitizenProfile>(emptyProfile);
  const [conditions, setConditions] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/citizen-profile')
      .then((response) => {
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
      })
      .then((data: { profile: CitizenProfile | null }) => {
        if (cancelled) return;
        const nextProfile = data.profile ?? emptyProfile;
        setProfile(nextProfile);
        setConditions(conditionsToText(nextProfile));
      })
      .catch(() => {
        if (!cancelled) setMessage('No se pudo cargar tu perfil ciudadano.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const nextProfile = {
      ...profile,
      medical_conditions: textToConditions(conditions),
    };

    try {
      const response = await fetch('/api/citizen-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextProfile),
      });

      if (!response.ok) throw new Error(response.statusText);
      const data = (await response.json()) as { profile: CitizenProfile };
      setProfile(data.profile);
      setConditions(conditionsToText(data.profile));
      setMessage('Perfil ciudadano actualizado.');
    } catch {
      setMessage('No pudimos guardar los cambios.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className='text-xs text-[#747686]'>Cargando perfil ciudadano...</p>
    );
  }

  return (
    <form onSubmit={saveProfile} className='space-y-4'>
      <div>
        <h2 className='text-sm font-semibold text-[#212126]'>
          Perfil ciudadano
        </h2>
        <p className='mt-1 text-xs leading-5 text-[#747686]'>
          Estos datos alimentan los planes familiares del bot y las
          recomendaciones de respuesta.
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        <label className='flex flex-col gap-1.5 sm:col-span-2'>
          <span className={labelClass}>Lugar base</span>
          <input
            value={profile.location.label}
            onChange={(event) => {
              setProfile({
                ...profile,
                location: { ...profile.location, label: event.target.value },
              });
            }}
            className={fieldClass}
          />
        </label>

        <label className='flex flex-col gap-1.5'>
          <span className={labelClass}>Latitud</span>
          <input
            value={profile.location.lat}
            onChange={(event) => {
              setProfile({
                ...profile,
                location: {
                  ...profile.location,
                  lat: Number(event.target.value),
                },
              });
            }}
            className={fieldClass}
            inputMode='decimal'
          />
        </label>

        <label className='flex flex-col gap-1.5'>
          <span className={labelClass}>Longitud</span>
          <input
            value={profile.location.lon}
            onChange={(event) => {
              setProfile({
                ...profile,
                location: {
                  ...profile.location,
                  lon: Number(event.target.value),
                },
              });
            }}
            className={fieldClass}
            inputMode='decimal'
          />
        </label>
      </div>

      <label className='flex flex-col gap-1.5'>
        <span className={labelClass}>Tamaño familiar</span>
        <input
          value={profile.family_size}
          onChange={(event) => {
            setProfile({ ...profile, family_size: Number(event.target.value) });
          }}
          className={fieldClass}
          type='number'
          min={1}
          max={20}
        />
      </label>

      <div className='grid gap-2 sm:grid-cols-3'>
        <label className={optionClass}>
          <input
            type='checkbox'
            checked={profile.has_kids}
            onChange={(event) => {
              setProfile({ ...profile, has_kids: event.target.checked });
            }}
            className={checkboxClass}
          />
          Hay niños
        </label>
        <label className={optionClass}>
          <input
            type='checkbox'
            checked={profile.has_elderly}
            onChange={(event) => {
              setProfile({ ...profile, has_elderly: event.target.checked });
            }}
            className={checkboxClass}
          />
          Adultos mayores
        </label>
        <label className={optionClass}>
          <input
            type='checkbox'
            checked={profile.has_vehicle}
            onChange={(event) => {
              setProfile({ ...profile, has_vehicle: event.target.checked });
            }}
            className={checkboxClass}
          />
          Vehículo
        </label>
      </div>

      <label className='flex flex-col gap-1.5'>
        <span className={labelClass}>Condiciones médicas</span>
        <textarea
          value={conditions}
          onChange={(event) => setConditions(event.target.value)}
          className={`${fieldClass} min-h-20 resize-none`}
          placeholder='diabetes, hipertensión, movilidad reducida'
        />
      </label>

      <label className='flex flex-col gap-1.5'>
        <span className={labelClass}>Refugio alterno</span>
        <input
          value={profile.alternate_shelter_label ?? ''}
          onChange={(event) => {
            setProfile({
              ...profile,
              alternate_shelter_label: event.target.value || null,
            });
          }}
          className={fieldClass}
          placeholder='Casa de familiar, escuela cercana, ninguno'
        />
      </label>

      {message ? <p className='text-xs text-[#747686]'>{message}</p> : null}

      <button
        type='submit'
        disabled={saving}
        className='inline-flex  items-center justify-center hover:border-[#747686] border-b text-xs font-medium text-black transition-colors hover:text-[#747686] disabled:cursor-not-allowed disabled:opacity-50'
      >
        {saving ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
