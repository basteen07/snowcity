import React from 'react';
import adminApi from '../services/adminApi';
import A from '../services/adminEndpoints';

const parseList = (res) => {
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.list)) return res.list;
  return [];
};

export default function useCatalogTargets(options = {}) {
  const { includeInactive = false } = options;
  const [state, setState] = React.useState({
    status: 'idle',
    error: null,
    attractions: [],
    combos: [],
  });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: 'loading', error: null }));
    try {
      const params = includeInactive ? undefined : { params: { active: true } };
      const [attRes, comboRes] = await Promise.all([
        adminApi.get(A.attractions(), params),
        adminApi.get(A.combos(), params),
      ]);
      const attractions = parseList(attRes);
      const combos = parseList(comboRes);
      setState({ status: 'succeeded', error: null, attractions, combos });
    } catch (err) {
      setState((s) => ({ ...s, status: 'failed', error: err }));
    }
  }, [includeInactive]);

  React.useEffect(() => {
    load();
  }, [load]);

  return {
    ...state,
    reload: load,
  };
}
