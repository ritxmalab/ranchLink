/**
 * Texas zip codes and approximate distance from Austin (ATX) downtown.
 * Used to check "within 50 miles of ATX" for pipeline targeting.
 * Source: approximate centroids; for production consider a full zip→lat/lng table or API.
 */
const ATX_CENTER = { lat: 30.2672, lon: -97.7431 }

// Approximate lat/lon for Texas zip centroids (subset; expand as needed)
// Format: zip -> [lat, lon]. Giddings 78942, Lampasas 76550, Llano 78643, etc.
const ZIP_COORDS: Record<string, [number, number]> = {
  '78942': [30.1827, -96.9369],   // Giddings
  '76550': [31.0638, -98.1817],   // Lampasas
  '78643': [30.7524, -98.6756],   // Llano
  '77488': [29.3116, -96.1027],   // Wharton
  '78377': [28.3053, -97.2753],   // Refugio
  '76667': [31.5452, -97.0989],   // McGregor
  '76455': [31.8460, -98.3828],   // Gustine
  '78956': [29.6816, -96.9453],   // Schulenburg
  '76567': [30.6552, -97.0014],   // Rockdale
  '78610': [30.0852, -97.8403],   // Buda
  '78620': [30.1902, -98.0867],   // Dripping Springs
  '76528': [30.6527, -97.0034],   // Rockdale area
}

function haversineMi(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Returns true if the given zip (5-digit string) is within radiusMi of Austin.
 * If zip is not in the known list, returns null (unknown).
 */
export function isZipWithinMilesOfATX(zip: string, radiusMi: number = 50): boolean | null {
  const cleaned = String(zip).replace(/\D/g, '').slice(0, 5)
  const coords = ZIP_COORDS[cleaned]
  if (!coords) return null
  const [lat, lon] = coords
  const dist = haversineMi(ATX_CENTER.lat, ATX_CENTER.lon, lat, lon)
  return dist <= radiusMi
}

/**
 * Extract 5-digit zip from address string (e.g. "GIDDINGS, TX 78942-0330" or "78942").
 */
export function extractZipFromAddress(address: string): string | null {
  if (!address) return null
  const match = address.match(/\b(\d{5})(?:-\d{4})?\b/)
  return match ? match[1] : null
}
