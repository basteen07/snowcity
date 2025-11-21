import React from 'react';
import { motion } from 'framer-motion';

const testimonials = [
  {
    id: '1',
    name: 'Priya Sharma',
    rating: 5,
    comment:
      'Amazing experience! The Snow Park was absolutely wonderful. My kids loved every moment. Highly recommended for families!',
    date: 'Oct 2024',
    avatar: '👩'
  },
  {
    id: '2',
    name: 'Rahul Mehta',
    rating: 5,
    comment:
      'Best theme park in Bangalore! The Eyelusion show was mind-blowing. Great value for money and super clean facilities.',
    date: 'Oct 2024',
    avatar: '👨'
  },
  {
    id: '3',
    name: 'Anita Desai',
    rating: 5,
    comment:
      "Visited with friends and had a blast! Devil's Dark House was thrilling. Staff was very helpful and friendly.",
    date: 'Sep 2024',
    avatar: '👩'
  },
  {
    id: '4',
    name: 'Karthik Kumar',
    rating: 4,
    comment:
      'Great experience overall! The arcade games section is fantastic. Perfect weekend outing with the family.',
    date: 'Sep 2024',
    avatar: '👨'
  },
  {
    id: '5',
    name: 'Sneha Reddy',
    rating: 5,
    comment:
      'Absolutely loved the AR Zoo! Such an innovative concept. My children were amazed and we spent hours there.',
    date: 'Aug 2024',
    avatar: '👩'
  },
  {
    id: '6',
    name: 'Amit Singh',
    rating: 5,
    comment:
      'Fantastic place for all ages! Clean, well-maintained, and lots of fun activities. Will definitely visit again!',
    date: 'Aug 2024',
    avatar: '👨'
  }
];

const StarIcon = ({ filled }) => (
  <svg
    className={`h-5 w-5 ${filled ? 'text-yellow-400' : 'text-gray-300'}`}
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.564-.954L10 0l2.946 5.956 6.564.954-4.755 4.635 1.123 6.545z" />
  </svg>
);

const QuoteIcon = () => (
  <svg className="h-8 w-8 text-blue-200" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7.17 6A4.17 4.17 0 0 0 3 10.17v7.66A1.17 1.17 0 0 0 4.17 19H9a1 1 0 0 0 1-1v-4.83A7.17 7.17 0 0 0 7.17 6Zm9.83 0A4.17 4.17 0 0 0 13 10.17v7.66a1.17 1.17 0 0 0 1.17 1.17H19a1 1 0 0 0 1-1v-4.83A7.17 7.17 0 0 0 17 6Z" />
  </svg>
);

export default function Testimonials() {
  const [mobileIndex, setMobileIndex] = React.useState(0);

  React.useEffect(() => {
    if (!testimonials.length) return undefined;
    const timer = setInterval(() => {
      setMobileIndex((prev) => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const currentTestimonial = testimonials[mobileIndex];

  return (
    <section className="bg-gradient-to-b from-white to-purple-50 py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <p className="text-xs font-semibold tracking-[0.4em] text-purple-400/80">
            WHAT OUR VISITORS SAY
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Loved by families & thrill-seekers</h2>
          <p className="mt-3 text-gray-600">
            Don’t just take our word for it — hear from thousands of happy visitors
          </p>
        </motion.div>

        {/* Mobile slider */}
        <div className="md:hidden">
          <motion.div
            key={currentTestimonial.id}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg"
          >
            <div className="mb-4 flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <StarIcon key={i} filled={i < currentTestimonial.rating} />
              ))}
            </div>
            <div className="relative">
              <div className="absolute -top-2 -left-2">
                <QuoteIcon />
              </div>
              <p className="relative z-10 pl-6 text-gray-700">
                {currentTestimonial.comment}
              </p>
            </div>
            <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-2xl">
                {currentTestimonial.avatar}
              </div>
              <div>
                <div className="font-semibold text-slate-900">{currentTestimonial.name}</div>
                <div className="text-sm text-gray-500">{currentTestimonial.date}</div>
              </div>
            </div>
          </motion.div>
          <div className="mt-4 flex items-center justify-center gap-2">
            {testimonials.map((_, idx) => (
              <span
                key={idx}
                className={`h-2.5 w-2.5 rounded-full ${
                  idx === mobileIndex ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop grid */}
        <div className="hidden md:grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, duration: 0.45 }}
              whileHover={{ y: -5 }}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all hover:shadow-xl"
            >
              <div className="mb-4 flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} filled={i < testimonial.rating} />
                ))}
              </div>

              <div className="relative">
                <div className="absolute -top-2 -left-2">
                  <QuoteIcon />
                </div>
                <p className="relative z-10 pl-6 text-gray-700">
                  {testimonial.comment}
                </p>
              </div>

              <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-400 text-2xl">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.date}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-2 text-gray-600">
            <StarIcon filled />
            <span className="text-2xl font-bold text-slate-900">4.8/5</span>
            <span>from 10,000+ reviews</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}