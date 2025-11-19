import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/apiClient';
import endpoints from '../services/endpoints';
import { imgSrc } from '../utils/media';
import { 
  X, Calendar, Clock, ShoppingBag, Check, ChevronRight, Ticket, 
  User, Mail, Phone, ArrowRight, Plus, Minus, Trash2, Edit2, UserPlus 
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

/* ================= Component ================= */
export default function Booking() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
  const [isBookingOpen, setIsBookingOpen] = useState(true);
  const [sel, setSel] = React.useState(() => createDefaultSelection());
  const [editingKey, setEditingKey] = React.useState(null);
  const [slots, setSlots] = React.useState({ status: 'idle', items: [], error: null });
  const [otpCode, setOtpCode] = React.useState('');
  const [promoInput, setPromoInput] = React.useState('');

  // Offers
  const [offers, setOffers] = React.useState([]);
  const [offersStatus, setOffersStatus] = React.useState('idle');
  const [selectedOfferId, setSelectedOfferId] = React.useState('');

  const [cartAddons, setCartAddons] = React.useState(new Map());
  const [debugOtp, setDebugOtp] = React.useState('');
  const contentRef = React.useRef(null);

  const currentItemAddons = React.useMemo(() => {
    if (!activeItemKey) return new Map();
    return cartAddons.get(activeItemKey) || new Map();
  }, [cartAddons, activeItemKey]);

  const [search] = useSearchParams();
  const preselectAttrId = search.get('attraction_id');
  const preselectComboId = search.get('combo_id');
  const forceAuth = search.get('auth');

  const handleCloseBooking = React.useCallback(() => {
    setIsBookingOpen(false);
    navigate('/');
  }, [navigate]);

  // --- EFFECTS ---

  React.useEffect(() => {
    dispatch(setStep(1));
  }, [dispatch]);

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

  React.useEffect(() => {
    if (forceAuth && !hasToken) {
      setIsBookingOpen(true);
      dispatch(setStep(2));
    }
  }, [forceAuth, hasToken, dispatch]);

  React.useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

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
        price,
        image: selectedCombo.image_url
      };
    }
    if (sel.itemType === 'attraction' && selectedAttraction) {
      const price = selectedSlot?.price != null
        ? Number(selectedSlot.price)
        : Number(selectedAttraction?.price || selectedAttraction?.base_price || selectedAttraction?.amount || 0);
      return {
        title: selectedAttraction?.name || selectedAttraction?.title || `Attraction #${getAttrId(selectedAttraction)}`,
        price,
        image: selectedAttraction.image_url
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
  const discount = Number(coupon.discount || 0);
  const finalTotal = Math.max(0, grossTotal - discount);

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

      const email = (contact.email || auth?.user?.email || '').trim();
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

  const sendOTP = async () => {
    const email = (contact.email || '').trim();
    const phone = (contact.phone || '').replace(/[^\d+]/g, '');
    if (!email && !phone) return alert('Enter email or phone');
    try {
      const res = await dispatch(sendAuthOtp({ email, phone })).unwrap();
      if (res?.otp) {
        setDebugOtp(res.otp);
        setOtpCode(res.otp);
      }
    } catch (e) {
      setDebugOtp('');
      alert(e?.message || 'Failed to send OTP');
    }
  };

  const verifyOTP = async () => {
    if (!otpCode) return alert('Enter the OTP code');
    await dispatch(verifyAuthOtp({ otp: otpCode }))
      .unwrap()
      .then(() => setDebugOtp(''))
      .catch((e) => alert(e?.message || 'OTP verification failed'));
  };

  const applyPromo = async () => {
    if (!promoInput) return;
    await dispatch(applyCoupon({ code: promoInput, total_amount: grossTotal, onDate: sel.date || toYMD(new Date()) }))
      .unwrap()
      .then(() => dispatch(setCouponCode(promoInput)))
      .catch(() => {});
  };

  /* --- UI COMPONENTS --- */

  const ProgressBar = () => (
    <div className="flex items-center justify-between mb-6 px-4">
      {[
        { n: 1, l: 'Select' },
        { n: 2, l: 'Auth' },
        { n: 3, l: 'Extras' },
        { n: 4, l: 'Pay' }
      ].map((s) => {
        // Skip showing Auth step if logged in
        if(hasToken && s.n === 2) return null;
        const isCompleted = step > s.n || (hasToken && s.n === 2);
        const isCurrent = step === s.n;
        const showCheck = isCompleted || (hasToken && s.n === 2);

        return (
          <div key={s.n} className="flex flex-col items-center relative z-10 group">
            <div 
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 ${
                isCurrent ? 'bg-white border-blue-600 text-blue-600 scale-110' :
                showCheck ? 'bg-blue-600 border-blue-600 text-white' : 
                'bg-white border-gray-200 text-gray-300'
              }`}
            >
              {showCheck && !isCurrent ? <Check size={16} /> : s.n}
            </div>
            <span className={`text-[10px] mt-1.5 font-medium uppercase tracking-wide ${isCurrent || showCheck ? 'text-blue-600' : 'text-gray-300'}`}>
              {s.l}
            </span>
          </div>
        )
      })}
      {/* Connector Line */}
      <div className="absolute left-8 right-8 top-[26px] h-[2px] bg-gray-100 -z-0">
        <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((step-1)/(hasToken?2:3))*100}%` }}></div>
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
          <div className="bg-gray-100 p-1 rounded-xl inline-flex">
            {['attraction', 'combo'].map(t => (
              <button
                key={t}
                onClick={() => {
                  setSel(prev => ({ ...prev, itemType: t, attractionId: '', comboId: '', slotKey: '' }));
                }}
                className={`px-6 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                  sel.itemType === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {t}s
              </button>
            ))}
          </div>
        </div>

        {/* Horizontal Scroll Cards */}
        <div className="flex gap-4 overflow-x-auto snap-x pb-6 px-1 no-scrollbar -mx-2 md:mx-0">
          {data.map(item => {
            const id = activeTab === 'attraction' ? getAttrId(item) : getComboId(item);
            const isSelected = String(activeTab === 'attraction' ? sel.attractionId : sel.comboId) === String(id);
            const img = item.image_url || item.image; 
            const price = item.price || item.base_price || item.combo_price || 0;
            const title = activeTab === 'attraction' ? (item.title || item.name) : getComboLabel(item);

            return (
              <div 
                key={id}
                onClick={() => setSel(prev => ({
                  ...prev, 
                  [activeTab === 'attraction' ? 'attractionId' : 'comboId']: String(id),
                  slotKey: '' 
                }))}
                className={`snap-center flex-shrink-0 w-64 rounded-2xl cursor-pointer transition-all duration-200 group overflow-hidden bg-white shadow-sm hover:shadow-md border-2 ${
                  isSelected ? 'border-blue-500 ring-2 ring-blue-100' : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="h-36 bg-gray-100 relative">
                  {img ? (
                    <img src={imgSrc(img)} alt={title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300"><ShoppingBag size={32} /></div>
                  )}
                  {isSelected && (
                    <div className="absolute top-3 right-3 bg-blue-600 text-white p-1.5 rounded-full shadow-lg animate-in zoom-in">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                    <p className="text-white font-bold text-lg">₹{price}</p>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-gray-800 line-clamp-1 mb-1" title={title}>{title}</h4>
                  <p className="text-xs text-gray-500">
                    {activeTab === 'combo' ? 'Includes multiple activities' : 'Single entry ticket'}
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
  return (
    <div className="relative">
      
      {/* Desktop: Inline View / Mobile: Trigger */}
      <div className={`
        md:block max-w-7xl mx-auto px-4 py-8
        ${isBookingOpen ? '' : 'hidden md:block'}
      `}>
        {/* Desktop Header (Only visible on desktop when not using modal) */}
        <div className="hidden md:flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Book Your Tickets</h1>
            <p className="text-gray-500 mt-1">Select your adventure and plan your visit.</p>
          </div>
        </div>
      </div>

      {/* Mobile Trigger FAB */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        {!isBookingOpen && (
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="bg-gray-900 text-white p-4 rounded-full shadow-xl flex items-center gap-2 animate-bounce-slow hover:scale-105 transition-transform"
          >
            <Ticket size={24} />
            <span className="font-bold">Book Now</span>
          </button>
        )}
      </div>

      {/* Overlay (Mobile Only) */}
      {isBookingOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={handleCloseBooking}
        />
      )}

      {/* Main Booking Container (Responsive) */}
      <div className={`
        bg-white shadow-2xl transition-all duration-300 ease-out
        
        /* Mobile Styles: Bottom Sheet */
        fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[92vh] overflow-hidden flex flex-col
        ${isBookingOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}

        /* Desktop Styles: Embedded Card */
        md:static md:shadow-none md:rounded-none md:max-h-none md:bg-transparent md:max-w-5xl md:mx-auto
      `}>
        
        {/* Desktop Layout Split */}
        <div className="md:grid md:grid-cols-12 md:gap-8">
          
          {/* Left Column: Main Form */}
          <div className="md:col-span-8 bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm md:p-0">
            
            {/* Header */}
            <div className="sticky top-0 bg-white/95 backdrop-blur z-20 px-6 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-6 md:hidden">
                <h2 className="text-xl font-bold text-gray-800">Book Tickets</h2>
                <button onClick={handleCloseBooking} className="p-2 bg-gray-100 rounded-full text-gray-500">
                  <X size={20} />
                </button>
              </div>
              <ProgressBar />
            </div>

            {/* Scrollable Content Area */}
            <div ref={contentRef} className="px-6 py-6 overflow-y-auto md:overflow-visible max-h-[calc(90vh-140px)] md:max-h-none pb-32 md:pb-6">
              
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <SelectionCarousel />

                  {/* Date/Slot Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Calendar size={14} /> Select Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium cursor-pointer transition-all hover:border-gray-300"
                        min={todayYMD()}
                        value={sel.date}
                        onChange={(e) => setSel(s => ({ ...s, date: e.target.value, slotKey: '' }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={14} /> Select Time
                      </label>
                      <div className="relative">
                        <select
                          className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 transition-all hover:border-gray-300"
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

                  {/* Quantity & Add */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Number of Tickets</label>
                      <div className="flex items-center gap-4 bg-white rounded-xl p-1.5 border border-gray-200 w-fit">
                        <button onClick={() => setSel(s => ({...s, qty: Math.max(1, s.qty - 1)}))} className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95 transition">
                          <Minus size={18} />
                        </button>
                        <span className="font-bold text-xl w-8 text-center text-gray-800">{sel.qty}</span>
                        <button onClick={() => setSel(s => ({...s, qty: Math.max(1, s.qty + 1)}))} className="w-10 h-10 flex items-center justify-center rounded-lg bg-gray-900 text-white hover:bg-black active:scale-95 transition shadow-md">
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 md:w-auto w-full">
                      <div className="text-right md:mr-4 flex-1 md:flex-none">
                        <div className="text-xs text-gray-500 mb-0.5">Item Total</div>
                        <div className="text-2xl font-bold text-gray-900">₹{ticketsSubtotal}</div>
                      </div>
                      <button
                        onClick={addSelectionToCart}
                        disabled={!selectionReady}
                        className="flex-1 md:flex-none px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        {editingKey ? 'Update' : 'Add to Order'}
                      </button>
                    </div>
                  </div>

                  {/* Cart Preview */}
                  {hasCartItems && (
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Current Order</h4>
                      <div className="space-y-3">
                        {cartItems.map(item => (
                          <div key={item.key} className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:border-blue-200 transition-colors group">
                            <div>
                              <div className="font-bold text-gray-800">{item.title}</div>
                              <div className="text-sm text-gray-500 mt-1">
                                {item.dateLabel} • {item.slotLabel} • <span className="text-gray-900 font-medium">{item.quantity} Tickets</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-gray-900 text-lg">₹{item.unitPrice * item.quantity}</span>
                              <div className="flex gap-1">
                                <button onClick={() => onEditCartItem(item)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                <button onClick={() => onRemoveCartItem(item.key)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2, 3, 4 (Simplified for brevity, keeping logic) */}
              {step === 2 && (
                <div className="space-y-6 max-w-md mx-auto py-4">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Verify Your Identity</h3>
                    <p className="text-gray-500 text-sm mt-1">We need your contact details to send your tickets.</p>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-900/80">
                    <div className="flex items-center gap-2 font-semibold text-blue-900">
                      <UserPlus size={16} />
                      Sign in or create your SnowCity profile
                    </div>
                    <p className="mt-2 leading-relaxed">
                      Enter your name, email, and mobile once. We will automatically create a new profile or
                      sign you back in if you have visited before. The same OTP flow works for both new and
                      existing guests.
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-blue-900/70 list-disc list-inside">
                      <li>New visitor: complete the fields, verify OTP, and your profile is created instantly.</li>
                      <li>Returning visitor: use the same email/phone to receive an OTP and continue booking.</li>
                      <li>Already logged in: this step is skipped automatically.</li>
                    </ul>
                  </div>
                  {/* ... Auth inputs (same as previous) ... */}
                  <div className="space-y-4">
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input placeholder="Full Name" className="w-full pl-10 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={contact.name} onChange={e => dispatch(setContact({name: e.target.value}))} />
                    </div>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input placeholder="Email" type="email" className="w-full pl-10 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={contact.email} onChange={e => dispatch(setContact({email: e.target.value}))} />
                    </div>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Phone className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input placeholder="Mobile" type="tel" className="w-full pl-10 p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" value={contact.phone} onChange={e => dispatch(setContact({phone: fmtPhone(e.target.value)}))} />
                        </div>
                        <button onClick={sendOTP} className="bg-gray-900 text-white px-6 rounded-xl text-sm font-bold hover:bg-black disabled:opacity-50">
                          {otp.sent ? 'Resend OTP' : 'Send OTP & Sign In'}
                        </button>
                    </div>
                    {otp.sent && (
                        <div className="flex gap-3 mt-4 animate-in slide-in-from-top-2">
                            <input placeholder="OTP" className="flex-1 p-3.5 text-center tracking-widest font-bold text-lg border-2 border-blue-100 rounded-xl focus:border-blue-500 outline-none" value={otpCode} onChange={e => setOtpCode(e.target.value)} maxLength={6} />
                            <button onClick={verifyOTP} className="bg-blue-600 text-white px-8 rounded-xl font-bold shadow-lg hover:bg-blue-700">Verify & Continue</button>
                        </div>
                    )}
                    {!otp.sent && (
                      <p className="text-xs text-gray-500 text-center">
                        We&apos;ll send a one-time password to confirm your identity.
                      </p>
                    )}
                    {debugOtp && (
                      <div className="text-xs text-green-600 bg-green-50 border border-green-100 rounded-xl p-3 text-center">
                        Testing OTP: <span className="font-mono font-semibold">{debugOtp}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 3 & 4 content ... (kept similar structure) */}
              {step === 3 && (
                 <div className="space-y-6">
                    {/* Item Tabs */}
                    {cartItems.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {cartItems.map(item => (
                            <button 
                            key={item.key}
                            onClick={() => dispatch(setActiveCartItem(item.key))}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${
                                activeItemKey === item.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                            >
                            {item.title}
                            </button>
                        ))}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {addonsState.items.map(addon => {
                            const key = String(getAddonId(addon));
                            const currentQty = currentItemAddons.get(key)?.quantity || 0;
                            const price = getAddonPrice(addon);
                            return (
                                <div key={key} className={`flex items-center p-3 border rounded-xl transition-all ${currentQty > 0 ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                        {getAddonImage(addon) && <img src={getAddonImage(addon)} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 px-3">
                                        <div className="font-semibold text-gray-800 text-sm">{getAddonName(addon)}</div>
                                        <div className="text-gray-500 text-xs mt-0.5">₹{price}</div>
                                    </div>
                                    <div className="flex items-center gap-3 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                                        <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-gray-600" onClick={() => {
                                            const n = Math.max(0, currentQty - 1);
                                            const next = new Map(currentItemAddons);
                                            if(n===0) next.delete(key); else next.set(key, { addon_id: getAddonId(addon), quantity: n, price, name: getAddonName(addon) });
                                            setCartAddons(new Map(cartAddons).set(activeItemKey, next));
                                        }} disabled={currentQty===0}>-</button>
                                        <span className="font-bold text-sm w-4 text-center">{currentQty}</span>
                                        <button className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded text-blue-600" onClick={() => {
                                            const n = currentQty + 1;
                                            const next = new Map(currentItemAddons);
                                            next.set(key, { addon_id: getAddonId(addon), quantity: n, price, name: getAddonName(addon) });
                                            setCartAddons(new Map(cartAddons).set(activeItemKey, next));
                                        }}>+</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                 </div>
              )}

              {step === 4 && (
                  <div className="space-y-6 max-w-lg mx-auto">
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                          <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Payment Summary</h3>
                          <div className="space-y-3 text-sm">
                              <div className="flex justify-between text-gray-600"><span>Subtotal (Tickets)</span> <span>₹{cartTicketsTotal}</span></div>
                              <div className="flex justify-between text-gray-600"><span>Add-ons</span> <span>₹{totalAddonsCost}</span></div>
                              {discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span> <span>-₹{discount}</span></div>}
                              <div className="flex justify-between font-bold text-xl text-gray-900 pt-3 border-t border-gray-200 mt-2">
                                  <span>Total</span>
                                  <span>₹{finalTotal}</span>
                              </div>
                          </div>
                      </div>
                      <div className="flex gap-3">
                          <input placeholder="PROMO CODE" className="flex-1 uppercase p-3 border border-gray-300 rounded-xl outline-none focus:border-blue-500 text-sm font-bold tracking-wider" value={promoInput} onChange={e => setPromoInput(e.target.value)} />
                          <button onClick={applyPromo} className="px-5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-black">APPLY</button>
                      </div>
                  </div>
              )}

            </div>
          </div>

          {/* Right Column (Desktop): Cart Sticky Summary */}
          <div className="hidden md:flex md:col-span-4 flex-col gap-4 sticky top-24 h-fit">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Total Payable</h3>
              <div className="text-4xl font-black text-blue-600 mb-2">₹{finalTotal}</div>
              <p className="text-gray-400 text-sm mb-6">Includes all taxes</p>
              
              <button 
                onClick={step === 4 ? onPlaceOrderAndPay : handleNext}
                disabled={(step === 2 && !otp.verified) || (!hasCartItems && !selectionReady)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-0.5 transition-all active:translate-y-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:transform-none disabled:cursor-not-allowed"
              >
                {step === 4 ? (creating.status === 'loading' ? 'Processing...' : 'Pay Securely') : (
                  <>Proceed <ArrowRight size={20} /></>
                )}
              </button>

              {/* Desktop Mini-Cart List */}
              {hasCartItems && (
                <div className="mt-6 border-t pt-6">
                    <div className="text-xs font-bold text-gray-400 uppercase mb-3">Selected Items</div>
                    <div className="space-y-2">
                        {cartItems.map(item => (
                            <div key={item.key} className="flex justify-between text-sm text-gray-600">
                                <span>{item.quantity}x {item.title}</span>
                                <span className="font-medium">₹{item.unitPrice * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Sticky Footer (Mobile Only) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 z-30 safe-area-pb">
          <div className="flex items-center justify-between mb-3 px-1">
             <div className="text-xs text-gray-500 font-medium">Total Amount</div>
             <div className="text-lg font-bold text-gray-900">₹{finalTotal}</div>
          </div>
          <button 
            onClick={step === 4 ? onPlaceOrderAndPay : handleNext}
            disabled={(step === 2 && !otp.verified)}
            className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-black active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {step === 4 ? (creating.status === 'loading' ? 'Processing...' : `Pay Now`) : (
              <>
                <span>Continue</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}