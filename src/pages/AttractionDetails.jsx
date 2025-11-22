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
import { getPrice, getBasePrice, getDiscountPercent } from '../utils/pricing';

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
  const [linkedGallery, setLinkedGallery] = React.useState({ status: 'idle', items: [], error: null });

  React.useEffect(() => {
    if (!attrId) {
      setDetails({ status: 'failed', data: null, error: 'Invalid attraction id' });
    }
  }, [attrId]);

  const numericAttrId = React.useMemo(() => {
    const fromDetails = getAttrId(details.data || {});
    const parsedDetailsId = Number(fromDetails);
    if (Number.isFinite(parsedDetailsId)) return parsedDetailsId;
    const fallback = Number(attrId);
    return Number.isFinite(fallback) ? fallback : null;
  }, [details.data, attrId]);

  const loadLinkedGallery = React.useCallback((targetId) => {
    if (!targetId) return () => {};
    let canceled = false;
    setLinkedGallery({ status: 'loading', items: [], error: null });
    (async () => {
      try {
        const res = await api.get(endpoints.gallery.list(), {
          params: { active: true, target_type: 'attraction', target_ref_id: targetId, limit: 12 }
        });
        if (canceled) return;
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setLinkedGallery({ status: 'succeeded', items, error: null });
      } catch (err) {
        if (canceled) return;
        setLinkedGallery({ status: 'failed', items: [], error: err?.message || 'Failed to load gallery' });
      }
    })();
    const cancel = () => {
      canceled = true;
    };
    return cancel;
  }, [attrId]);

  React.useEffect(() => {
    if (!numericAttrId) {
      setLinkedGallery({ status: 'idle', items: [], error: null });
      return () => {};
    }
    const cancel = loadLinkedGallery(numericAttrId);
    return cancel;
  }, [numericAttrId, loadLinkedGallery]);

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
  const hasLinkedGallery = linkedGallery.items.length > 0;
  const cover = imgSrc(a, `https://picsum.photos/seed/attr${attrId}/1200/600`);

  const selectedSlot = React.useMemo(() => {
    for (let i = 0; i < slots.items.length; i++) {
      const s = slots.items[i];
      if (getSlotKey(s, i) === slotKey) return s;
    }
    return null;
  }, [slots.items, slotKey]);

  const slotFinalPrice = selectedSlot?.price != null ? Number(selectedSlot.price) : null;
  const slotBasePrice = selectedSlot?.base_price != null ? Number(selectedSlot.base_price) : null;
  const finalPrice = slotFinalPrice != null ? slotFinalPrice : getPrice(a);
  const baseUnitPrice = slotBasePrice != null ? slotBasePrice : getBasePrice(a);
  const hasDiscount = baseUnitPrice > 0 && finalPrice > 0 && finalPrice < baseUnitPrice;
  const discountPercent = hasDiscount
    ? Math.round(selectedSlot?.discount_percent ?? getDiscountPercent(a) ?? ((baseUnitPrice - finalPrice) / baseUnitPrice) * 100)
    : 0;

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
    const params = new URLSearchParams({
      type: 'attraction',
      attraction_id: String(aId),
      date: toYMD(date),
      slot: slotKey,
      qty: String(Math.max(1, Number(qty) || 1))
    });
    navigate(`/booking?${params.toString()}`);
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
            <img src={cover} alt="snowcity" loading="lazy" className="w-full h-full object-cover" />
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

              {a?.description ? (
                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-3">About</h2>
                  <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: a.description }} />
                </div>
              ) : null}

              {linkedGallery.status === 'loading' && !linkedGallery.items.length ? (
                <div className="mt-8"><Loader /></div>
              ) : null}
              {linkedGallery.status === 'failed' ? (
                <div className="mt-8">
                  <ErrorState message={linkedGallery.error} onRetry={() => numericAttrId && loadLinkedGallery(numericAttrId)} />
                </div>
              ) : null}
              {linkedGallery.items.length ? (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Gallery</h2>
                    <span className="text-sm text-gray-500">#{linkedGallery.items[0]?.target_name || title}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {linkedGallery.items.map((item) => {
                      const isVideo = String(item.media_type || '').toLowerCase() === 'video';
                      const mediaUrl = isVideo ? item.url : imgSrc(item);
                      if (!mediaUrl) return null;
                      return (
                        <figure key={`linked-media-${item.gallery_item_id}`} className="relative rounded-xl overflow-hidden border shadow-sm bg-white">
                          {isVideo ? (
                            <video className="w-full h-48 object-cover" src={mediaUrl} controls preload="metadata" poster={imgSrc(item.thumbnail)} />
                          ) : (
                            <img src={mediaUrl} alt={item.title || title} className="w-full h-48 object-cover" loading="lazy" />
                          )}
                          {(item.title || item.description) ? (
                            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs text-white">
                              {item.title ? <div className="font-medium text-sm">{item.title}</div> : null}
                              {item.description ? <div className="opacity-80 mt-1">{item.description}</div> : null}
                            </figcaption>
                          ) : null}
                        </figure>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <aside className="md:col-span-1">
          <div className="rounded-2xl border shadow-sm bg-white p-4 sticky top-24">
            <div className="flex items-baseline justify-between">
              <div className="flex flex-col">
                <span className="text-2xl font-semibold text-gray-900">₹{Math.round(finalPrice || 0)}</span>
                {hasDiscount ? (
                  <span className="text-sm text-gray-500 line-through">₹{Math.round(baseUnitPrice)}</span>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">per ticket</div>
                {hasDiscount ? (
                  <div className="text-xs font-semibold text-green-600">Save {discountPercent}%</div>
                ) : null}
              </div>
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