import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import { fetchCombos } from '../features/combos/combosSlice';
import { addCartItem, setStep } from '../features/bookings/bookingsSlice';
import { formatCurrency } from '../utils/formatters';
import { getPrice } from '../utils/pricing';
import { imgSrc } from '../utils/media';
import dayjs from 'dayjs';

const HERO_PLACEHOLDER = 'https://picsum.photos/seed/combo-hero/1280/720';
const IMAGE_PLACEHOLDER = (seed) => `https://picsum.photos/seed/${seed}/640/400`;

const pickImage = (src, seed) =>
  imgSrc(src, IMAGE_PLACEHOLDER(seed || 'combo'));

const normalizeAttraction = (raw, fallbackTitle, seed) => {
  if (!raw || typeof raw !== 'object') {
    return {
      title: fallbackTitle,
      image_url: IMAGE_PLACEHOLDER(seed),
      slug: null,
      price: 0,
    };
  }
  const title = raw.title || raw.name || fallbackTitle;
  const srcCandidate =
    raw?.image_media_id ??
    raw?.media_id ??
    raw?.cover_media_id ??
    raw?.banner_media_id ??
    raw?.url_path ??
    raw?.image_url ??
    raw?.cover_image ??
    raw?.web_image ??
    raw?.mobile_image ??
    raw?.image ??
    null;
  const image_url = imgSrc(srcCandidate, IMAGE_PLACEHOLDER(seed));
  const slug = raw.slug || raw.id || raw.attraction_id || null;
  const price = Number(raw.base_price || raw.price || raw.amount || 0);
  return { title, image_url, slug, price };
};

// Labels like "01.00pm → 02.00pm" or fallback to HH:MM
const hhmm = (s) => {
  if (!s) return '';
  const [H = '00', M = '00'] = String(s).split(':');
  return `${String(H).padStart(2, '0')}:${String(M).padStart(2, '0')}`;
};
const labelTime = (slot) => {
  if (slot?.start_time_12h && slot?.end_time_12h) {
    return `${slot.start_time_12h} → ${slot.end_time_12h}`;
  }
  const st = hhmm(slot?.start_time);
  const et = hhmm(slot?.end_time);
  return st && et ? `${st} → ${et}` : '';
};

// Robust hero image pick similar to your card logic
function getHeroImage(combo, fallbackA, fallbackB) {
  // Try resolving from explicit media fields first
  const mediaCandidate =
    combo?.banner_media_id ??
    combo?.image_media_id ??
    combo?.cover_media_id ??
    null;
  const fieldCandidate =
    mediaCandidate ??
    combo?.banner_image ??
    combo?.hero_image ??
    combo?.image_web ??
    combo?.image_url ??
    combo?.image ??
    null;
  const primary = imgSrc(fieldCandidate, '');
  if (primary) return primary;

  // Fallback to included experiences
  return fallbackA || fallbackB || HERO_PLACEHOLDER;
}

