import React from 'react';
import { motion } from 'motion/react';
import { formatCurrency } from '../../utils/formatters';

const getAddonTitle = (addon, idx) => addon?.name || addon?.title || addon?.label || `Addon #${idx + 1}`;
const getAddonDescription = (addon) => addon?.short_description || addon?.subtitle || addon?.description || '';
const getAddonDetails = (addon) => addon?.details || addon?.long_description || addon?.fine_print || '';
const getAddonIcon = (addon) => addon?.icon || addon?.emoji || addon?.badge || '✨';
const getAddonPriceLabel = (addon) => {
  const rawPrice = addon?.price ?? addon?.amount ?? addon?.discounted_price;
  if (rawPrice === null || rawPrice === undefined) return null;
  const num = Number(rawPrice);
  if (Number.isNaN(num)) return String(rawPrice);
  return formatCurrency(num);
};

export default function AddonsSection({ items = [], onSelectAddon }) {
  if (!items.length) return null;

  return (
    <section id="addons" className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-16 px-4">
      <motion.div
        className="pointer-events-none absolute top-10 left-10 text-6xl opacity-10"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        aria-hidden="true"
      >
        🎪
      </motion.div>
      <motion.div
        className="pointer-events-none absolute bottom-10 right-10 text-6xl opacity-10"
        animate={{ y: [0, 15, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        aria-hidden="true"
      >
        🎠
      </motion.div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs font-semibold tracking-[0.4em] text-blue-400/70">ADD-ONS</p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">Enhance Your Visit</h2>
          <p className="mt-3 text-sm text-slate-500">
            Add these extras to make your experience even more memorable
          </p>
        </motion.div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((addon, index) => {
            const title = getAddonTitle(addon, index);
            const desc = getAddonDescription(addon);
            const details = getAddonDetails(addon);
            const icon = getAddonIcon(addon);
            const priceLabel = getAddonPriceLabel(addon);

            const handleClick = () => {
              if (onSelectAddon) onSelectAddon(addon);
            };

            return (
              <motion.div
                key={addon?.addon_id || addon?.id || index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05, duration: 0.5 }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <div
                  role={onSelectAddon ? 'button' : undefined}
                  tabIndex={onSelectAddon ? 0 : undefined}
                  onClick={handleClick}
                  onKeyDown={(e) => {
                    if (!onSelectAddon) return;
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleClick();
                    }
                  }}
                  className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-lg transition-all hover:shadow-2xl focus:outline-none"
                >
                  <motion.div
                    className="mb-3 inline-block text-5xl"
                    whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                  >
                    {icon}
                  </motion.div>
                  <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                  {desc ? <p className="mt-2 text-sm text-slate-600">{desc}</p> : null}
                  <div className="mt-auto pt-4">
                    {priceLabel ? (
                      <div className="text-2xl font-bold text-blue-600">{priceLabel}</div>
                    ) : (
                      <div className="text-sm font-semibold text-emerald-600">Included</div>
                    )}
                    {details ? <div className="mt-1 text-xs text-slate-500">{details}</div> : null}
                    {onSelectAddon ? (
                      <div className="mt-4 text-xs font-semibold text-blue-600">
                        Tap to add during booking →
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="mx-auto max-w-3xl rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <h3 className="text-2xl font-bold">💡 Pro Tip!</h3>
            <p className="mt-2 text-white/90">
              Add these extras during booking to unlock the best bundled pricing and priority access perks.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
