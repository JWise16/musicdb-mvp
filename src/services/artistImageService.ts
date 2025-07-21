export async function fetchArtistImage(artistName: string): Promise<string | null> {
  if (!artistName) return null;

  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_FUNCTION_URL}/get-artist-image`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ artistName }),
      }
    );

    if (!response.ok) {
      console.error('[ArtistImageService] Error fetching image:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    return data.imageUrl || null;
  } catch (error) {
    console.error('[ArtistImageService] Network error:', error);
    return null;
  }
} 