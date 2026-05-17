type MapboxGeocodeResponse = {
  features?: Array<{
    place_name?: string
  }>
}

export async function reverseGeocode(
  lat: number,
  lon: number,
): Promise<string | null> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token) return null

  try {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json`,
    )
    url.searchParams.set('access_token', token)
    url.searchParams.set('language', 'es')
    url.searchParams.set('limit', '1')

    const response = await fetch(url.toString())
    if (!response.ok) return null

    const data = (await response.json()) as MapboxGeocodeResponse
    const placeName = data.features?.[0]?.place_name?.trim()
    return placeName || null
  } catch {
    return null
  }
}
