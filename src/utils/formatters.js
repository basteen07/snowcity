export const formatCurrency = (
  n,
  currency = 'INR',
  { minimumFractionDigits = 2, maximumFractionDigits = 2 } = {}
) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(Number(n || 0));

export const formatDate = (d) => {
  try { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return String(d || ''); }
};