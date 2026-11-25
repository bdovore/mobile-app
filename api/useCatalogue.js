import { useCallback, useEffect, useRef, useState } from 'react';
import { catalogueRequest } from './APIManager';

export function isbnParams(text) {
  const code = text.replace(/[\s-]/g, '').toUpperCase();
  if (/^\d{13}$/.test(code)) return { EAN: code };
  if (/^\d{9}[\dX]$/.test(code)) return { ISBN: code };
  return null;
}

async function requestPage(params, offset, signal) {
  const isbn = isbnParams(params.q || '');
  if (isbn) {
    const editions = await catalogueRequest('Album', { ...isbn, mode: 2 }, signal);
    const rows = (editions || []).filter(item => item.ID_EDITION).map(item => ({
      id: item.ID_EDITION, label: item.TITRE_TOME, subtitle: item.NOM_SERIE,
      cover: item.IMG_COUV, edition: item,
    }));
    return { groups: { alb: { rows, more: false } } };
  }
  const page = await catalogueRequest('Catalogue', { ...params, offset }, signal);
  if (!page?.groups) throw new Error('Le catalogue est indisponible.');
  return page;
}

// Callers memoize params so unrelated renders keep the current page and request.
export function useCatalogue(params) {
  const [page, setPage] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const pending = useRef(null);
  const load = useCallback(async (offset = 0, scope = params.scope) => {
    pending.current?.abort();
    const controller = new AbortController();
    pending.current = controller;
    setBusy(true);
    setError('');
    try {
      const result = await requestPage({ ...params, scope }, offset, controller.signal);
      if (controller.signal.aborted) return;
      if (!offset) setPage(result);
      else setPage(previous => {
        const group = result.groups[scope];
        return { ...previous, groups: { ...previous.groups,
          [scope]: { ...group, rows: [...previous.groups[scope].rows, ...group.rows] },
        } };
      });
    } catch (e) {
      if (!controller.signal.aborted) setError(e.message || 'Recherche indisponible.');
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }, [params]);

  useEffect(() => {
    setPage(null);
    setError('');
    setBusy(true);
    const timer = setTimeout(load, params.q && !isbnParams(params.q) ? 300 : 0);
    return () => {
      clearTimeout(timer);
      pending.current?.abort();
    };
  }, [params, load]);
  return { page, busy, error, load };
}
