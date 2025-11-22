import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Clock, MapPin, Shield, HelpCircle } from 'lucide-react';

const planItems = [
  {
    icon: Clock,
    title: 'Park Timings',
    description: '10:15 am to 8:00 pm | Every day',
    href: '/page/Visitors%20Info'
  },
  {
    icon: MapPin,
    title: 'Getting There',
    description: 'Easy metro & bus connectivity',
    href: '/page/location'
  },
  {
    icon: Shield,
    title: 'Safety Guidelines',
    description: 'What to wear, what to expect',
    href: '/page/safety'
  },
  {
    icon: HelpCircle,
    title: 'FAQs',
    description: 'Answers to popular questions',
    href: '/page/faq'
  }
];

export default function PlanVisitSection() {
  return (
    <section id="plan-visit" className="relative overflow-hidden bg-white py-16 px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-blue-50/60 to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="text-xs font-semibold tracking-[0.4em] text-blue-400/70">VISITOR GUIDE</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Plan your visit</h2>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Everything you need to know before stepping into the SnowCity experience.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {planItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Link
                  to={item.href || '#'}
                  className="group flex h-full flex-col items-center rounded-2xl border border-blue-50 bg-white p-6 text-center shadow-lg transition hover:shadow-2xl"
                >
                  <motion.div
                    className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-slate-900 shadow-md"
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="h-8 w-8" />
                  </motion.div>
                  <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                    Learn more
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
