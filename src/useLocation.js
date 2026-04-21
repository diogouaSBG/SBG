import { useState, useEffect, useCallback } from 'react';

export function useLocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada neste browser.');
      return;
    }
    setLoading(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({ lat: coords.latitude, lon: coords.longitude, accuracy: coords.accuracy });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => { request(); }, [request]);

  const setManual = useCallback((lat, lon) => {
    setLocation({ lat, lon, accuracy: null });
    setError(null);
  }, []);

  return { location, error, loading, request, setManual };
}
