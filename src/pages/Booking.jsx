import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import { imgSrc } from '../utils/media';

import {
  setStep, setContact,
  addCartItem, updateCartItem, removeCartItem, clearCart,
  setItemAddons, setCouponCode,
  sendAuthOtp, verifyAuthOtp, applyCoupon,
  createAllBookings, initiatePayPhi
} from '../features/bookings/bookingsSlice';

import { fetchAttractions } from '../features/attractions/attractionsSlice';
import { fetchCombos } from '../features/combos/combosSlice';
import { fetchAddons } from '../features/addons/addonsSlice';
import Loader from '../components/common/Loader';
import ErrorState from '../components/common/ErrorState';

// Helpers
const toYMD = (d) => dayjs(d).format('YYYY-MM-DD');
const todayYMD = () => dayjs().format('YYYY-MM-DD');
const getAttrId = (a) => a?.id ?? a?._id ?? a?.attraction_id ?? null;
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
const getComboId = (c) => c?.id ?? c?._id ?? c?.combo_id ?? null;
const getComboLabel = (combo, fallbackId = null) => {
  if (!combo) return fallbackId ? `Combo ${fallbackId}` : 'Combo';
  const direct =
    combo.name ??
    combo.title ??
    combo.combo_name ??
    combo.label ??
    combo.slug ??
    combo.code ??
    null;
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
// Normalize mobile for PayPhi (prefer 10-digit local number)
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

export default function Booking() {
  const dispatch = useDispatch();
  const auth = useSelector((s) => s.auth);
  const hasToken = !!auth?.token;

  const attractionsState = useSelector((s) => s.attractions);
  const combosState = useSelector((s) => s.combos);
  const addonsState = useSelector((s) => s.addons);
  const { cart, step, contact, otp, coupon, creating, payphi } = useSelector((s) => s.bookings);

  const [sel, setSel] = React.useState({
    itemType: 'attraction',
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

  // Auto-skip Step 2 if logged in
  React.useEffect(() => {
    if (step === 2 && hasToken) dispatch(setStep(3));
  }, [step, hasToken, dispatch]);

  // Preselect attraction if present in query
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

  // Add to cart
  const handleAdd = () => {
    if (!sel.date || !sel.slotKey || !sel.qty) return;
    const qty = Math.max(1, Number(sel.qty) || 1);
    if (sel.itemType === 'combo') {
      if (!selectedCombo || !selectedSlot) return;
      const slotIdToSend = selectedSlot?.combo_slot_id ?? selectedSlot?.id ?? selectedSlot?._id;
      const unitPrice = selectedSlot?.price != null
        ? Number(selectedSlot.price)
        : Number(selectedCombo?.combo_price || selectedCombo?.price || 0);
      dispatch(addCartItem({
        itemType: 'combo',
        comboId: getComboId(selectedCombo),
        combo: selectedCombo,
        date: sel.date,
        comboSlotId: slotIdToSend,
        slot: selectedSlot,
        qty,
        unitPrice,
      }));
    } else {
      if (!selectedAttraction || !selectedSlot) return;
      const slotIdToSend = selectedSlot?.slot_id ?? selectedSlot?.id ?? selectedSlot?._id;
      const unitPrice = (selectedSlot?.price != null ? selectedSlot.price : (selectedAttraction?.price || selectedAttraction?.base_price || selectedAttraction?.amount || 0));
      dispatch(addCartItem({
        itemType: 'attraction',
        attractionId: getAttrId(selectedAttraction),
        attraction: selectedAttraction,
        date: sel.date,
        slotId: slotIdToSend,
        slot: selectedSlot,
        qty,
        unitPrice,
      }));
    }
  };

  // Totals
  const subtotalTickets = cart.reduce((sum, it) => sum + (Number(it.unitPrice || 0) * Number(it.qty || 1)), 0);
  const subtotalAddons = cart.reduce((sum, it) => {
    const add = (it.addons || []).reduce((s, a) => s + (getAddonPrice(a) * Number(a.quantity || 0)), 0);
    return sum + add;
  }, 0);
  const grossTotal = subtotalTickets + subtotalAddons;
  const discount = Number(coupon.discount || 0);
  const finalTotal = Math.max(0, grossTotal - discount);

  // OTP (updated flow)
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

  // Promo
  const applyPromo = async () => {
    if (!promoInput) return;
    await dispatch(applyCoupon({ code: promoInput, total_amount: grossTotal, onDate: cart[0]?.date || toYMD(new Date()) }))
      .unwrap()
      .then(() => dispatch(setCouponCode(promoInput)))
      .catch(() => {});
  };

  // Checkout
  const onCheckoutAndPay = async () => {
    if (!hasToken) {
      alert('Please verify OTP to proceed.');
      return;
    }
    if (!cart.length) return;
    if (finalTotal <= 0) { alert('Total must be greater than zero. Remove promo or review items.'); return; }

    try {
      try {
        const current = await api.get(endpoints.cart.me());
        const arr = Array.isArray(current?.items) ? current.items : (Array.isArray(current) ? current : []);
        for (const ci of arr) {
          const cid = ci?.cart_item_id ?? ci?.id ?? ci?.item_id ?? null;
          if (cid != null) {
            try { await api.delete(endpoints.cart.itemById(cid)); } catch {}
          }
        }
      } catch {}
      // Push items to server cart
      // Note: server keeps an open cart per user; items will be appended
      for (const it of cart) {
        const basePayload = {
          item_type: it.itemType,
          booking_date: toYMD(it.date),
          quantity: it.qty,
          addons: (it.addons || []).map(a => ({ addon_id: a.addon_id, quantity: a.quantity })),
          meta: { from: 'web' },
        };

        if (it.itemType === 'combo') {
          await api.post(endpoints.cart.items(), {
            ...basePayload,
            combo_id: it.comboId,
            combo_slot_id: it.comboSlotId || null,
          });
        } else {
          await api.post(endpoints.cart.items(), {
            ...basePayload,
            attraction_id: it.attractionId,
            slot_id: it.slotId || null,
          });
        }
      }

      // Read server-computed cart total to avoid amount mismatches
      let serverTotal = Number(finalTotal || 0);
      try {
        const srv = await api.get(endpoints.cart.me());
        const candidates = [
          srv?.final_total, srv?.finalAmount, srv?.final_amount,
          srv?.total, srv?.total_amount, srv?.grand_total, srv?.amount
        ];
        for (const v of candidates) {
          const n = Number(v);
          if (Number.isFinite(n) && n >= 0) { serverTotal = n; break; }
        }
      } catch {}
      if (serverTotal <= 0) { alert('Server cart total is zero. Please review items or remove promo.'); return; }

      const email = (contact.email || auth?.user?.email || '').trim();
      const mobileRaw = (contact.phone || auth?.user?.phone || '');
      const mobile = normalizePayphiMobile(mobileRaw);
      if (!email || !mobile || mobile.length < 10) { alert('Enter a valid email and 10-digit mobile to continue.'); return; }

      const attemptInitiate = async ({ useAmount = true, customMobile = null } = {}) => {
        const body = {
          email,
          mobile: customMobile || mobile,
          name: (contact.name || auth?.user?.name || auth?.user?.full_name || '').trim() || undefined,
          coupon_code: (coupon?.code || '').trim() || undefined
        };
        if (useAmount) {
          body.amount = Number(serverTotal || 0);
          body.currency = 'INR';
        }
        const r = await api.post(endpoints.cart.payphi.initiate(), body);
        const resp = (r && typeof r === 'object' && r.response) || r?.raw || {};
        const rc = r?.responseCode ?? resp?.responseCode ?? r?.respCode ?? resp?.respCode ?? r?.code ?? resp?.code ?? null;
        const code = rc ? String(rc).toUpperCase() : null;
        const tx = r?.tranCtx ?? r?.tranctx ?? resp?.tranCtx ?? resp?.tranctx ?? null;
        let url = r?.redirectUrl ?? r?.redirectURL ?? r?.redirectUri ?? resp?.redirectUrl ?? resp?.redirectURL ?? resp?.redirectUri ?? resp?.redirectURI ?? null;
        if (url && tx && !url.includes('tranCtx=')) {
          const sep = url.includes('?') ? '&' : '?';
          url = `${url}${sep}tranCtx=${encodeURIComponent(tx)}`;
        }
        return { ok: !!url && (code ? code === 'R1000' : true), url, code, raw: r };
      };

      let result = await attemptInitiate({ useAmount: true });
      if (!result.ok && result.code === 'P1006') {
        // Retry without amount in case server computes amount internally
        result = await attemptInitiate({ useAmount: false });
      }
      if (!result.ok && result.code === 'P1006') {
        // Retry with country code prefix
        result = await attemptInitiate({ useAmount: false, customMobile: `91${mobile}` });
      }

      if (result.ok && result.url) {
        window.location.href = result.url;
        return;
      }
      if (import.meta.env?.DEV) {
        // eslint-disable-next-line no-console
        console.debug('PayPhi initiate failed', result);
      }
      showPayphiError('Payment initiation failed', result?.raw || {});
    } catch (err) {
      showPayphiError('Payment initiation failed', err);
    }
  };

  // UI pieces
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

  const ItemTypeTabs = () => (
    <div className="inline-flex rounded-full border overflow-hidden">
      {['attraction', 'combo'].map((type) => (
        <button
          key={type}
          type="button"
          onClick={() => setSel((s) => ({ ...s, itemType: type, attractionId: '', comboId: '', slotKey: '' }))}
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
      onChange={(e) => setSel((s) => ({ ...s, attractionId: e.target.value, slotKey: '' }))}
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
      onChange={(e) => setSel((s) => ({ ...s, date: e.target.value, slotKey: '' }))}
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

  const CartTable = () => (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="py-2 pr-4">Item</th>
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Slot</th>
            <th className="py-2 pr-4">Qty</th>
            <th className="py-2 pr-4">Price</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {cart.map((it, idx) => (
            <tr key={`cart-${it.id || idx}`} className="border-t">
              <td className="py-2 pr-4">
                <div className="flex flex-col">
                  <span className="font-medium">
                    {it.itemType === 'combo'
                      ? getComboLabel(it.combo || selectedCombo, it.comboId)
                      : (it.attraction?.name || it.attraction?.title || `#${it.attractionId}`)}
                  </span>
                  <span className="text-xs text-gray-500 uppercase">{it.itemType}</span>
                  {(it.addons || []).length ? (
                    <ul className="mt-2 space-y-1 text-xs text-gray-600">
                      {it.addons.map((addon, i) => {
                        const price = getAddonPrice(addon);
                        const qty = Number(addon.quantity || 0);
                        if (!qty) return null;
                        return (
                          <li key={`cart-addon-${addon.addon_id || i}`}>
                            + {addon.name || getAddonName(addon)} × {qty} — ₹{price * qty}
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              </td>
              <td className="py-2 pr-4">{toYMD(it.date)}</td>
              <td className="py-2 pr-4">
                {it.slot?.label || it.slot?.name || `${it.slot?.start_time || ''}${it.slot?.end_time ? ' - ' + it.slot.end_time : ''}`}
              </td>
              <td className="py-2 pr-4">{it.qty}</td>
              <td className="py-2 pr-4">₹{Number(it.unitPrice || 0) * Number(it.qty || 1)}</td>
              <td className="py-2 pr-4">
                <button className="text-red-600 hover:underline" onClick={() => dispatch(removeCartItem(it.id))}>Remove</button>
              </td>
            </tr>
          ))}
          {!cart.length && (
            <tr><td className="py-4 text-gray-500" colSpan={6}>No items added yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const AddonsPicker = () => {
    if (!cart.length) return <div className="text-sm text-gray-600">Add an attraction in Step 1 to choose add-ons.</div>;
    const addons = addonsState.items || [];
    return (
      <div className="space-y-6">
        {cart.map((it, idx) => {
          // clone stored addons to avoid mutating frozen redux objects
          const selectedMap = new Map((it.addons || []).map((a) => [String(a.addon_id), { ...a }]));
          const onQtyChange = (addon, delta, meta) => {
            const { addonId, maxQty, name, price, image, description } = meta;
            if (!addonId) return;
            const key = String(addonId);
            const existing = selectedMap.get(key);
            const base = existing
              ? { ...existing }
              : { addon_id: addonId, quantity: 0, price, name, image, description, max_quantity: maxQty };
            const nextQty = clampQty(Number(base.quantity || 0) + delta, 0, maxQty);
            if (nextQty <= 0) {
              selectedMap.delete(key);
            } else {
              selectedMap.set(key, {
                ...base,
                quantity: nextQty,
                price,
                name,
                image,
                description,
                max_quantity: maxQty
              });
            }
            const next = Array.from(selectedMap.values())
              .filter((a) => Number(a.quantity) > 0)
              .map((a) => ({ ...a }));
            dispatch(setItemAddons({ id: it.id, addons: next }));
          };

          return (
            <div key={`addons-item-${it.id || idx}`} className="rounded-xl border p-4">
              <div className="font-medium mb-3">
                {it.itemType === 'combo'
                  ? getComboLabel(it.combo || selectedCombo, it.comboId)
                  : (it.attraction?.name || it.attraction?.title || `#${it.attractionId}`)}
              </div>
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
                  const selA = selectedMap.get(key);
                  const q = Number(selA?.quantity || 0);
                  const meta = { addonId, maxQty, name, price, image, description };
                  const total = price * q;
                  return (
                    <div key={`addon-${addonId ?? i}`} className="flex flex-col gap-3 rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="h-16 w-16 rounded-lg object-cover"
                            loading="lazy"
                            decoding="async"
                          />
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
                          <button
                            type="button"
                            className="px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => onQtyChange(a, -1, meta)}
                            disabled={q <= 0}
                            aria-label={`Decrease ${name}`}
                          >
                            -
                          </button>
                          <div className="w-10 text-center text-sm">{q}</div>
                          <button
                            type="button"
                            className="px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
                            onClick={() => onQtyChange(a, +1, meta)}
                            disabled={q >= maxQty}
                            aria-label={`Increase ${name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Book Tickets</h1>
      <p className="text-gray-600 mb-6">Add attractions, verify (if needed), choose add-ons, apply promo, and checkout.</p>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8">
        {[1,2,3,4].map(n => (
          <React.Fragment key={n}>
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= n ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>{n}</div>
            {n < 4 ? <div className={`flex-1 h-[2px] ${step > n ? 'bg-blue-600' : 'bg-gray-200'}`} /> : null}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Cart */}
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
                          onChange={(e) => setSel((s) => ({ ...s, comboId: e.target.value, slotKey: '' }))}
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
                {selectedMeta.title && <div className="font-medium">{selectedMeta.title}</div>}
                <div>Unit price: <span className="font-medium">₹{selectedMeta.price}</span></div>
              </div>
            ) : null}
            <button
              className="ml-auto inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              onClick={handleAdd}
              disabled={!selectedMeta.title || !sel.date || !sel.slotKey || !sel.qty}
            >
              Add to cart
            </button>
          </div>

          <div className="rounded-xl border p-4">
            <CartTable />
            <div className="mt-4 flex items-center justify-between">
              <button className="text-sm text-gray-600 hover:underline" onClick={() => dispatch(clearCart())}>Clear all</button>
              <div className="text-right">
                <div className="text-sm text-gray-600">Subtotal</div>
                <div className="text-xl font-semibold">₹{subtotalTickets}</div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              disabled={!cart.length}
              onClick={() => dispatch(setStep(2))}
            >
              Next
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

      {/* Step 4: Promo + Checkout */}
      {step === 4 && (
        <section>
          <div className="rounded-xl border p-4 mb-6">
            <h3 className="font-semibold mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              {cart.map((it, idx) => (
                <div key={`sum-${it.id || idx}`} className="flex flex-col md:flex-row md:items-center md:justify-between gap-1">
                  <div className="text-gray-700">
                    {(it.itemType === 'combo'
                      ? getComboLabel(it.combo || selectedCombo, it.comboId)
                      : (it.attraction?.name || it.attraction?.title || `Attraction #${it.attractionId}`))} — {toYMD(it.date)} — {it.qty} ticket(s)
                  </div>
                  <div className="font-medium">₹{Number(it.unitPrice || 0) * Number(it.qty || 1)}</div>
                </div>
              ))}
              {cart.some((it) => (it.addons || []).length) && (
                <div className="mt-2 text-sm text-gray-700">
                  Add-ons total: ₹{subtotalAddons}
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
          </div>

          <div className="mb-6">
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

          <div className="flex items-center justify-between">
            <button className="text-sm text-gray-700 hover:underline" onClick={() => dispatch(setStep(3))}>← Back</button>
            <button className="inline-flex items-center rounded-full bg-blue-600 px-6 py-2 text-white text-sm hover:bg-blue-700 disabled:opacity-50" onClick={onCheckoutAndPay} disabled={creating.status === 'loading' || payphi.status === 'loading' || !cart.length || (!hasToken)}>
              {(creating.status === 'loading' || payphi.status === 'loading') ? 'Processing…' : 'Place order & Pay'}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}