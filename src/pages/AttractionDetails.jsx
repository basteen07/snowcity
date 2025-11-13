import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import dayjs from 'dayjs';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import { addCartItem, setStep } from '../features/bookings/bookingsSlice';
import { getAttrId } from '../utils/ids';
import { imgSrc } from '../utils/media';

const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');
const todayYMD = () => dayjs().format('YYYY-MM-DD');

const getSlotKey = (s, idx) =>
  String(s?.id ?? s?._id ?? s?.slot_id ?? `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`);

const getSlotLabel = (s) =>
  s?.label ||
  (s?.start_time && s?.end_time ? `${s.start_time} - ${s.end_time}` : `Slot #${s?.id ?? s?._id ?? s?.slot_id ?? '?'}`);

export default function AttractionDetails() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const attrId = React.useMemo(() => {
    if (!idParam || idParam === 'undefined' || idParam === 'null') return null;
    return idParam;
  }, [idParam]);

  const [details, setDetails] = React.useState({ status: 'idle', data: null, error: null });
  const [date, setDate] = React.useState(todayYMD());
  const [slots, setSlots] = React.useState({ status: 'idle', items: [], error: null });
  const [slotKey, setSlotKey] = React.useState('');
  const [qty, setQty] = React.useState(1);

  React.useEffect(() => {
    if (!attrId) {
      setDetails({ status: 'failed', data: null, error: 'Invalid attraction id' });
    }
  }, [attrId]);

  React.useEffect(() => {
    if (!attrId) return;
    setDetails({ status: 'loading', data: null, error: null });
    const ac = new AbortController();
    (async () => {
      try {
        const res = await api.get(endpoints.attractions.byId(attrId), { signal: ac.signal });
        const data = res?.attraction || res || null;
        setDetails({ status: 'succeeded', data, error: null });
      } catch (err) {
        if (err?.canceled) return;
        setDetails({ status: 'failed', data: null, error: err?.message || 'Failed to load attraction' });
      }
    })();
    return () => ac.abort();
  }, [attrId]);

  const fetchSlots = React.useCallback(async () => {
    if (!attrId || !date) return;
    setSlots((s) => ({ ...s, status: 'loading', error: null, items: [] }));
    const ac = new AbortController();
    try {
      const res = await api.get(endpoints.slots.list(), {
        params: { attraction_id: attrId, date: toYMD(date) },
        signal: ac.signal
      });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setSlots({ status: 'succeeded', items: list, error: null });
    } catch (err) {
      if (err?.canceled) return;
      setSlots({ status: 'failed', items: [], error: err?.message || 'Failed to load slots' });
    }
    return () => ac.abort();
  }, [attrId, date]);

  React.useEffect(() => {
    if (attrId && date) {
      setSlotKey('');
      fetchSlots();
    } else {
      setSlots({ status: 'idle', items: [], error: null });
    }
  }, [attrId, date, fetchSlots]);

  const a = details.data;
  const title = a?.name || a?.title || 'Attraction';
  const cover = imgSrc(a, `https://picsum.photos/seed/attr${attrId}/1200/600`);
  const baseUnitPrice = Number(a?.price ?? a?.base_price ?? a?.amount ?? 0);

  const selectedSlot = React.useMemo(() => {
    for (let i = 0; i < slots.items.length; i++) {
      const s = slots.items[i];
      if (getSlotKey(s, i) === slotKey) return s;
    }
    return null;
  }, [slots.items, slotKey]);

  const onBookNow = () => {
    if (!a || !date || !selectedSlot || !qty) return;
    const slotId = selectedSlot?.id ?? selectedSlot?._id ?? selectedSlot?.slot_id;
    if (!slotId) return;

    const aId = getAttrId(a);
    dispatch(
      addCartItem({
        attractionId: aId,
        attraction: a,
        date: toYMD(date),
        slotId,
        slot: selectedSlot,
        qty: Math.max(1, Number(qty) || 1),
        unitPrice: Number(selectedSlot?.price ?? baseUnitPrice)
      })
    );
    dispatch(setStep(1));
    navigate('/booking');
  };

  return (
    <div className="min-h-screen">
      <section className="relative h-[42vh] md:h-[56vh] bg-gray-200">
        {details.status === 'loading' ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader />
          </div>
        ) : cover ? (
          <>
            <img src={cover} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-6 left-0 right-0 px-4">
              <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl md:text-4xl font-bold text-white drop-shadow">{title}</h1>
              </div>
            </div>
          </>
        ) : null}
      </section>

      <section className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {details.status === 'failed' ? (
            <ErrorState message={details.error} />
          ) : (
            <>
              {a?.short_description ? (
                <p className="text-gray-700 text-lg">{a.short_description}</p>
              ) : null}

              {Array.isArray(a?.images) && a.images.length > 1 ? (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {a.images.slice(1, 7).map((src, i) => (
                    <img
                      key={`img-${i}`}
                      src={imgSrc(src)}
                      alt={`${title} ${i + 1}`}
                      className="w-full h-40 md:h-48 object-cover rounded-lg"
                      loading="lazy"
                    />
                  ))}
                </div>
              ) : null}

              {a?.description ? (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-3">About</h2>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: a.description }} />
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className="md:col-span-1">
          <div className="rounded-2xl border shadow-sm bg-white p-4 sticky top-24">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-semibold">₹{Number(selectedSlot?.price ?? baseUnitPrice)}</div>
              <div className="text-xs text-gray-500">per ticket</div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full rounded-md border px-3 py-2"
                  min={todayYMD()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Slot</label>
                {slots.status === 'loading' ? (
                  <Loader className="py-4" />
                ) : slots.status === 'failed' ? (
                  <ErrorState message={slots.error} />
                ) : slots.items.length ? (
                  <div className="flex flex-wrap gap-2">
                    {slots.items.map((s, i) => {
                      const sid = getSlotKey(s, i);
                      const selected = slotKey === sid;
                      const disabled = s?.available === 0 || s?.capacity === 0;
                      return (
                        <button
                          key={`slot-${sid}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSlotKey(sid)}
                          className={`px-3 py-2 rounded-full border text-sm ${
                            disabled
                              ? 'opacity-50 cursor-not-allowed'
                              : selected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                          title={getSlotLabel(s)}
                        >
                          {getSlotLabel(s)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No slots available for this date.</div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                <div className="inline-flex items-center rounded-full border overflow-hidden">
                  <button type="button" className="px-3 py-2 hover:bg-gray-50" onClick={() => setQty((q) => Math.max(1, Number(q) - 1))}>-</button>
                  <input type="number" min={1} className="w-16 text-center py-2" value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} />
                  <button type="button" className="px-3 py-2 hover:bg-gray-50" onClick={() => setQty((q) => Math.max(1, Number(q) + 1))}>+</button>
                </div>
              </div>

              <button
                className="w-full rounded-full bg-blue-600 text-white px-5 py-2 text-sm hover:bg-blue-700 disabled:opacity-50"
                onClick={onBookNow}
                disabled={!a || !date || !slotKey || !qty}
              >
                Book Now
              </button>

              <div className="text-xs text-gray-500 text-center">
                We’ll add this to your cart so you can add more attractions before checkout.
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}