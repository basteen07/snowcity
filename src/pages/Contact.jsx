import React from 'react';

export default function Contact() {
  const [form, setForm] = React.useState({ name: '', email: '', phone: '', message: '' });
  const mailto = `mailto:info@snowcity.com?subject=Enquiry%20from%20${encodeURIComponent(form.name || 'Visitor')}&body=${encodeURIComponent(
    `Name: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone}\n\n${form.message}`
  )}`;

  const onSubmit = (e) => {
    e.preventDefault();
    // For now: send via mailto. Replace with backend POST when available.
    window.location.href = mailto;
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">Contact Us</h1>
      <p className="text-gray-600 mb-6">Have a question? Send us a message and we’ll get back to you.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Name</label>
          <input className="w-full rounded-md border px-3 py-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input className="w-full rounded-md border px-3 py-2" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Phone</label>
            <input className="w-full rounded-md border px-3 py-2" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Message</label>
          <textarea className="w-full rounded-md border px-3 py-2" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="rounded-full bg-blue-600 text-white px-5 py-2">Send</button>
          <a href={mailto} className="rounded-full border px-5 py-2">Open Email App</a>
        </div>
      </form>

      <div className="mt-10">
        <h2 className="text-xl font-semibold mb-2">Snowcity Theme Park</h2>
        <p className="text-gray-600">Bengaluru, Karnataka • +91-99999 99999 • info@snowcity.com</p>
      </div>
    </div>
  );
}