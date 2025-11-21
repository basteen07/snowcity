const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

export const getPrice = (obj) =>
  toNumber(
    obj?.pricing?.final_price ??
    obj?.sale_price ??
    obj?.discount_price ??
    obj?.price ??
    obj?.base_price ??
    obj?.combo_price ??
    obj?.amount ??
    obj?.starting_price ??
    obj?.min_price ??
    obj?.total_price ??
    0
  );

export const getBasePrice = (obj) =>
  toNumber(
    obj?.pricing?.base_price ??
    obj?.price ??
    obj?.base_price ??
    obj?.amount ??
    obj?.starting_price ??
    obj?.min_price ??
    obj?.total_price ??
    0
  );

export const getDiscountPercent = (obj) => {
  if (obj?.pricing?.discount_percent != null) {
    return toNumber(obj.pricing.discount_percent, 0);
  }
  const base = getBasePrice(obj);
  const price = getPrice(obj);
  if (!base || !price || price >= base) return 0;
  return Math.max(0, ((base - price) / base) * 100);
};

export const getUnitLabel = (obj) =>
  obj?.unit_label || obj?.price_unit || (obj?.type === 'combo' ? 'per combo' : 'per person');