export default function ComboDetails() {
  const { id: rawParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: comboItems = [], status: combosStatus } = useSelector(
    (s) => s.combos || { items: [], status: 'idle' }
  );

  React.useEffect(() => {
    if (combosStatus === 'idle') {
      dispatch(fetchCombos({ active: true, limit: 100 }));
    }
  }, [combosStatus, dispatch]);

  const numericParam = React.useMemo(() => {
    if (!rawParam) return null;
    const num = Number(rawParam);
    return Number.isFinite(num) ? num : null;
  }, [rawParam]);

  const matchedCombo = React.useMemo(() => {
    if (!rawParam || !comboItems.length) return null;
    return (
      comboItems.find((c) => String(c?.combo_id ?? c?.id ?? '') === rawParam) ||
      comboItems.find((c) => rawParam && c?.slug && String(c.slug) === rawParam) ||
      null
    );
  }, [comboItems, rawParam]);

  const fetchId = React.useMemo(() => {
    if (numericParam != null) return numericParam;
    if (matchedCombo?.combo_id) return Number(matchedCombo.combo_id);
    if (matchedCombo?.id) return Number(matchedCombo.id);
    return null;
  }, [matchedCombo, numericParam]);

  const [state, setState] = React.useState({ status: 'idle', data: null, error: null });

  React.useEffect(() => {
    if (!rawParam) {
      setState({ status: 'failed', data: null, error: 'Combo not found' });
      return;
    }

    if (fetchId == null) {
      if (numericParam == null && (combosStatus === 'loading' || combosStatus === 'idle')) {
        setState((prev) =>
          prev.status === 'loading' ? prev : { status: 'loading', data: null, error: null }
        );
      } else if (numericParam == null && combosStatus === 'failed') {
        setState({ status: 'failed', data: null, error: 'Combo not found' });
      }
      return;
    }

    let mounted = true;
    const controller = new AbortController();
    setState({ status: 'loading', data: null, error: null });

    (async () => {
      try {
        // Public combo detail endpoint that matches endpoints.js
        const res = await api.get(endpoints.combos.byId(fetchId), { signal: controller.signal });
        if (!mounted) return;
        // res may be object already; keep as-is
        setState({ status: 'succeeded', data: res, error: null });
      } catch (err) {
        if (err?.canceled || !mounted) return;
        // Fallback to matched combo if we have one from Redux
        if (matchedCombo) {
          setState({ status: 'succeeded', data: matchedCombo, error: null });
        } else {
          setState({ status: 'failed', data: null, error: err?.message || 'Failed to load combo' });
        }
      }
    })();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [rawParam, fetchId, combosStatus, numericParam, matchedCombo]);

  // Availability/slots for selected date
  const [date, setDate] = React.useState(dayjs().format('YYYY-MM-DD'));
  const [qty, setQty] = React.useState(1);
  const [slots, setSlots] = React.useState([]);
  const [slotStatus, setSlotStatus] = React.useState('idle'); // idle|loading|loaded|failed
  const [slotErr, setSlotErr] = React.useState('');

  const loadSlots = React.useCallback(async () => {
    if (!fetchId || !date) return;
    try {
      setSlotStatus('loading');
      setSlotErr('');
      // Public slots endpoint: /api/combos/:id/slots?date=YYYY-MM-DD
      const out = await api.get(endpoints.combos.slots(fetchId), { params: { date } });
      const list = Array.isArray(out) ? out : Array.isArray(out?.data) ? out.data : [];
      setSlots(list);
      setSlotStatus('loaded');
    } catch (e) {
      setSlotErr(e?.message || 'Failed to load slots');
      setSlotStatus('failed');
    }
  }, [fetchId, date]);

  React.useEffect(() => {
    if (fetchId && date) loadSlots();
  }, [fetchId, date, loadSlots]);

  if (state.status === 'loading' && !state.data) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  if (state.status === 'failed') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white px-4">
        <div className="max-w-lg w-full">
          <ErrorState message={state.error || 'Combo not found'} />
        </div>
      </div>
    );
  }

  const combo = state.data || matchedCombo;

  if (!combo) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-white px-4">
        <div className="max-w-lg w-full">
          <ErrorState message="Combo not found" />
        </div>
      </div>
    );
  }

  const comboId = combo?.combo_id || combo?.id || fetchId || null;
  const title = combo?.name || combo?.title || 'Combo Deal';
  const subtitle = combo?.short_description || combo?.subtitle || '';
  const description = combo?.description || combo?.long_description || '';

  const attraction1 = normalizeAttraction(
    combo.attraction_1 || {
      title: combo?.attraction_1_title,
      image_url: combo?.attraction_1_image,
      slug: combo?.attraction_1_slug,
      base_price: combo?.attraction_1_price,
    },
    'Experience A',
    'combo-left'
  );

  const attraction2 = normalizeAttraction(
    combo.attraction_2 || {
      title: combo?.attraction_2_title,
      image_url: combo?.attraction_2_image,
      slug: combo?.attraction_2_slug,
      base_price: combo?.attraction_2_price,
    },
    'Experience B',
    'combo-right'
  );

  const heroImage = getHeroImage(combo, attraction1.image_url, attraction2.image_url);
  const comboPrice = getPrice(combo);
  const baseSum =
    Number(combo?.attraction_1_price || 0) + Number(combo?.attraction_2_price || 0);
  const hasBasePricing = baseSum > 0;
  const savings = hasBasePricing && comboPrice > 0 ? baseSum - comboPrice : 0;
  const discountPercent =
    hasBasePricing && comboPrice > 0
      ? Math.max(0, Math.round((1 - comboPrice / baseSum) * 100))
      : Number(combo?.discount_percent || 0);

  const onBook = (slot) => {
    const q = Math.max(1, Number(qty) || 1);
    const unitPrice = slot?.price != null ? Number(slot.price) : Number(comboPrice || 0);
    const comboSlotId = slot?.combo_slot_id ?? slot?.id ?? slot?._id ?? null;
    if (!comboSlotId) return;
    dispatch(
      addCartItem({
        itemType: 'combo',
        comboId: Number(comboId) || comboId,
        combo,
        date,
        comboSlotId,
        slot,
        qty: q,
        unitPrice,
      })
    );
    dispatch(setStep(1));
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[42vh] md:h-[56vh] bg-gray-200">
        <img
          src={heroImage || HERO_PLACEHOLDER}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
          draggable="false"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-6 left-0 right-0 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-xs uppercase tracking-wide text-gray-100 mb-2">
              <span>Combo Deal</span>
              {discountPercent > 0 ? <span>Save {discountPercent}%</span> : null}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow">{title}</h1>
            {subtitle ? (
              <p className="text-gray-200 text-sm md:text-base max-w-2xl mt-2">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Details */}
      <section className="max-w-6xl mx-auto px-4 py-8 md:py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <figure className="relative rounded-2xl overflow-hidden shadow">
              <img
                src={attraction1.image_url}
                alt={attraction1.title}
                className="w-full h-64 md:h-72 object-cover"
                loading="lazy"
              />
              <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                <p className="text-sm uppercase tracking-wide text-gray-200">Included experience</p>
                <h2 className="text-lg font-semibold">{attraction1.title}</h2>
              </figcaption>
            </figure>
            <figure className="relative rounded-2xl overflow-hidden shadow">
              <img
                src={attraction2.image_url}
                alt={attraction2.title}
                className="w-full h-64 md:h-72 object-cover"
                loading="lazy"
              />
              <figcaption className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                <p className="text-sm uppercase tracking-wide text-gray-200">Included experience</p>
                <h2 className="text-lg font-semibold">{attraction2.title}</h2>
              </figcaption>
            </figure>
          </div>

          {description ? (
            <div className="prose max-w-none">
              <h2>About this combo</h2>
              <div dangerouslySetInnerHTML={{ __html: description }} />
            </div>
          ) : null}

          {/* Availability */}
          <div id="availability" className="rounded-2xl border shadow-sm p-4 bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-xl font-semibold">Check availability</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Date</label>
                <input
                  type="date"
                  className="rounded-md border px-3 py-2 text-sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
                <label className="text-sm text-gray-600 ml-2">Qty</label>
                <input
                  type="number"
                  min={1}
                  className="w-20 rounded-md border px-2 py-1 text-sm"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
            </div>

            {slotStatus === 'loading' ? (
              <div className="py-3">
                <Loader size="sm" />
              </div>
            ) : null}
            {slotStatus === 'failed' ? (
              <div className="py-3">
                <ErrorState message={slotErr || 'Failed to load slots'} />
              </div>
            ) : null}
            {slotStatus === 'loaded' && (
              <>
                {!slots.length ? (
                  <div className="text-sm text-gray-500">
                    No slots available for {dayjs(date).format('DD MMM YYYY')}.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slots.map((slot) => {
                      const timeText = labelTime(slot);
                      const price = slot.price == null ? null : Number(slot.price);
                      return (
                        <div
                          key={
                            slot.combo_slot_id ||
                            `${slot.combo_id}-${slot.start_time}-${slot.end_time}`
                          }
                          className="flex items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div className="text-sm">
                            <div className="font-medium">{timeText}</div>
                            <div className="text-xs text-gray-500">
                              Capacity: {slot.capacity} • {slot.available ? 'Available' : 'Unavailable'}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {price != null ? (
                              <div className="text-sm font-medium">₹ {price.toLocaleString()}</div>
                            ) : (
                              <div className="text-xs text-gray-500">Price at checkout</div>
                            )}
                            <button
                              disabled={!slot.available}
                              onClick={() => onBook(slot)}
                              className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm disabled:opacity-50"
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
        </div>

        <aside className="lg:col-span-1">
          <div className="rounded-3xl border shadow-lg bg-white p-6 sticky top-24 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Combo price</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-gray-900">
                  {formatCurrency(comboPrice)}
                </span>
                <span className="text-sm text-gray-500">per combo</span>
              </div>
              {hasBasePricing ? (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="line-through mr-2">{formatCurrency(baseSum)}</span>
                  {discountPercent > 0 ? (
                    <span className="text-emerald-600 font-medium">
                      Save {discountPercent}% ({formatCurrency(savings)})
                    </span>
                  ) : (
                    <span>Special combo pricing</span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <p>
                Includes admission for both attractions listed below. Book together to lock in
                bundled savings.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>{attraction1.title}</li>
                <li>{attraction2.title}</li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href="#availability"
                className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white px-6 py-3 text-sm font-medium hover:bg-blue-700"
              >
                Check availability
              </a>
              <Link
                to="/combos"
                className="inline-flex items-center justify-center rounded-full border border-blue-100 text-blue-600 px-6 py-3 text-sm font-medium hover:bg-blue-50"
              >
                Explore other combos
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}