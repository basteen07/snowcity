import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import { imgSrc } from '../utils/media';

import {
  setStep, setContact, setCouponCode,
  sendAuthOtp, verifyAuthOtp, applyCoupon,
  createBooking, initiatePayPhi
} from '../features/bookings/bookingsSlice';

import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import { fetchAddons } from '../features/addons/addonsSlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';

/* ================= Helpers ================= */
const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');
const todayYMD = () => dayjs().format('YYYY-MM-DD');

const getAttrId = (a) => a?.id ?? a?._id ?? a?.attraction_id ?? null;
const getComboId = (c) => c?.id ?? c?._id ?? c?.combo_id ?? null;

const getSlotKey = (s, idx) =>
  String(
    s?.id ??
    s?._id ??
    s?.slot_id ??
    s?.combo_slot_id ??
    `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`
  );

const getSlotLabel = (s) =>
  s?.label || (s?.start_time && s?.end_time ? `${s.start_time} - ${s.end_time}` : `Slot #${s?.id ?? s?._id ?? s?.slot_id ?? '?'}`);

const fmtPhone = (s) => (s || '').replace(/[^\d+]/g, '');

const getAddonPrice = (a) => Number(a?.price ?? a?.amount ?? 0);
const getAddonId = (addon) => addon?.id ?? addon?.addon_id ?? addon?._id ?? null;
const getAddonName = (addon) => addon?.name ?? addon?.title ?? addon?.label ?? 'Addon';
const getAddonImage = (addon) => {
  if (!addon) return null;
  const candidates = [addon, addon?.image_url, addon?.image, addon?.thumbnail, addon?.cover_image];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const resolved = typeof candidate === 'string' ? imgSrc(candidate) : imgSrc(candidate);
    if (resolved) return resolved;
  }
  return null;
};
const getAddonDescription = (addon) => addon?.short_description ?? addon?.subtitle ?? addon?.description ?? '';
const clampQty = (qty, min = 0, max = 10) => Math.min(Math.max(qty, min), max);

const getComboLabel = (combo, fallbackId = null) => {
  if (!combo) return fallbackId ? `Combo ${fallbackId}` : 'Combo';
  const direct = combo.name ?? combo.title ?? combo.combo_name ?? combo.label ?? combo.slug ?? combo.code ?? null;
  if (direct) return direct;

  const collected = [];
  const attrLike = [
    combo.attraction_1,
    combo.attraction_2,
    combo.attraction_one,
    combo.attraction_two,
  ].filter(Boolean);
  if (Array.isArray(combo.attractions)) attrLike.push(...combo.attractions.filter(Boolean));
  attrLike.forEach((a) => {
    const label = a?.title ?? a?.name ?? a?.label ?? null;
    if (label) collected.push(label);
  });

  if (!collected.length) {
    const n1 = combo.attraction_1_name ?? combo.attraction1_name ?? combo.attractionOneName ?? null;
    const n2 = combo.attraction_2_name ?? combo.attraction2_name ?? combo.attractionTwoName ?? null;
    [n1, n2].filter(Boolean).forEach((n) => collected.push(n));
  }

  if (collected.length) return collected.join(' + ');
  const fallback = fallbackId ?? combo.combo_id ?? combo.id ?? combo._id;
  return fallback ? `Combo ${fallback}` : 'Combo';
};

