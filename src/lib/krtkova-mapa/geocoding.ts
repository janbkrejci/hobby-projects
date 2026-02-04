export async function geocodeCity(
  cityName: string,
): Promise<{ lat: string; lon: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`,
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: data[0].lat, lon: data[0].lon };
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}
