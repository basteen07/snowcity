export function safeKey(prefix, item, idx) {
  const val =
    item?.id ??
    item?._id ??
    item?.slug ??
    item?.code ??
    item?.uuid ??
    `idx-${idx}`;
  return `${prefix}-${String(val)}`;
}