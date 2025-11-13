import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import AttractionCard from '../components/cards/AttractionCard';
import ComboCard from '../components/cards/ComboCard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { safeKey } from '../utils/keys';

export default function Attractions() {
  const dispatch = useDispatch();
  const { items: attractions, status: aStatus, error: aError } = useSelector((s) => s.attractions);
  const { items: combos, status: cStatus } = useSelector((s) => s.combos);
  const [q, setQ] = React.useState('');

  React.useEffect(() => {
    if (aStatus === 'idle') dispatch(fetchAttractions({ active: true, page: 1, limit: 30 }));
    if (cStatus === 'idle') dispatch(fetchCombos({ active: true, page: 1, limit: 12 }));
  }, [aStatus, cStatus, dispatch]);

  const list = React.useMemo(() => {
    if (!q) return attractions;
    const s = q.toLowerCase();
    return attractions.filter((x) =>
      String(x.name || x.title || '').toLowerCase().includes(s)
    );
  }, [attractions, q]);

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-semibold mb-2">Attractions</h1>
        <p className="text-gray-600 mb-6">Browse all experiences and book your slots.</p>

        <div className="mb-6">
          <input
            className="w-full md:w-96 rounded-full border px-4 py-2"
            placeholder="Search attractions..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {aStatus === 'loading' && !attractions.length ? <Loader /> : null}
        {aStatus === 'failed' ? <ErrorState message={aError?.message || 'Failed to load attractions'} /> : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {list.map((item, idx) => (
            <AttractionCard key={safeKey('attr', item, idx)} item={item} />
          ))}
        </div>

        {/* Combos section */}
        <div className="mt-10">
          <h2 className="text-xl md:text-2xl font-semibold mb-4">Combo Deals</h2>
          {cStatus === 'loading' && !combos.length ? <Loader /> : null}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {combos.map((c, idx) => (
              <ComboCard key={safeKey('combo', c, idx)} item={c} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}