const normalizePayphiMobile = (s) => {
  const digits = String(s || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
};

const slotHasCapacity = (slot) => {
  if (!slot) return true;
  if (slot.available === false) return false;
  const cap = Number(slot.capacity ?? slot.available_capacity ?? slot.available);
  if (Number.isNaN(cap)) return true;
  if (slot.booked != null) {
    const booked = Number(slot.booked);
    if (!Number.isNaN(booked)) return cap - booked > 0;
  }
  if (slot.available != null && typeof slot.available === 'number') {
    return Number(slot.available) > 0;
  }
  return cap > 0;
};

/* ================= Component ================= */
export default function Booking() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const hasToken = !!auth?.token;

  const attractionsState = useSelector((s) => s.attractions);
  const combosState = useSelector((s) => s.combos);
  const addonsState = useSelector((s) => s.addons);
  const { step, contact, otp, coupon, creating, payphi } = useSelector((s) => s.bookings);

  const [sel, setSel] = React.useState({
    itemType: 'attraction', // 'attraction' | 'combo'
    attractionId: '',
    comboId: '',
    date: todayYMD(),
    slotKey: '',
    qty: 1,
  });
  const [slots, setSlots] = React.useState({
    status: 'idle',
    items: [],
    error: null,
    kind: 'attraction'
  });
  const [otpCode, setOtpCode] = React.useState('');
  const [promoInput, setPromoInput] = React.useState('');

  // Offers (optional)
  const [offers, setOffers] = React.useState([]);
  const [offersStatus, setOffersStatus] = React.useState('idle');
  const [selectedOfferId, setSelectedOfferId] = React.useState('');

  // Selected add-ons: Map(addonId -> { addon_id, quantity, price, name, image, description })
  const [selectedAddons, setSelectedAddons] = React.useState(new Map());

  const [search] = useSearchParams();
  const preselectAttrId = search.get('attraction_id');
  const preselectComboId = search.get('combo_id');
  const preselectItemType = search.get('item_type');

  // Load data
  React.useEffect(() => {
    if (attractionsState.status === 'idle') dispatch(fetchAttractions({ active: true, limit: 100 }));
    if (combosState.status === 'idle') dispatch(fetchCombos({ active: true, limit: 100 }));
    if (addonsState.status === 'idle') dispatch(fetchAddons({ active: true, limit: 100 }));
  }, [dispatch, attractionsState.status, combosState.status, addonsState.status]);

  // Load offers when on Step 4
  React.useEffect(() => {
    if (step !== 4 || offersStatus !== 'idle') return;
    (async () => {
      try {
        setOffersStatus('loading');
        const res = await api.get(endpoints.offers.list());
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setOffers(list);
        setOffersStatus('succeeded');
      } catch {
        setOffers([]);
        setOffersStatus('failed');
      }
    })();
  }, [step, offersStatus]);

  // Auto-skip Step 2 if logged in
  React.useEffect(() => {
    if (step === 2 && hasToken) dispatch(setStep(3));
  }, [step, hasToken, dispatch]);

  // Preselect via querystring
  React.useEffect(() => {
    if (preselectItemType && (preselectItemType === 'combo' || preselectItemType === 'attraction')) {
      setSel((s) => ({ ...s, itemType: preselectItemType, slotKey: '' }));
    }
    if (preselectAttrId) {
      const exists = (attractionsState.items || []).some((a) => String(getAttrId(a)) === String(preselectAttrId));
      if (exists) setSel((s) => ({ ...s, itemType: 'attraction', attractionId: String(preselectAttrId), slotKey: '' }));
    }
    if (preselectComboId) {
      const existsC = (combosState.items || []).some((c) => String(getComboId(c)) === String(preselectComboId));
      if (existsC) setSel((s) => ({ ...s, itemType: 'combo', comboId: String(preselectComboId), slotKey: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preselectAttrId, preselectComboId, preselectItemType, attractionsState.items, combosState.items]);

  const fetchSlots = React.useCallback(async ({ itemType, attractionId, comboId, date }) => {
    if (!date) return;
    const key = itemType === 'combo' ? comboId : attractionId;
    if (!key) return;

    setSlots({ status: 'loading', items: [], error: null, kind: itemType });
    try {
      if (itemType === 'combo') {
        const res = await api.get(endpoints.combos.slots(key), { params: { date: toYMD(date) } });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSlots({ status: 'succeeded', items: list, error: null, kind: 'combo' });
      } else {
        const res = await api.get(endpoints.slots.list(), { params: { attraction_id: key, date: toYMD(date) } });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSlots({ status: 'succeeded', items: list, error: null, kind: 'attraction' });
      }
    } catch (err) {
      setSlots({ status: 'failed', items: [], error: err?.message || 'Failed to load slots', kind: itemType });
    }
  }, []);

  React.useEffect(() => {
    const itemType = sel.itemType;
    const date = sel.date;
    const attractionId = sel.attractionId;
    const comboId = sel.comboId;
    const key = itemType === 'combo' ? comboId : attractionId;
    if (key && date) {
      setSel((s) => ({ ...s, slotKey: '' }));
      fetchSlots({ itemType, attractionId, comboId, date });
    } else {
      setSlots({ status: 'idle', items: [], error: null, kind: itemType });
    }
  }, [sel.itemType, sel.attractionId, sel.comboId, sel.date, fetchSlots]);

  const attractions = attractionsState.items || [];
  const combos = combosState.items || [];
  const selectedAttraction = React.useMemo(
    () => sel.itemType === 'attraction'
      ? attractions.find((a) => String(getAttrId(a)) === String(sel.attractionId))
      : null,
    [attractions, sel.itemType, sel.attractionId]
  );
  const selectedCombo = React.useMemo(
    () => sel.itemType === 'combo'
      ? combos.find((c) => String(getComboId(c)) === String(sel.comboId))
      : null,
    [combos, sel.itemType, sel.comboId]
  );
  const selectedSlot = React.useMemo(() => {
    for (let i = 0; i < slots.items.length; i++) {
      const s = slots.items[i];
      if (getSlotKey(s, i) === sel.slotKey) return s;
    }
    return null;
  }, [slots.items, sel.slotKey]);

  const selectedMeta = React.useMemo(() => {
    if (sel.itemType === 'combo' && selectedCombo) {
      const price = selectedSlot?.price != null
        ? Number(selectedSlot.price)
        : Number(selectedCombo?.combo_price || selectedCombo?.price || 0);
      return {
        title: getComboLabel(selectedCombo, getComboId(selectedCombo)),
        price
      };
    }
    if (sel.itemType === 'attraction' && selectedAttraction) {
      const price = selectedSlot?.price != null
        ? Number(selectedSlot.price)
        : Number(selectedAttraction?.price || selectedAttraction?.base_price || selectedAttraction?.amount || 0);
      return {
        title: selectedAttraction?.name || selectedAttraction?.title || `Attraction #${getAttrId(selectedAttraction)}`,
        price
      };
    }
    return { title: '', price: 0 };
  }, [sel.itemType, selectedCombo, selectedAttraction, selectedSlot]);

  // Totals for UI (server re-computes final)
  const qty = Math.max(1, Number(sel.qty) || 1);
  const ticketsSubtotal = Number(selectedMeta.price || 0) * qty;
  const addonsSubtotal = Array.from(selectedAddons.values()).reduce((sum, a) => sum + (Number(a.price || 0) * Number(a.quantity || 0)), 0);
  const grossTotal = ticketsSubtotal + addonsSubtotal;
  const discount = Number(coupon.discount || 0);
  const finalTotal = Math.max(0, grossTotal - discount);

  // OTP
  const sendOTP = async () => {
    const email = (contact.email || '').trim();
    const phone = (contact.phone || '').replace(/[^\d+]/g, '');
    if (!email && !phone) return alert('Enter email or phone');
    await dispatch(sendAuthOtp({ email, phone })).unwrap().catch((e) => alert(e?.message || 'Failed to send OTP'));
  };

  const verifyOTP = async () => {
    if (!otpCode) return alert('Enter the OTP code');
    await dispatch(verifyAuthOtp({ otp: otpCode })).unwrap().catch((e) => alert(e?.message || 'OTP verification failed'));
  };

  // Coupon apply
  const applyPromo = async () => {
    if (!promoInput) return;
    await dispatch(applyCoupon({ code: promoInput, total_amount: grossTotal, onDate: sel.date || toYMD(new Date()) }))
      .unwrap()
      .then(() => dispatch(setCouponCode(promoInput)))
      .catch(() => {});
  };

  // Checkout: create booking -> initiate PayPhi
  const onPlaceOrderAndPay = async () => {
    if (!hasToken) { alert('Please verify OTP to proceed.'); return; }
    if (!sel.date || !sel.slotKey || !qty || (!selectedAttraction && !selectedCombo)) {
      alert('Please complete selection (item, date, slot, quantity).');
      return;
    }

    try {
      // Addons payload
      const addonsPayload = Array.from(selectedAddons.values())
        .filter((a) => Number(a.quantity) > 0)
        .map((a) => ({ addon_id: a.addon_id, quantity: Number(a.quantity) }));

      // Build payload
      const item_type = sel.itemType === 'combo' ? 'Combo' : 'Attraction';
      let payload;
      if (sel.itemType === 'combo') {
        const comboSlotId = selectedSlot?.combo_slot_id ?? selectedSlot?.id ?? selectedSlot?._id ?? null;
        payload = {
          item_type,
          combo_id: getComboId(selectedCombo),
          combo_slot_id: comboSlotId,
          booking_date: toYMD(sel.date),
          quantity: qty,
          addons: addonsPayload,
          coupon_code: (coupon?.code || '').trim() || undefined,
          offer_id: selectedOfferId ? Number(selectedOfferId) : undefined
        };
      } else {
        const slotId = selectedSlot?.slot_id ?? selectedSlot?.id ?? selectedSlot?._id ?? null;
        payload = {
          item_type,
          attraction_id: getAttrId(selectedAttraction),
          slot_id: slotId,
          booking_date: toYMD(sel.date),
          quantity: qty,
          addons: addonsPayload,
          coupon_code: (coupon?.code || '').trim() || undefined,
          offer_id: selectedOfferId ? Number(selectedOfferId) : undefined
        };
      }

      // 1) Create booking
      const created = await dispatch(createBooking(payload)).unwrap();
      const bookingId = created?.booking_id || created?.booking?.id || created?.booking?.booking_id;
      if (!bookingId) throw new Error('Booking ID missing from server response');

      // 2) Initiate payment
      const email = (contact.email || auth?.user?.email || '').trim();
      const mobileRaw = (contact.phone || auth?.user?.phone || '');
      const mobile = normalizePayphiMobile(mobileRaw);
      if (!email || !mobile || mobile.length < 10) {
        alert('Enter a valid email and 10-digit mobile to continue.');
        return;
      }

      const init = await dispatch(initiatePayPhi({ bookingId, email, mobile })).unwrap();
      const redirectUrl = init?.redirectUrl;
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }

      showPayphiError('Payment initiation failed', init || {});
    } catch (err) {
      showPayphiError('Payment initiation failed', err);
    }
  };

  const showPayphiError = (prefix = 'Payment initiation failed', payload = null) => {
    const code =
      payload?.responseCode ||
      payload?.code ||
      payload?.status ||
      payload?.data?.code ||
      payload?.response?.responseCode ||
      payload?.response?.code ||
      null;
    const message =
      payload?.responseMessage ||
      payload?.message ||
      payload?.data?.message ||
      payload?.response?.responseMessage ||
      payload?.response?.message ||
      payload?.error ||
      null;

    let detail = '';
    if (code) detail += `[${code}]`;
    if (message) detail += `${detail ? ' ' : ''}${message}`;

    const text = detail ? `${prefix}: ${detail}` : `${prefix}. Try again from My Bookings.`;
    alert(text);
  };

  /* ================= UI pieces ================= */
  const ItemTypeTabs = () => (
    <div className="inline-flex rounded-full border overflow-hidden">
      {['attraction', 'combo'].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => {
            setSel((s) => ({ ...s, itemType: type, attractionId: '', comboId: '', slotKey: '' }));
            setSelectedAddons(new Map());
            setSelectedOfferId('');
          }}
          className={`px-4 py-2 text-sm capitalize ${sel.itemType === type ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-50'}`}
        >
          {type === 'attraction' ? 'Attractions' : 'Combos'}
        </button>
      ))}
    </div>
  );

  const AttractionSelect = () => (
    <select
      className="w-full rounded-md border px-3 py-2"
      value={sel.attractionId}
      onChange={(e) => {
        setSel((s) => ({ ...s, attractionId: e.target.value, slotKey: '' }));
        setSelectedAddons(new Map());
        setSelectedOfferId('');
      }}
    >
      <option key="opt-none" value="">
        Select an attraction
      </option>
      {attractions.map((a, idx) => {
        const val = getAttrId(a);
        return (
          <option key={`attr-opt-${val ?? idx}`} value={val ?? ''}>
            {a.name || a.title || `Attraction #${val ?? idx}`}
          </option>
        );
      })}
    </select>
  );

  const DateInput = () => (
    <input
      type="date"
      className="w-full rounded-md border px-3 py-2"
      min={todayYMD()}
      value={sel.date}
      onChange={(e) => {
        setSel((s) => ({ ...s, date: e.target.value, slotKey: '' }));
        setSelectedAddons(new Map());
      }}
    />
  );

  const SlotPicker = () => {
    const key = sel.itemType === 'combo' ? sel.comboId : sel.attractionId;
    if (!key || !sel.date) {
      return <div className="text-sm text-gray-500">Select {sel.itemType === 'combo' ? 'combo' : 'attraction'} and date to see slots.</div>;
    }
    if (slots.status === 'loading') return <Loader className="py-6" />;
    if (slots.status === 'failed') return <ErrorState message={slots.error} onRetry={() => fetchSlots(sel.itemType === 'combo' ?
      { itemType: 'combo', comboId: sel.comboId, date: sel.date }
      : { itemType: 'attraction', attractionId: sel.attractionId, date: sel.date })} />;
    if (!slots.items.length) return <div className="text-sm text-gray-500">No slots available for this date.</div>;

    return (
      <div className="flex flex-wrap gap-2">
        {slots.items.map((s, i) => {
          const sid = getSlotKey(s, i);
          const selected = sel.slotKey === sid;
          const disabled = !slotHasCapacity(s);
          return (
            <button
              key={`slot-${sid}`}
              type="button"
              disabled={disabled}
              onClick={() => setSel((st) => ({ ...st, slotKey: sid }))}
              className={`px-3 py-2 rounded-full border text-sm ${
                disabled ? 'opacity-50 cursor-not-allowed'
                : selected ? 'bg-blue-600 text-white border-blue-600'
                : 'hover:bg-gray-50'
              }`}
              title={getSlotLabel(s)}
            >
              {getSlotLabel(s)}
            </button>
          );
        })}
      </div>
    );
  };

  const QtyInput = () => (
    <div className="inline-flex items-center rounded-full border overflow-hidden">
      <button type="button" className="px-3 py-2 hover:bg-gray-50" onClick={() => setSel((s) => ({ ...s, qty: Math.max(1, Number(s.qty) - 1) }))}>-</button>
      <input type="number" min={1} className="w-16 text-center py-2" value={sel.qty} onChange={(e) => setSel((s) => ({ ...s, qty: Math.max(1, Number(e.target.value) || 1) }))} />
      <button type="button" className="px-3 py-2 hover:bg-gray-50" onClick={() => setSel((s) => ({ ...s, qty: Math.max(1, Number(s.qty) + 1) }))}>+</button>
    </div>
  );

  const AddonsPicker = () => {
    const addons = addonsState.items || [];
    if (!selectedMeta.title) return <div className="text-sm text-gray-600">Complete Step 1 to choose add-ons.</div>;

    const onQtyChange = (addon, delta, meta) => {
      const { addonId, maxQty, name, price, image, description } = meta;
      if (!addonId) return;
      const key = String(addonId);
      const prev = selectedAddons.get(key);
      const base = prev ? { ...prev } : { addon_id: addonId, quantity: 0, price, name, image, description, max_quantity: maxQty };
      const nextQty = clampQty(Number(base.quantity || 0) + delta, 0, maxQty);
      const nextMap = new Map(selectedAddons);
      if (nextQty <= 0) nextMap.delete(key);
      else nextMap.set(key, { ...base, quantity: nextQty, price, name, image, description, max_quantity: maxQty });
      setSelectedAddons(nextMap);
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {addons.map((a, i) => {
          const addonId = getAddonId(a);
          if (addonId == null) return null;
          const key = String(addonId);
          const price = getAddonPrice(a);
          const name = getAddonName(a);
          const image = getAddonImage(a);
          const description = getAddonDescription(a);
          const maxQtyRaw = Number(a?.max_quantity ?? a?.max_per_booking ?? 10);
          const maxQty = Number.isFinite(maxQtyRaw) && maxQtyRaw > 0 ? maxQtyRaw : 10;
          const selA = selectedAddons.get(key);
          const q = Number(selA?.quantity || 0);
          const meta = { addonId, maxQty, name, price, image, description };
          const total = price * q;
          return (
            <div key={`addon-${addonId ?? i}`} className="flex flex-col gap-3 rounded-lg border p-3">
              <div className="flex items-center gap-3">
                {image ? (
                  <img src={image} alt={name} className="h-16 w-16 rounded-lg object-cover" loading="lazy" decoding="async" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-[11px] text-gray-500">No image</div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-sm">{name}</div>
                  {description ? <div className="text-xs text-gray-500 line-clamp-2">{description}</div> : null}
                  <div className="text-xs text-gray-600 mt-1">₹{price} each{maxQty ? ` · Max ${maxQty}` : ''}</div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-600">Subtotal: ₹{total}</div>
                <div className="inline-flex items-center rounded-full border overflow-hidden">
                  <button type="button" className="px-3 py-1 hover:bg-gray-50 disabled:opacity-50" onClick={() => onQtyChange(a, -1, meta)} disabled={q <= 0} aria-label={`Decrease ${name}`}>-</button>
                  <div className="w-10 text-center text-sm">{q}</div>
                  <button type="button" className="px-3 py-1 hover:bg-gray-50 disabled:opacity-50" onClick={() => onQtyChange(a, +1, meta)} disabled={q >= maxQty} aria-label={`Increase ${name}`}>+</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const OfferSelect = () => {
    if (offersStatus === 'loading') return <div className="text-xs text-gray-500">Loading offers…</div>;
    if (offersStatus === 'failed') return <div className="text-xs text-gray-500">Offers unavailable</div>;
    if (!offers.length) return null;

    return (
      <div className="mt-4">
        <label className="block text-sm text-gray-600 mb-1">Offer</label>
        <select
          className="w-full md:w-64 rounded-md border px-3 py-2"
          value={selectedOfferId}
          onChange={(e) => setSelectedOfferId(e.target.value)}
        >
          <option value="">No offer</option>
          {offers.map((o) => {
            const id = o.offer_id ?? o.id ?? o._id;
            const label = o.title || o.code || `Offer #${id}`;
            return (
              <option key={`offer-${id}`} value={id ?? ''}>{label}</option>
            );
          })}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          Note: If both coupon and offer are set, the best discount will be applied.
        </div>
      </div>
    );
  };

  /* ================= Render ================= */
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Book Tickets</h1>
      <p className="text-gray-600 mb-6">Choose your attraction/combo, verify if needed, pick add-ons, apply promo or an offer, and pay.</p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {[1,2,3,4].map(n => (
          <React.Fragment key={n}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= n ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{n}</div>
            {n < 4 ? <div className={`flex-1 h-[2px] ${step > n ? 'bg-blue-600' : 'bg-gray-200'}`} /> : null}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Select */}
      {step === 1 && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Item type</label>
              <ItemTypeTabs />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">{sel.itemType === 'combo' ? 'Combo' : 'Attraction'}</label>
              {sel.itemType === 'combo'
                ? (combosState.status === 'loading' && !combos.length
                    ? <Loader />
                    : combosState.status === 'failed'
                      ? <ErrorState message={combosState.error?.message || 'Failed to load combos'} />
                      : (
                        <select
                          className="w-full rounded-md border px-3 py-2"
                          value={sel.comboId}
                          onChange={(e) => { setSel((s) => ({ ...s, comboId: e.target.value, slotKey: '' })); setSelectedAddons(new Map()); setSelectedOfferId(''); }}
                        >
                          <option key="combo-none" value="">Select a combo</option>
                          {combos.map((c, idx) => {
                            const val = getComboId(c);
                            return (
                              <option key={`combo-opt-${val ?? idx}`} value={val ?? ''}>
                                {getComboLabel(c, val ?? idx)}
                              </option>
                            );
                          })}
                        </select>
                      )
                  )
                : (attractionsState.status === 'loading' && !attractions.length
                    ? <Loader />
                    : attractionsState.status === 'failed'
                      ? <ErrorState message={attractionsState.error?.message || 'Failed to load attractions'} />
                      : <AttractionSelect />)
              }
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <DateInput />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Slot</label>
              <SlotPicker />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Quantity</label>
              <QtyInput />
            </div>
            {selectedMeta.title ? (
              <div className="text-sm text-gray-700">
                <div className="font-medium">{selectedMeta.title}</div>
                <div>Unit price: <span className="font-medium">₹{selectedMeta.price}</span></div>
              </div>
            ) : null}
            <div className="ml-auto text-right">
              <div className="text-sm text-gray-600">Tickets Subtotal</div>
              <div className="text-xl font-semibold">₹{ticketsSubtotal}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={!selectedMeta.title || !sel.date || !sel.slotKey || !qty}
              onClick={() => dispatch(setStep(hasToken ? 3 : 2))}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {/* Step 2: OTP (guests only) */}
      {step === 2 && !hasToken && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Full Name</label>
              <input className="w-full rounded-md border px-3 py-2" value={contact.name} onChange={(e) => dispatch(setContact({ name: e.target.value }))} placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email</label>
              <input className="w-full rounded-md border px-3 py-2" type="email" value={contact.email} onChange={(e) => dispatch(setContact({ email: e.target.value }))} placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <div className="flex gap-2">
                <input className="w-full rounded-md border px-3 py-2" type="tel" value={contact.phone} onChange={(e) => dispatch(setContact({ phone: fmtPhone(e.target.value) }))} placeholder="10-digit mobile" />
                <button type="button" className="whitespace-nowrap rounded-md border px-3 py-2 text-sm hover:bg-gray-50" onClick={sendOTP} disabled={otp.status === 'loading'}>
                  {otp.sent ? 'Resend OTP' : 'Send OTP'}
                </button>
              </div>
              {otp.status === 'failed' && <div className="text-xs text-red-600 mt-1">{otp.error?.message || 'OTP failed'}</div>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Enter OTP</label>
              <div className="flex gap-2">
                <input className="w-full rounded-md border px-3 py-2" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="6-digit code (123456 in test)" />
                <button type="button" className="whitespace-nowrap rounded-md bg-gray-900 text-white px-3 py-2 text-sm hover:bg-black disabled:opacity-50" onClick={verifyOTP} disabled={!otp.sent || otp.status === 'loading'}>
                  Verify
                </button>
              </div>
              {otp.verified && <div className="text-xs text-green-600 mt-1">OTP verified</div>}
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-50" onClick={() => dispatch(setStep(otp.verified ? 3 : 2))} disabled={!otp.verified}>
              Next
            </button>
          </div>
        </section>
      )}

      {/* Step 3: Add-ons */}
      {step === 3 && (
        <section>
          <h3 className="font-semibold mb-3">Add-ons</h3>
          {addonsState.status === 'loading' && !addonsState.items.length ? <Loader /> :
           addonsState.status === 'failed' ? <ErrorState message={addonsState.error?.message || 'Failed to load add-ons'} /> :
           <AddonsPicker />}

          <div className="mt-6 flex items-center justify-between">
            <button className="text-sm text-gray-700 hover:underline" onClick={() => dispatch(setStep(hasToken ? 1 : 2))}>← Back</button>
            <button className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2 text-white text-sm hover:bg-blue-700" onClick={() => dispatch(setStep(4))}>
              Next
            </button>
          </div>
        </section>
      )}

      {/* Step 4: Promo + Offer + Checkout */}
      {step === 4 && (
        <section>
          <div className="rounded-xl border p-4 mb-6">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {selectedMeta.title ? (
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                  <div className="text-gray-700">
                    {selectedMeta.title} — {toYMD(sel.date)} — {qty} ticket(s)
                  </div>
                  <div className="font-medium">₹{ticketsSubtotal}</div>
                </div>
              ) : null}
              {selectedAddons.size > 0 && (
                <div className="mt-2 text-sm text-gray-700">
                  Add-ons total: ₹{addonsSubtotal}
                </div>
              )}
            </div>
            <div className="mt-3 border-t pt-3 space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>Subtotal</span><span>₹{grossTotal}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Discount</span><span>- ₹{discount}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total</span><span>₹{finalTotal}</span>
              </div>
            </div>

            {/* Coupon + Offer */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Promo code</label>
                <div className="flex gap-2">
                  <input className="w-full md:w-64 rounded-md border px-3 py-2" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="PROMO2025" />
                  <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 disabled:opacity-50" onClick={applyPromo} disabled={!promoInput || coupon.status === 'loading'}>
                    {coupon.status === 'loading' ? 'Applying…' : 'Apply'}
                  </button>
                </div>
                {coupon.status === 'failed' && <div className="text-xs text-red-600 mt-1">{coupon.error?.message || 'Invalid code'}</div>}
                {coupon.data && <div className="text-xs text-green-700 mt-1">Applied: {coupon.data?.code || promoInput}</div>}
              </div>
              <OfferSelect />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button className="text-sm text-gray-700 hover:underline" onClick={() => dispatch(setStep(3))}>← Back</button>
            <button
              className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              onClick={onPlaceOrderAndPay}
              disabled={
                creating.status === 'loading' ||
                payphi.status === 'loading' ||
                !hasToken ||
                !selectedMeta.title ||
                !sel.date ||
                !sel.slotKey ||
                !qty
              }
            >
              {(creating.status === 'loading' || payphi.status === 'loading') ? 'Processing…' : 'Place order & Pay'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}