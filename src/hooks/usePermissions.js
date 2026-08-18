// src/hooks/usePermissions.js
// Loads the current user's role permissions from the backend
// (GET /api/permissions/mine) and exposes a single `can(key, fallbackRoles)`
// helper used by the sidebar, route guards, pages and tabs.
//
// Semantics:
//   - admin role                     → always allowed
//   - explicit row in role_permissions → the row wins (true shows / false hides)
//   - no row for the key (or fetch failed / not migrated)
//                                    → fall back to the hard-coded role list,
//                                      preserving today's default visibility exactly
import { useState, useEffect } from 'react';
import api from '../api/axiosInstance';
import useAuth from './useAuth';

// Module-level cache so every component shares one fetch per session.
let cache = null;          // { role, admin, permissions } or null
let inflight = null;       // shared promise while fetching

export const clearPermissionsCache = () => { cache = null; inflight = null; };

const loadPermissions = () => {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = api.get('/permissions/mine')
    .then((res) => {
      cache = res.data || { role: null, admin: false, permissions: {} };
      return cache;
    })
    .catch(() => {
      cache = { role: null, admin: false, permissions: {} };
      return cache;
    })
    .finally(() => { inflight = null; });
  return inflight;
};

const usePermissions = () => {
  const { userRole } = useAuth();
  const [data, setData] = useState(cache || { role: null, admin: false, permissions: {} });
  const [loaded, setLoaded] = useState(!!cache);

  useEffect(() => {
    let alive = true;
    loadPermissions().then((d) => {
      if (alive) { setData(d); setLoaded(true); }
    });
    return () => { alive = false; };
  }, []);

  const can = (key, fallbackRoles) => {
    if (userRole === 'admin' || data.admin) return true;
    const explicit = data.permissions ? data.permissions[key] : undefined;
    if (explicit !== undefined) return !!explicit;
    if (Array.isArray(fallbackRoles) && fallbackRoles.length) {
      return userRole ? fallbackRoles.includes(userRole) : false;
    }
    return true; // no key and no fallback: keep current behaviour (visible)
  };

  return { can, loaded, permissions: data.permissions || {}, userRole };
};

export default usePermissions;
