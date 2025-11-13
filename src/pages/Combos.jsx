import React from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCombos } from '../features/combos/combosSlice';
import ComboCard from '../components/cards/ComboCard';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { useNavigate } from 'react-router-dom';

// Public fetch for combo slots. Adjust the path if your public API differs.
// Expected response: array of slots OR { data: [ ... ] }
// Each slot should include: combo_slot_id, combo_id, start_date, end_date, start_time, end_time, start_time_12h, end_time_12h, price, capacity, available
async function fetchComboSlots({ combo_id, date }) {
  const params = new URLSearchParams();
  if (combo_id) params.set('combo_id', combo_id);
  if (date) params.set('date', date);

  const res = await fetch(`/api/combo-slots?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error(await res.text());
  const json = await res.json().catch(() => ({}));

  // Handle both shapes: array or { data: [] }
  if (Array.isArray(json)) return json;
  if (Array.isArray(json?.data)) return json.data;
  return [];
}

export default function Combos() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items, status, error } = useSelector((s) => s.combos);

  const [date, setDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [openComboId, setOpenComboId] = React.useState(null);

  // slots cache: { [comboId]: Slot[] }
  const [slotsByCombo, setSlotsByCombo] = React.useState({});
  // status per combo id: 'idle'|'loading'|'loaded'|'failed'
  const [slotStatus, setSlotStatus] = React.useState({});
  const [slotError, setSlotError] = React.useState({});
  // quantity per combo id (applied to any slot booking for that combo)
  const [qtyByCombo, setQtyByCombo] = React.useState({});

  React.useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchCombos({ active: true, page: 1, limit: 24 }));
    }
  }, [status, dispatch]);

  // When date changes, refetch slots for the currently open combo
  React.useEffect(() => {
    if (openComboId) {
      loadSlots(openComboId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const loadSlots = async (comboId) => {
    try {
      setSlotStatus((s) => ({ ...s, [comboId]: 'loading' }));
      setSlotError((s) => ({ ...s, [comboId]: '' }));

      const data = await fetchComboSlots({ combo_id: comboId, date });
      setSlotsByCombo((m) => ({ ...m, [comboId]: data || [] }));
      setSlotStatus((s) => ({ ...s, [comboId]: 'loaded' }));
    } catch (e) {
      setSlotStatus((s) => ({ ...s, [comboId]: 'failed' }));
      setSlotError((s) => ({ ...s, [comboId]: e?.message || 'Failed to load slots' }));
    }
  };

  const onToggleCombo = (comboId) => {
    setOpenComboId((prev) => (prev === comboId ? null : comboId));
    setQtyByCombo((q) => ({ ...q, [comboId]: q[comboId] || 1 }));
    // If opening and not yet loaded for this date, fetch
    const alreadyLoaded = Array.isArray(slotsByCombo[comboId]) && slotStatus[comboId] === 'loaded';
    if (!alreadyLoaded) {
      loadSlots(comboId);
    }
  };

  const onBook = (combo, slot) => {
    const qty = Math.max(1, Number(qtyByCombo[combo.combo_id] || 1));
    // Navigate to your checkout with query/state. Replace with your cart API if needed.
    const params = new URLSearchParams({
      type: 'combo',
      combo_id: String(combo.combo_id),
      combo_slot_id: String(slot.combo_slot_id),
      date,
      qty: String(qty),
    }).toString();

    navigate(`/checkout?${params}`, {
      state: {
        type: 'combo',
        combo_id: combo.combo_id,
        combo_slot_id: slot.combo_slot_id,
        date,
        quantity: qty,
      },
    });
  };

  return (
    <div className="py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-4 gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Combo Deals</h1>
            <p className="text-gray-600">Best value combinations for your Snowcity adventure.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Date</label>
            <input
              type="date"
              className="rounded-md border px-3 py-2 text-sm dark:bg-neutral-900 dark:border-neutral-700"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {status === 'loading' && !items.length ? <Loader /> : null}
        {status === 'failed' ? (
          <ErrorState message={error?.message || 'Failed to load combos'} />
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {items.map((combo) => {
            const comboId = combo.combo_id || combo.id; // handle both shapes
            const isOpen = openComboId === comboId;
            const slots = slotsByCombo[comboId] || [];
            const sStatus = slotStatus[comboId] || 'idle';
            const sErr = slotError[comboId] || '';

            return (
              <div key={comboId} className="rounded-xl border bg-white dark:bg-neutral-900 border-gray-200 dark:border-neutral-800">
                {/* Card header */}
                <button
                  className="w-full text-left"
                  onClick={() => onToggleCombo(comboId)}
                  aria-expanded={isOpen}
                >
                  <ComboCard item={{ ...combo, id: comboId }} />
                </button>

                {/* Expanded slot area */}
                {isOpen && (
                  <div className="px-3 pb-3">
                    <div className="flex items-center justify-between py-2">
                      <div className="text-sm text-gray-700">
                        {dayjs(date).format('ddd, DD MMM YYYY')}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm">Qty</label>
                        <input
                          type="number"
                          min={1}
                          className="w-20 rounded-md border px-2 py-1 text-sm dark:bg-neutral-900 dark:border-neutral-700"
                          value={qtyByCombo[comboId] || 1}
                          onChange={(e) =>
                            setQtyByCombo((q) => ({
                              ...q,
                              [comboId]: Math.max(1, Number(e.target.value) || 1),
                            }))
                          }
                        />
                      </div>
                    </div>

                    {sStatus === 'loading' ? (
                      <div className="py-3">
                        <Loader size="sm" />
                      </div>
                    ) : null}

                    {sStatus === 'failed' ? (
                      <div className="py-3">
                        <ErrorState message={sErr || 'Failed to load slots'} />
                      </div>
                    ) : null}

                    {sStatus === 'loaded' && (
                      <>
                        {!slots.length ? (
                          <div className="text-sm text-gray-500 py-3">No slots available for this date.</div>
                        ) : (
                          <div className="space-y-2">
                            {slots.map((slot) => {
                              const st = slot.start_time_12h || slot.start_time;
                              const et = slot.end_time_12h || slot.end_time;
                              const price = slot.price == null ? null : Number(slot.price);
                              return (
                                <div
                                  key={slot.combo_slot_id || `${slot.combo_id}-${st}-${et}`}
                                  className="flex items-center justify-between rounded-md border px-3 py-2 dark:border-neutral-800"
                                >
                                  <div className="text-sm">
                                    <div className="font-medium">
                                      {st} → {et}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      Capacity: {slot.capacity} • {slot.available ? 'Available' : 'Unavailable'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {price != null ? (
                                      <div className="text-sm font-medium">₹ {price.toLocaleString()}</div>
                                    ) : (
                                      <div className="text-xs text-gray-500">Price at checkout</div>
                                    )}
                                    <button
                                      disabled={!slot.available}
                                      onClick={() => onBook({ combo_id: comboId, ...combo }, slot)}
                                      className="px-3 py-1.5 rounded-md bg-gray-900 text-white text-sm disabled:opacity-50"
                                    >
                                      Book
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}