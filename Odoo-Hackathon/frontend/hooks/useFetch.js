'use client';
import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';

export default function useFetch(path, options = {}) {
  const { immediate = true, params } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const load = useCallback(async (override = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(path, { params: override.params || params });
      setData(response.data.data);
      return response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [path, params]);

  useEffect(() => {
    if (immediate) load().catch(() => {});
  }, [immediate, load]);

  return { data, loading, error, reload: load, setData };
}
