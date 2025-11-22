import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import { imgSrc } from '../utils/media';
import { getPrice, getBasePrice } from '../utils/pricing';
import { 
  X, Calendar, Clock, ShoppingBag, Check, ChevronRight, Ticket, 
  User, Mail, Phone, ArrowRight, Plus, Minus, Trash2, Edit2, UserPlus, Globe, AlertCircle 
} from 'lucide-react';

import {
  setStep, setContact, setCouponCode,
  sendAuthOtp, verifyAuthOtp, applyCoupon,
  createBooking, initiatePayPhi,
  addCartItem, removeCartItem, resetCart,
  setActiveCartItem, updateCartItemQuantity
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
  String(s?.id ?? s?._id ?? s?.slot_id ?? s?.combo_slot_id ?? `${s?.start_time || ''}-${s?.end_time || ''}-${idx}`);

const getSlotLabel = (s) =>
  s?.label || (s?.start_time && s?.end_time ? `${s.start_time} - ${s.end_time}` : `Slot #${s?.id || '?'}`);

const fmtPhone = (s) => (s || '').replace(/[^\d+]/g, '');

// Validation Constants
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COUNTRY_CODES = [
  { code: '+91', label: 'IN (+91)' },
  { code: '+1', label: 'US (+1)' },
  { code: '+971', label: 'AE (+971)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+65', label: 'SG (+65)' },
];

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

function useMediaQuery(query) {
  const getMatch = () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false);
  const [matches, setMatches] = useState(getMatch);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(query);
    const handler = (event) => setMatches(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
const clampQty = (qty, min = 0, max = 10) => Math.min(Math.max(qty, min), max);

const createDefaultSelection = () => ({
  itemType: 'attraction',
  attractionId: '',
  comboId: '',
  date: todayYMD(),
  slotKey: '',
  qty: 1,
});

const makeLocalCartKey = () => `sel_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const getComboLabel = (combo, fallbackId = null) => {
  if (!combo) return fallbackId ? `Combo ${fallbackId}` : 'Combo';
  const direct = combo.name ?? combo.title ?? combo.combo_name ?? combo.label ?? null;
  if (direct) return direct;
  return fallbackId ? `Combo ${fallbackId}` : 'Combo';
};

// Image Helpers for Combo Split View
const resolveImageSource = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return imgSrc(value);
  if (typeof value === 'object') {
    // Handle object structure if image is { url: '...' }
    const nested = value.url || value.src || value.image_url || value.path;
    if (nested) return imgSrc(nested);
  }
  return null;
};

const getAttractionImage = (item) => {
  if (!item) return null;
  // Priority list
  const candidates = [
    item.hero_image, 
    item.banner_image, 
    item.image_url, 
    item.cover_image, 
    item.thumbnail, 
    item.media?.[0]
  ];
  for (const candidate of candidates) {
    const src = resolveImageSource(candidate);
    if (src) return src;
  }
  return null;
};

const getComboPrimaryImage = (combo) => {
  if (!combo) return null;
  const candidates = [
    combo.hero_image,
    combo.banner_image, 
    combo.image_url, 
    combo.cover_image,
    combo.media?.[0],
    combo.attraction_1_image, // Fallback to child images
    combo.attraction_2_image
  ];
  for (const candidate of candidates) {
    const src = resolveImageSource(candidate);
    if (src) return src;
  }
  return null;
};

const getComboPreviewImages = (combo) => {
  // Returns array of [img1, img2] for split view
  if (!combo) return [];
  const images = [];
  
  // Try explicit child images first (if your API returns them flattened)
  if (combo.attraction_1_image) images.push(resolveImageSource(combo.attraction_1_image));
  if (combo.attraction_2_image) images.push(resolveImageSource(combo.attraction_2_image));
  
  // If missing, try to parse from media array
  if (images.length < 2 && Array.isArray(combo.media)) {
      combo.media.forEach(m => {
          const src = resolveImageSource(m);
          if (src && !images.includes(src)) images.push(src);
      });
  }
  
  return images.slice(0, 2).filter(Boolean);
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
  return cap > 0;
};

const getOfferId = (offer) => offer?.id ?? offer?.offer_id ?? offer?.offerId ?? offer?.slug ?? null;
const getOfferTitle = (offer) => offer?.title || offer?.name || `Offer ${getOfferId(offer) ?? ''}`.trim();
const getOfferSummary = (offer) => offer?.short_description || offer?.subtitle || offer?.description || '';

const computeOfferDiscount = (offer, totalAmount) => {
  if (!offer || !totalAmount) return 0;
  const discountType = String(offer.discount_type || offer.rule_discount_type || '').toLowerCase();
  const percentFromOffer = Number(
    offer.discount_percent ??
      offer.discountPercent ??
      (discountType === 'percent' ? offer.discount_value ?? offer.discountValue : 0)
  ) || 0;
  const flatValue = Number(offer.discount_value ?? offer.discountValue ?? offer.flat_discount ?? 0) || 0;

  let discount = 0;
  if ((discountType === 'percent' && percentFromOffer > 0) || percentFromOffer > 0) {
    discount = (totalAmount * percentFromOffer) / 100;
  } else {
    discount = flatValue;
  }

  const maxDiscount = Number(offer.max_discount ?? offer.maxDiscount ?? 0);
  if (maxDiscount > 0) discount = Math.min(discount, maxDiscount);

  return Math.max(0, Math.min(discount, totalAmount));
};

/* ================= Component ================= */
export default function Booking() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const auth = useSelector((s) => s.auth);
  const hasToken = !!auth?.token;

  const attractionsState = useSelector((s) => s.attractions);
  const combosState = useSelector((s) => s.combos);
  const addonsState = useSelector((s) => s.addons);
  const { step, contact, otp, coupon, creating, payphi, cart } = useSelector((s) => s.bookings);
  const cartItems = cart?.items || [];
  const hasCartItems = cartItems.length > 0;
  const activeKey = cart?.activeKey;
  
  const checkoutItem = React.useMemo(() => {
    if (!cartItems.length) return null;
    if (activeKey) {
      const found = cartItems.find((item) => item.key === activeKey);
      if (found) return found;
    }
    return cartItems[0];
  }, [cartItems, activeKey]);
  
  const activeItemKey = checkoutItem?.key || null;

  // UI State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [sel, setSel] = React.useState(() => createDefaultSelection());
  const [editingKey, setEditingKey] = React.useState(null);
  const [slots, setSlots] = React.useState({ status: 'idle', items: [], error: null });
  const [otpCode, setOtpCode] = React.useState('');
  const [promoInput, setPromoInput] = React.useState('');

  // Auth Form State (Local)
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [contactErrors, setContactErrors] = useState({}); // { email: '...', phone: '...' }

  // Calculate combined phone for Redux
  const combinedPhoneDigits = useMemo(() => {
      return `${countryCode}${phoneLocal}`.replace(/\D/g, '');
  }, [countryCode, phoneLocal]);

  // Sync Local Phone state from Redux (Initial Load)
  useEffect(() => {
      if (contact?.phone && !phoneLocal) {
          const digits = String(contact.phone).replace(/\D/g, '');
          // Simple heuristic: if starts with 91 and length > 10, split it
          if (digits.length > 10) {
              // Try to match known codes
              const known = COUNTRY_CODES.find(c => digits.startsWith(c.code.replace('+', '')));
              if (known) {
                  setCountryCode(known.code);
                  setPhoneLocal(digits.slice(known.code.length - 1)); // approx
              } else {
                  // Default fallback
                  setPhoneLocal(digits.slice(-10));
              }
          } else {
              setPhoneLocal(digits);
          }
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount to populate form

  // Offers
  const [offers, setOffers] = React.useState([]);
  const [offersStatus, setOffersStatus] = React.useState('idle');
  const [selectedOfferId, setSelectedOfferId] = React.useState('');

  useEffect(() => {
    if (offersStatus !== 'idle') return;
    let cancelled = false;
    const loadOffers = async () => {
      setOffersStatus('loading');
      try {
        const res = await api.get(endpoints.offers.list(), { params: { active: true, limit: 20 } });
        if (cancelled) return;
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setOffers(list);
        setOffersStatus('succeeded');
      } catch (err) {
        if (!cancelled) setOffersStatus('failed');
      }
    };
    loadOffers();
    return () => {
      cancelled = true;
    };
  }, [offersStatus]);

  const handleCloseBooking = React.useCallback(() => {
    setIsBookingOpen(false);
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (isDesktop) {
      setIsBookingOpen(true);
    }
  }, [isDesktop]);

  const [cartAddons, setCartAddons] = React.useState(new Map());

  const currentItemAddons = React.useMemo(() => {
    if (!activeItemKey) return new Map();
    return cartAddons.get(activeItemKey) || new Map();
  }, [cartAddons, activeItemKey]);

  const [search] = useSearchParams();
  const preselectAttrId = search.get('attraction_id');
  const preselectComboId = search.get('combo_id');

  // --- EFFECTS ---

  React.useEffect(() => {
    if (attractionsState.status === 'idle') dispatch(fetchAttractions({ active: true, limit: 100 }));
    if (combosState.status === 'idle') dispatch(fetchCombos({ active: true, limit: 100 }));
    if (addonsState.status === 'idle') dispatch(fetchAddons({ active: true, limit: 100 }));
  }, [dispatch, attractionsState.status, combosState.status, addonsState.status]);

  React.useEffect(() => {
    if (step === 2 && hasToken) {
        dispatch(setStep(3));
    }
  }, [step, hasToken, dispatch]);

  React.useEffect(() => {
    dispatch(resetCart());
  }, [dispatch]);

  // Open if params exist
  React.useEffect(() => {
    if (preselectAttrId || preselectComboId) {
      setIsBookingOpen(true);
    }
    if (preselectAttrId) {
      const exists = (attractionsState.items || []).some((a) => String(getAttrId(a)) === String(preselectAttrId));
      if (exists) setSel((s) => ({ ...s, itemType: 'attraction', attractionId: String(preselectAttrId), slotKey: '' }));
    }
    if (preselectComboId) {
      const existsC = (combosState.items || []).some((c) => String(getComboId(c)) === String(preselectComboId));
      if (existsC) setSel((s) => ({ ...s, itemType: 'combo', comboId: String(preselectComboId), slotKey: '' }));
    }
  }, [preselectAttrId, preselectComboId, attractionsState.items, combosState.items]);

  // Fetch Slots
  const fetchSlots = React.useCallback(async ({ itemType, attractionId, comboId, date }) => {
    if (!date) return;
    const key = itemType === 'combo' ? comboId : attractionId;
    if (!key) return;

    setSlots({ status: 'loading', items: [], error: null });
    try {
      if (itemType === 'combo') {
        const res = await api.get(endpoints.combos.slots(key), { params: { date: toYMD(date) } });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSlots({ status: 'succeeded', items: list, error: null });
      } else {
        const res = await api.get(endpoints.slots.list(), { params: { attraction_id: key, date: toYMD(date) } });
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setSlots({ status: 'succeeded', items: list, error: null });
      }
    } catch (err) {
      setSlots({ status: 'failed', items: [], error: err?.message || 'Failed to load slots' });
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
      setSlots({ status: 'idle', items: [], error: null });
    }
  }, [sel.itemType, sel.attractionId, sel.comboId, sel.date, fetchSlots]);

  // --- DERIVED DATA ---

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
  const selectedOffer = React.useMemo(() => {
    if (!selectedOfferId) return null;
    return offers.find((offer) => String(getOfferId(offer)) === String(selectedOfferId)) || null;
  }, [offers, selectedOfferId]);
  const selectedSlot = React.useMemo(() => {
    for (let i = 0; i < slots.items.length; i++) {
      const s = slots.items[i];
      if (getSlotKey(s, i) === sel.slotKey) return s;
    }
    return null;
  }, [slots.items, sel.slotKey]);

  const selectedMeta = React.useMemo(() => {
    if (sel.itemType === 'combo' && selectedCombo) {
      const fallbackPrice = getPrice(selectedCombo);
      const price = selectedSlot?.price != null
        ? Number(selectedSlot.price)
        : Number(fallbackPrice || selectedCombo?.combo_price || selectedCombo?.price || 0);
      return {
        title: getComboLabel(selectedCombo, getComboId(selectedCombo)),
        price,
        image: getComboPrimaryImage(selectedCombo), // Use helper
        previewImages: getComboPreviewImages(selectedCombo) // Use helper for split view
      };
    }
    if (sel.itemType === 'attraction' && selectedAttraction) {
      const price = selectedSlot?.price != null
        ? Number(selectedSlot.price)
        : Number(selectedAttraction?.price || selectedAttraction?.base_price || selectedAttraction?.amount || 0);
      return {
        title: selectedAttraction?.name || selectedAttraction?.title || `Attraction #${getAttrId(selectedAttraction)}`,
        price,
        image: getAttractionImage(selectedAttraction) // Use helper
      };
    }
    return { title: '', price: 0 };
  }, [sel.itemType, selectedCombo, selectedAttraction, selectedSlot]);

  const qty = Math.max(1, Number(sel.qty) || 1);
  const ticketsSubtotal = Number(selectedMeta.price || 0) * qty;
  const selectionReady = Boolean(selectedMeta.title && sel.date && sel.slotKey && qty);
  
  const cartTicketsTotal = React.useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (Number(item.unitPrice || 0) * Number(item.quantity || 0)), 0);
  }, [cartItems]);

  const totalAddonsCost = React.useMemo(() => {
    let total = 0;
    cartAddons.forEach((itemAddonsMap, itemKey) => {
        const itemExists = cartItems.find(i => i.key === itemKey);
        if(itemExists) {
            itemAddonsMap.forEach((addon) => {
                total += Number(addon.price || 0) * Number(addon.quantity || 0);
            });
        }
    });
    return total;
  }, [cartAddons, cartItems]);

  const grossTotal = cartTicketsTotal + totalAddonsCost;
  const offerDiscountAmount = React.useMemo(() => computeOfferDiscount(selectedOffer, grossTotal), [selectedOffer, grossTotal]);
  const subtotalAfterOffer = Math.max(0, grossTotal - offerDiscountAmount);
  const couponDiscount = Number(coupon.discount || 0);
  const couponApplied = couponDiscount > 0 && (coupon.code || coupon.data?.code);
  const finalTotal = Math.max(0, subtotalAfterOffer - couponDiscount);

  // --- ACTIONS ---

  const addSelectionToCart = useCallback(() => {
    if (!selectionReady) return false;

    const item_type = sel.itemType === 'combo' ? 'Combo' : 'Attraction';
    const slotId = sel.itemType === 'combo'
      ? (selectedSlot?.combo_slot_id ?? selectedSlot?.id ?? selectedSlot?._id ?? null)
      : (selectedSlot?.slot_id ?? selectedSlot?.id ?? selectedSlot?._id ?? null);
    
    const payload = {
      key: editingKey || makeLocalCartKey(),
      merge: false,
      item_type,
      title: selectedMeta.title,
      slotLabel: selectedSlot ? getSlotLabel(selectedSlot) : '',
      quantity: qty,
      booking_date: toYMD(sel.date),
      unitPrice: selectedMeta.price || 0,
      dateLabel: toYMD(sel.date),
      slot_id: item_type === 'Attraction' ? slotId : null,
      combo_slot_id: item_type === 'Combo' ? slotId : null,
      attraction_id: item_type === 'Attraction' ? getAttrId(selectedAttraction) : null,
      combo_id: item_type === 'Combo' ? getComboId(selectedCombo) : null,
      slot: selectedSlot || null,
      attraction: selectedAttraction || null,
      combo: selectedCombo || null,
    };

    if (editingKey) dispatch(removeCartItem(editingKey));
    dispatch(addCartItem(payload));
    dispatch(setActiveCartItem(payload.key));
    
    setEditingKey(null);
    setSel(createDefaultSelection());
    
    setCartAddons(prev => {
        const next = new Map(prev);
        if(!next.has(payload.key)) next.set(payload.key, new Map());
        return next;
    });
    return true;
  }, [selectionReady, sel, selectedMeta, selectedSlot, selectedAttraction, selectedCombo, qty, editingKey, dispatch]);

  const handleNext = () => {
    if (step === 1) {
      if (hasCartItems) {
        dispatch(setStep(hasToken ? 3 : 2));
      } else {
        if (!selectionReady) {
          alert("Please select a date, a time slot, and quantity to continue.");
          return;
        }
        const added = addSelectionToCart();
        if (added) {
          dispatch(setStep(hasToken ? 3 : 2));
        }
      }
    } else if (step === 2) {
      // We now allow sendOTP to handle navigation logic via success
      if (otp.verified) dispatch(setStep(3));
      else alert("Please verify OTP to continue.");
    } else if (step === 3) {
      dispatch(setStep(4));
    }
  };

  const onPlaceOrderAndPay = async () => {
    if (!hasToken) { alert('Please verify OTP to proceed.'); return; }
    if (!hasCartItems) return;

    try {
      const couponCode = (coupon?.code || '').trim() || undefined;
      const offerId = selectedOfferId ? Number(selectedOfferId) : undefined;

      const bookingPayloads = cartItems.map((item) => {
        const isCombo = item.item_type === 'Combo';
        const itemAddonsMap = cartAddons.get(item.key);
        const addonsPayload = itemAddonsMap 
            ? Array.from(itemAddonsMap.values())
                .filter((a) => Number(a.quantity) > 0)
                .map((a) => ({ addon_id: a.addon_id, quantity: Number(a.quantity) }))
            : [];

        return {
          item_type: isCombo ? 'Combo' : 'Attraction',
          combo_id: isCombo ? item.combo_id : undefined,
          combo_slot_id: isCombo ? item.combo_slot_id : undefined,
          attraction_id: !isCombo ? item.attraction_id : undefined,
          slot_id: !isCombo ? item.slot_id : undefined,
          booking_date: item.booking_date,
          quantity: item.quantity,
          addons: addonsPayload,
          coupon_code: couponCode,
          offer_id: offerId
        };
      });

      const created = await dispatch(createBooking(bookingPayloads)).unwrap();
      const orderId = created.order_id;
      if (!orderId) throw new Error('Order ID missing');

      // Use the validated contact info stored in Redux or State
      // Fallback to Auth user info if needed
      const email = (contact.email || auth?.user?.email || '').trim();
      // Use the constructed phone from state to ensure correct format
      const mobile = normalizePayphiMobile(contact.phone || auth?.user?.phone || '');
      
      const init = await dispatch(initiatePayPhi({ bookingId: orderId, email, mobile })).unwrap();
      if (init?.redirectUrl) {
        window.location.assign(init.redirectUrl);
      } else {
        alert('Payment initiation failed.');
      }
    } catch (err) {
      alert(`Payment failed: ${err.message}`);
    }
  };

  const onRemoveCartItem = (key) => {
    dispatch(removeCartItem(key));
    setCartAddons(prev => {
        const next = new Map(prev);
        next.delete(key);
        return next;
    });
    if (editingKey === key) {
        setEditingKey(null);
        setSel(createDefaultSelection());
    }
  };

  const onEditCartItem = (item) => {
    const itemType = item.item_type === 'Combo' ? 'combo' : 'attraction';
    setSel({
      itemType,
      attractionId: item.attraction_id ? String(item.attraction_id) : '',
      comboId: item.combo_id ? String(item.combo_id) : '',
      date: item.booking_date || todayYMD(),
      slotKey: '',
      qty: Number(item.quantity || 1),
    });
    setEditingKey(item.key);
    dispatch(setActiveCartItem(item.key));
    dispatch(setStep(1));
  };

  // --- AUTH HANDLERS ---

  const handlePhoneChange = (e) => {
    const raw = e.target.value;
    // Only allow numbers
    const digits = raw.replace(/\D/g, '').slice(0, 10); 
    setPhoneLocal(digits);
    
    // Clear phone error if length is 10
    if (digits.length === 10) {
        setContactErrors(prev => ({ ...prev, phone: undefined }));
        // Update Redux immediately so state is consistent
        dispatch(setContact({ phone: `${countryCode}${digits}` }));
    }
  };

  const sendOTP = async () => {
    // 1. Validation
    const errors = {};
    const email = (contact.email || '').trim();
    if (!EMAIL_REGEX.test(email)) {
        errors.email = 'Please enter a valid email address';
    }
    if (phoneLocal.length !== 10) {
        errors.phone = 'Phone number must be exactly 10 digits';
    }

    if (Object.keys(errors).length > 0) {
        setContactErrors(errors);
        return; // Stop
    }

    // Clear errors
    setContactErrors({});

    // 2. Format Phone
    const fullPhone = `${countryCode}${phoneLocal}`;
    
    // 3. Dispatch (Store in Redux first)
    dispatch(setContact({ email, phone: fullPhone }));

    try {
        await dispatch(sendAuthOtp({ email, phone: fullPhone })).unwrap();
        // Success logic handled by UI observing 'otp.sent'
    } catch (e) {
        alert(e?.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) return alert('Enter the full OTP code');
    await dispatch(verifyAuthOtp({ otp: otpCode }))
      .unwrap()
      .then(() => {
          // Auto-advance on success
          dispatch(setStep(3));
      })
      .catch((e) => alert(e?.message || 'OTP verification failed'));
  };

  const applyPromo = async () => {
    if (!promoInput) return;
    await dispatch(applyCoupon({
      code: promoInput,
      total_amount: Math.max(0, grossTotal - offerDiscountAmount),
      onDate: sel.date || toYMD(new Date())
    }))
      .unwrap()
      .then(() => dispatch(setCouponCode(promoInput)))
      .catch(() => {});
  };

  /* --- UI COMPONENTS --- */

  const ProgressBar = () => (
    <div className="flex items-center justify-between mb-6 px-4">
      {[
        { n: 1, l: 'Select' },
        { n: 2, l: 'Verify' },
        { n: 3, l: 'Extras' },
        { n: 4, l: 'Pay' }
      ].map((s) => {
        if(hasToken && s.n === 2) return null; // Skip
        const isCompleted = step > s.n || (hasToken && s.n === 2);
        const isCurrent = step === s.n;
        const showCheck = isCompleted || (hasToken && s.n === 2);

        return (
          <div key={s.n} className="flex flex-col items-center relative z-10 group">
            <div 
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                isCurrent ? 'bg-white border-blue-600 text-blue-600 scale-110 ring-2 ring-blue-100' :
                showCheck ? 'bg-blue-600 border-blue-600 text-white' : 
                'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {showCheck && !isCurrent ? <Check size={16} strokeWidth={3} /> : s.n}
            </div>
            <span className={`text-[10px] mt-1.5 font-medium uppercase tracking-wide ${isCurrent ? 'text-blue-600' : showCheck ? 'text-gray-800' : 'text-gray-300'}`}>
              {s.l}
            </span>
          </div>
        )
      })}
      <div className="absolute left-8 right-8 top-[26px] h-[2px] bg-gray-100 -z-0 overflow-hidden rounded-full">
        <div className="h-full bg-blue-600 transition-all duration-500 ease-out" style={{ width: `${((step-1)/(hasToken?2:3))*100}%` }}></div>
      </div>
    </div>
  );

  const SelectionCarousel = () => {
    const activeTab = sel.itemType;
    const data = activeTab === 'attraction' ? attractions : combos;
    
    return (
      <div className="mb-8">
        {/* Type Toggle */}
        <div className="flex justify-center mb-6">
          <div className="bg-gray-100/80 p-1 rounded-xl inline-flex border border-gray-200">
            {['attraction', 'combo'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setSel(prev => ({ ...prev, itemType: t, attractionId: '', comboId: '', slotKey: '' }));
                }}
                className={`px-6 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                  sel.itemType === t 
                    ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>

        {/* Hero Selection Card (Current Selection) */}
        {selectedMeta.title && (
          <div className="max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-white shadow-sm border border-white flex-shrink-0 relative z-10">
                {/* Display Split Image for Combos */}
                {activeTab === 'combo' && selectedMeta.previewImages?.length >= 2 ? (
                    <div className="w-full h-full flex relative">
                        <img src={selectedMeta.previewImages[0]} className="w-1/2 h-full object-cover" alt="" />
                        <img src={selectedMeta.previewImages[1]} className="w-1/2 h-full object-cover" alt="" />
                        {/* Divider line */}
                        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-white/50"></div>
                    </div>
                ) : selectedMeta.image ? (
                    <img src={selectedMeta.image} alt="" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag /></div>
                )}
              </div>

              <div className="flex-1 min-w-0 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">Selected</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 truncate">{selectedMeta.title}</h3>
                <p className="text-sm text-blue-600 font-medium mt-0.5">₹{selectedMeta.price} <span className="text-gray-400 text-xs font-normal">per person</span></p>
              </div>
              
              <div className="relative z-10 hidden sm:block">
                 <Check className="text-blue-600 opacity-20" size={40} />
              </div>
            </div>
          </div>
        )}

        {/* Horizontal Scroll Cards */}
        <div className="flex gap-4 overflow-x-auto snap-x pb-6 px-1 no-scrollbar -mx-2 md:mx-0 scroll-smooth">
          {data.map(item => {
            const id = activeTab === 'attraction' ? getAttrId(item) : getComboId(item);
            const isSelected = String(activeTab === 'attraction' ? sel.attractionId : sel.comboId) === String(id);
            const comboPrice = activeTab === 'combo' ? Number(getPrice(item) || item.combo_price || item.price || 0) : 0;
            const baseComboPrice = activeTab === 'combo' ? Number(getBasePrice(item) || item.original_price || item.base_price || 0) : 0;
            const price = activeTab === 'combo'
              ? (comboPrice || baseComboPrice || 0)
              : Number(item.price || item.base_price || item.amount || 0);
            const showComboDiscount = activeTab === 'combo' && baseComboPrice > price;
            const comboDiscountPercent = showComboDiscount
              ? Math.max(0, Math.round(((baseComboPrice - price) / baseComboPrice) * 100))
              : 0;
            const title = activeTab === 'attraction' ? (item.title || item.name) : getComboLabel(item);
            
            // Image Logic for Card
            let CardImage = null;
            if (activeTab === 'combo') {
                const previews = getComboPreviewImages(item);
                if (previews.length >= 2) {
                    // Split View
                    CardImage = (
                        <div className="w-full h-full flex relative">
                            <img src={previews[0]} className="w-1/2 h-full object-cover transition-transform group-hover:scale-110 duration-700" alt="" />
                            <img src={previews[1]} className="w-1/2 h-full object-cover transition-transform group-hover:scale-110 duration-700 delay-75" alt="" />
                            <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.2)]"></div>
                        </div>
                    );
                } else {
                    const single = getComboPrimaryImage(item);
                    CardImage = single ? <img src={single} className="w-full h-full object-cover" alt="" /> : null;
                }
            } else {
                const src = getAttractionImage(item);
                CardImage = src ? <img src={src} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" alt="" /> : null;
            }

            return (
              <div 
                key={id}
                onClick={() => setSel(prev => ({
                  ...prev, 
                  [activeTab === 'attraction' ? 'attractionId' : 'comboId']: String(id),
                  slotKey: '' 
                }))}
                className={`snap-center flex-shrink-0 w-64 rounded-2xl cursor-pointer transition-all duration-200 group overflow-hidden bg-white shadow-sm hover:shadow-lg border-2 relative ${
                  isSelected ? 'border-blue-600 ring-4 ring-blue-50 translate-y-[-2px]' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="h-40 bg-gray-100 relative overflow-hidden">
                  {CardImage || <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32} /></div>}
                  
                  {/* Selection Overlay */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-blue-900/20 backdrop-blur-[1px] flex items-center justify-center animate-in fade-in duration-200">
                      <div className="bg-white text-blue-600 p-2 rounded-full shadow-xl transform scale-110">
                        <Check size={20} strokeWidth={3} />
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12 space-y-1">
                    <div className="flex items-baseline gap-2 text-white">
                      <p className="font-bold text-lg drop-shadow-sm">₹{price}</p>
                      {showComboDiscount && (
                        <span className="text-sm text-white/80 line-through">₹{baseComboPrice}</span>
                      )}
                    </div>
                    {comboDiscountPercent > 0 && (
                      <span className="inline-flex items-center text-[11px] font-semibold text-emerald-200">
                        Save {comboDiscountPercent}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-gray-800 line-clamp-1 mb-1" title={title}>{title}</h4>
                  <p className="text-xs text-gray-500 line-clamp-1">
                    {activeTab === 'combo' ? 'Multiple experiences' : 'Single attraction entry'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* --- MAIN RENDER --- */
  const OfferSelector = () => {
    if (offersStatus === 'loading') {
      return (
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm text-sm text-gray-500">
          Loading offers...
        </div>
      );
    }
    if (!offers.length) return null;

    return (
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-800">Available Offers</h4>
          {selectedOfferId && (
            <button
              type="button"
              onClick={() => setSelectedOfferId('')}
              className="text-xs font-medium text-blue-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        <div className="space-y-3">
          {offers.map((offer) => {
            const id = String(getOfferId(offer));
            if (!id) return null;
            const isActive = String(selectedOfferId) === id;
            const potential = computeOfferDiscount(offer, grossTotal);
            const preview = offer.discount_percent ?? offer.discountPercent
              ? `${offer.discount_percent ?? offer.discountPercent}% off`
              : offer.discount_value ?? offer.discountValue
              ? `Save ₹${offer.discount_value ?? offer.discountValue}`
              : 'Special savings';
            return (
              <label
                key={id}
                className={`flex gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  isActive ? 'border-blue-500 bg-blue-50/40 shadow-sm' : 'border-gray-200 hover:border-blue-200'
                }`}
              >
                <input
                  type="radio"
                  name="selected-offer"
                  className="mt-1"
                  checked={isActive}
                  onChange={() => setSelectedOfferId(id)}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{getOfferTitle(offer)}</p>
                      {getOfferSummary(offer) ? (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{getOfferSummary(offer)}</p>
                      ) : null}
                    </div>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{preview}</span>
                  </div>
                  {potential > 0 && (
                    <p className="text-xs text-green-600 mt-1">Save up to ₹{potential.toFixed(0)} with this offer</p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {!isDesktop && (
        <>
          <div className="fixed bottom-6 right-6 z-40 md:hidden">
            {!isBookingOpen && (
              <button 
                onClick={() => setIsBookingOpen(true)}
                className="bg-gray-900 text-white p-4 rounded-full shadow-2xl flex items-center gap-2 animate-bounce-slow hover:scale-105 transition-transform border-2 border-white/20"
              >
                <Ticket size={24} />
                <span className="font-bold">Book Now</span>
              </button>
            )}
          </div>

          {isBookingOpen && (
            <div 
              className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-40 transition-opacity duration-300"
              onClick={() => {
                  if(window.confirm("Are you sure you want to close? Your progress may be lost.")) {
                      handleCloseBooking();
                  }
              }}
            />
          )}
        </>
      )}

      {/* --- Main Booking Container --- */}
      <div 
        className={`${
          isDesktop
            ? 'relative z-50 bg-white shadow-2xl rounded-3xl border border-gray-100 max-w-6xl mx-auto my-10 flex flex-col min-h-[80vh]'
            : `fixed z-50 bg-white transition-all duration-300 ease-in-out shadow-2xl bottom-0 left-0 right-0 rounded-t-[32px] max-h-[95vh] flex flex-col ${isBookingOpen ? 'translate-y-0' : 'translate-y-full'}`
        }`}
      >
        
        {/* Header */}
        <div className={`${isDesktop ? 'px-8 pt-8 pb-4 border-b border-gray-100 rounded-t-3xl bg-white' : 'sticky top-0 bg-white z-20 px-6 pt-6 pb-2 border-b border-gray-100 rounded-t-[32px]'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 1 ? 'Select Experience' : step === 2 ? 'Guest Details' : step === 3 ? 'Add Extras' : 'Checkout'}
            </h2>
            <button 
              onClick={handleCloseBooking}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <ProgressBar />
        </div>

        {/* Scrollable Body */}
        <div className={`${isDesktop ? 'flex-1 px-8 py-8 pb-16 overflow-visible' : 'flex-1 overflow-y-auto px-6 py-6 pb-32 custom-scrollbar'}`}>
          
          {/* STEP 1: SELECTION */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SelectionCarousel />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" /> Select Date
                  </label>
                  <input
                    type="date"
                    className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium cursor-pointer transition-all hover:border-gray-300"
                    min={todayYMD()}
                    value={sel.date}
                    onChange={(e) => setSel(s => ({ ...s, date: e.target.value, slotKey: '' }))}
                  />
                </div>

                {/* Slot */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={14} className="text-blue-500" /> Select Time
                  </label>
                  <div className="relative">
                    <select
                      className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 transition-all hover:border-gray-300"
                      value={sel.slotKey}
                      onChange={(e) => setSel(st => ({ ...st, slotKey: e.target.value }))}
                      disabled={!sel.attractionId && !sel.comboId}
                    >
                      <option value="">{(!sel.attractionId && !sel.comboId) ? 'Choose an activity above' : 'Select a time slot'}</option>
                      {slots.items.map((s, i) => {
                        const sid = getSlotKey(s, i);
                        return <option key={sid} value={sid} disabled={!slotHasCapacity(s)}>{getSlotLabel(s)} {!slotHasCapacity(s) ? '(Full)' : ''}</option>;
                      })}
                    </select>
                    <ChevronRight size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 rotate-90" />
                  </div>
                </div>
              </div>

              {/* Quantity & Add Row */}
              <div className="bg-white rounded-2xl p-5 border-2 border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">Tickets Required</label>
                  <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-1.5 border border-gray-200 w-fit">
                    <button onClick={() => setSel(s => ({...s, qty: Math.max(1, s.qty - 1)}))} className="w-10 h-10 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm hover:text-blue-600 active:scale-95 transition">
                      <Minus size={18} />
                    </button>
                    <span className="font-bold text-xl w-10 text-center text-gray-800">{sel.qty}</span>
                    <button onClick={() => setSel(s => ({...s, qty: Math.max(1, s.qty + 1)}))} className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-900 text-white shadow-md hover:bg-black active:scale-95 transition">
                      <Plus size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col md:items-end gap-2 flex-1">
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-medium uppercase">Total Price</div>
                    <div className="text-3xl font-black text-gray-900 tracking-tight">₹{ticketsSubtotal}</div>
                  </div>
                  <button
                    onClick={addSelectionToCart}
                    disabled={!selectionReady}
                    className="w-full md:w-auto px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {editingKey ? 'Update Selection' : 'Add to Order'}
                  </button>
                </div>
              </div>

              {/* Cart Preview */}
              {hasCartItems && (
                <div className="border-t pt-6 animate-fade-in">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">In Your Bag</h4>
                  <div className="space-y-3">
                    {cartItems.map(item => (
                      <div key={item.key} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-all group">
                        <div>
                          <div className="font-bold text-gray-800 text-base">{item.title}</div>
                          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{item.dateLabel}</span>
                            <span>{item.slotLabel}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="text-blue-600 font-semibold">{item.quantity} Tickets</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-gray-900 text-lg">₹{item.unitPrice * item.quantity}</span>
                          <div className="flex gap-1">
                            <button onClick={() => onEditCartItem(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={18}/></button>
                            <button onClick={() => onRemoveCartItem(item.key)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: AUTH (OTP) */}
          {step === 2 && !hasToken && (
            <div className="space-y-6 max-w-md mx-auto animate-in fade-in slide-in-from-right-8 duration-300">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Guest Details</h3>
                <p className="text-gray-500 text-sm mt-1">Enter your details to receive tickets via Email & SMS.</p>
              </div>

              <div className="space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Full Name</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            placeholder="John Doe" 
                            className="w-full pl-11 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all font-medium"
                            value={contact.name} 
                            onChange={(e) => dispatch(setContact({ name: e.target.value }))} 
                        />
                    </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Email Address</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                        <input 
                            placeholder="name@example.com" 
                            type="email"
                            className={`w-full pl-11 p-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:bg-white outline-none transition-all font-medium ${contactErrors.email ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`}
                            value={contact.email} 
                            onChange={(e) => {
                                dispatch(setContact({ email: e.target.value }));
                                if(contactErrors.email) setContactErrors(p => ({...p, email: undefined}));
                            }} 
                        />
                    </div>
                    {contactErrors.email && <p className="text-xs text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={12}/> {contactErrors.email}</p>}
                </div>

                {/* Phone Group */}
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Mobile Number</label>
                    <div className="flex gap-3">
                        {/* Country Code Dropdown */}
                        <div className="relative w-32">
                            <div className="absolute left-3 top-3.5 z-10 pointer-events-none">
                                <Globe size={18} className="text-gray-400" />
                            </div>
                            <select 
                                className="w-full pl-10 pr-8 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none appearance-none font-medium text-sm"
                                value={countryCode}
                                onChange={e => setCountryCode(e.target.value)}
                            >
                                {COUNTRY_CODES.map(c => (
                                    <option key={c.code} value={c.code}>{c.code}</option>
                                ))}
                            </select>
                            <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 rotate-90 pointer-events-none" />
                        </div>

                        {/* Phone Input */}
                        <div className="relative flex-1 group">
                            <Phone className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input 
                                placeholder="98765 43210" 
                                type="tel"
                                maxLength={10}
                                className={`w-full pl-11 p-3.5 bg-gray-50 border rounded-xl focus:ring-2 focus:bg-white outline-none transition-all font-medium tracking-wide ${contactErrors.phone ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-blue-500'}`}
                                value={phoneLocal} 
                                onChange={handlePhoneChange}
                            />
                        </div>
                    </div>
                    {contactErrors.phone && <p className="text-xs text-red-500 ml-1 flex items-center gap-1"><AlertCircle size={12}/> {contactErrors.phone}</p>}
                </div>

                {/* OTP Action */}
                {!otp.sent ? (
                    <button 
                        onClick={sendOTP}
                        disabled={otp.status === 'loading'}
                        className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-base shadow-lg hover:bg-black transition-all disabled:opacity-70 flex items-center justify-center gap-2 mt-4"
                    >
                        {otp.status === 'loading' ? <Loader className="w-5 h-5 animate-spin" /> : 'Send OTP Verification'}
                    </button>
                ) : (
                    <div className="mt-6 bg-blue-50 border border-blue-100 p-5 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm text-blue-800 mb-3 font-medium">Enter OTP sent to {countryCode} {phoneLocal}</p>
                        <div className="flex gap-3">
                            <input 
                                placeholder="XXXXXX" 
                                className="flex-1 p-3.5 text-center tracking-[0.5em] font-bold text-xl border-2 border-blue-200 rounded-xl focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none bg-white transition-all"
                                maxLength={6}
                                value={otpCode} 
                                onChange={(e) => setOtpCode(e.target.value)} 
                            />
                            <button 
                                onClick={verifyOTP}
                                className="bg-blue-600 text-white px-8 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-colors"
                            >
                                Verify
                            </button>
                        </div>
                        <button onClick={sendOTP} className="text-xs text-blue-600 font-medium mt-3 hover:underline">Resend Code</button>
                    </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: ADDONS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
              {cartItems.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {cartItems.map(item => (
                    <button 
                      key={item.key}
                      onClick={() => dispatch(setActiveCartItem(item.key))}
                      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${
                        activeItemKey === item.key ? 'bg-gray-900 text-white border-gray-900 shadow-md' : 'border-gray-200 text-gray-600 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                {addonsState.items.map(addon => {
                  const key = String(getAddonId(addon));
                  const currentQty = currentItemAddons.get(key)?.quantity || 0;
                  const price = getAddonPrice(addon);

                  const changeQty = (delta) => {
                    const nextQty = Math.max(0, currentQty + delta);
                    const nextMap = new Map(currentItemAddons);
                    if (nextQty === 0) nextMap.delete(key);
                    else nextMap.set(key, { 
                      addon_id: getAddonId(addon), 
                      quantity: nextQty, 
                      price, 
                      name: getAddonName(addon) 
                    });
                    setCartAddons(prev => new Map(prev).set(activeItemKey, nextMap));
                  };

                  return (
                    <div key={key} className={`flex items-center p-3 border rounded-2xl transition-all duration-200 ${currentQty > 0 ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-200' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
                      <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden relative">
                        {getAddonImage(addon) ? (
                          <img src={getAddonImage(addon)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={20}/></div>
                        )}
                      </div>
                      <div className="flex-1 px-4">
                        <div className="font-bold text-gray-800 text-sm">{getAddonName(addon)}</div>
                        <div className="text-gray-500 text-xs mt-0.5 font-medium">₹{price}</div>
                      </div>
                      <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
                        <button className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" onClick={() => changeQty(-1)} disabled={currentQty===0}>
                            <Minus size={16}/>
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{currentQty}</span>
                        <button className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" onClick={() => changeQty(1)}>
                            <Plus size={16}/>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: SUMMARY */}
          {step === 4 && (
            <div className="space-y-6 max-w-lg mx-auto animate-in fade-in slide-in-from-right-8 duration-300 pb-20">
              <OfferSelector />
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <ShoppingBag className="text-blue-600" size={20} />
                    Order Summary
                </h3>
                {couponApplied && (
                  <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-sm text-emerald-700">
                    <div className="font-semibold text-emerald-800">Coupon {String(coupon.code || coupon.data?.code).toUpperCase()} applied</div>
                    <div className="flex items-center justify-between mt-1 text-emerald-700">
                      <span>{coupon.data?.description || 'Discount applied successfully'}</span>
                      <span className="font-bold">-₹{couponDiscount.toFixed(0)}</span>
                    </div>
                  </div>
                )}
                
                {/* Order Items List (Compact) */}
                <div className="mb-4 space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                    {cartItems.map(item => (
                        <div key={item.key} className="flex justify-between text-sm py-2 border-b border-dashed border-gray-100 last:border-0">
                            <div className="text-gray-700">
                                <span className="font-bold text-gray-900">{item.quantity}x</span> {item.title}
                                <div className="text-xs text-gray-400">{item.dateLabel}</div>
                            </div>
                            <div className="font-medium text-gray-900">₹{item.unitPrice * item.quantity}</div>
                        </div>
                    ))}
                    {/* Addons Summary */}
                    {totalAddonsCost > 0 && (
                        <div className="flex justify-between text-sm py-2 border-t border-gray-100 pt-3">
                            <div className="text-gray-600 font-medium">Extras / Add-ons</div>
                            <div className="font-medium text-gray-900">₹{totalAddonsCost}</div>
                        </div>
                    )}
                </div>

                {/* Totals */}
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm mt-2">
                  <div className="flex justify-between text-gray-500"><span>Subtotal</span> <span>₹{grossTotal}</span></div>
                  {offerDiscountAmount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Offer Discount</span>
                      <span>-₹{offerDiscountAmount.toFixed(0)}</span>
                    </div>
                  )}
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Coupon ({String(coupon.code || coupon.data?.code).toUpperCase()})</span>
                      <span>-₹{couponDiscount.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center mt-2">
                    <span className="font-bold text-gray-800 text-lg">Total Payable</span> 
                    <span className="font-bold text-2xl text-blue-600">₹{finalTotal}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Ticket size={18} className="absolute left-3 top-3 text-gray-400" />
                  <input 
                    placeholder="Have a promo code?" 
                    className="w-full pl-10 p-3 border border-gray-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 outline-none font-bold tracking-wider"
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value)}
                  />
                </div>
                <button onClick={applyPromo} className="text-sm font-bold text-blue-600 px-5 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-100 transition-colors">
                    Apply
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Fixed Bottom Footer (Action Bar) */}
        <div className={`${isDesktop ? 'px-8 pb-8 border-t border-gray-100 rounded-b-3xl bg-white z-30' : 'absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'}`}>
          <div className={`flex gap-4 ${isDesktop ? '' : 'max-w-4xl mx-auto'}`}>
            <div className={`flex-1 ${isDesktop ? 'hidden' : ''}`}>
                <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total</div>
                <div className="text-xl font-bold text-gray-900">₹{finalTotal}</div>
            </div>
            <button 
              onClick={step === 4 ? onPlaceOrderAndPay : handleNext}
              disabled={(step === 2 && !otp.verified)}
              className={`flex-1 bg-gray-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-lg ${isDesktop ? '' : 'md:w-full'}`}
            >
              {step === 4 ? (
                  creating.status === 'loading' ? (
                      <><Loader className="animate-spin" /> Processing...</>
                  ) : `Pay ₹${finalTotal}`
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </>
  );
}