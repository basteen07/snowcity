export const getPrice = (obj) =>
  Number(
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
  Number(
    obj?.price ??
    obj?.base_price ??
    obj?.amount ??
    obj?.starting_price ??
    obj?.min_price ??
    obj?.total_price ??
    0
  );

export const getUnitLabel = (obj) =>
  obj?.unit_label || obj?.price_unit || (obj?.type === 'combo' ? 'per combo' : 'per person');