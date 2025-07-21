import { useEffect, useState } from 'react';
import { fetchArtistImage } from '../services/artistImageService';

export function useArtistImage(artistName: string | null | undefined) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!artistName) {
      setImageUrl(null);
      return;
    }
    setLoading(true);
    fetchArtistImage(artistName)
      .then(url => setImageUrl(url))
      .finally(() => setLoading(false));
  }, [artistName]);

  return { imageUrl, loading };
} 