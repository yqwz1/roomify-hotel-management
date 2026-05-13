import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  Building2,
  User,
  Mail,
  Phone,
  BedDouble,
  Loader2,
} from 'lucide-react';
import Footer from '../components/Footer';
import Reveal, { EASE } from '../components/motion/Reveal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const HIGHLIGHTS = [
  { label: '30-min walkthrough', desc: 'Live, with one of our hotel specialists.' },
  { label: 'Your data, your scenarios', desc: 'We tailor the demo to your property type and size.' },
  { label: 'Q&A on compliance', desc: 'ZATCA, VAT, PDPL — bring every question.' },
  { label: 'No obligation', desc: 'Get the deck, the pricing, and walk away if it doesn’t fit.' },
];

const ROOM_RANGES = ['Under 30', '30 – 80', '80 – 150', '150 – 300', '300+'];

export default function Demo() {
  const [form, setForm] = useState({
    hotelName: '',
    name: '',
    email: '',
    phone: '',
    rooms: '',
    role: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hotelName || !form.name || !form.email) {
      setError('Hotel name, your name, and email are required.');
      return;
    }
    setSubmitting(true);
    // No backend wired yet — simulate a short delay, then thank-you state.
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-full bg-[#f7f3ed]">
      <section className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-amber-200/30 to-transparent blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_1.05fr]">

            {/* LEFT — Pitch */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600 shadow-sm"
              >
                <Calendar className="h-3 w-3" />
                Request a demo
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
                className="mt-4 text-[2rem] font-black leading-[1.15] tracking-tight text-zinc-950 sm:text-[2.3rem]"
              >
                See Roomify run your front desk in 30 minutes
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                className="mt-3 max-w-md text-[0.95rem] font-medium leading-relaxed text-zinc-500"
              >
                Tell us about your property and pick a time. We&apos;ll walk through reservations, billing, and compliance using a property that matches yours.
              </motion.p>

              <motion.ul
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } },
                }}
                className="mt-8 space-y-3"
              >
                {HIGHLIGHTS.map((h) => (
                  <motion.li
                    key={h.label}
                    variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.55, ease: EASE }}
                    className="flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-sm font-black text-zinc-950">{h.label}</p>
                      <p className="text-[12px] font-medium leading-snug text-zinc-500">{h.desc}</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            {/* RIGHT — Form / Success */}
            <Reveal delay={0.15} variant="scale" className="relative">
              <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-xl shadow-zinc-200/50 sm:p-8">
                {!submitted ? (
                  <>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">Step 1 of 1</p>
                    <h2 className="mt-1 text-lg font-black tracking-tight text-zinc-950">Tell us about your property</h2>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700"
                      >
                        {error}
                      </motion.p>
                    )}

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                      <FieldRow
                        icon={Building2}
                        id="hotelName"
                        label="Hotel name"
                        value={form.hotelName}
                        onChange={handleChange}
                        placeholder="e.g. Roomify Riyadh"
                      />
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldRow
                          icon={User}
                          id="name"
                          label="Your name"
                          value={form.name}
                          onChange={handleChange}
                          placeholder="Full name"
                        />
                        <FieldRow
                          id="role"
                          label="Your role"
                          value={form.role}
                          onChange={handleChange}
                          placeholder="GM, Owner, Operations…"
                        />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldRow
                          icon={Mail}
                          id="email"
                          label="Work email"
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@hotel.com"
                          dir="ltr"
                        />
                        <FieldRow
                          icon={Phone}
                          id="phone"
                          label="Phone"
                          value={form.phone}
                          onChange={handleChange}
                          placeholder="+966 5…"
                          dir="ltr"
                        />
                      </div>

                      {/* Room range chips */}
                      <div>
                        <Label className="text-sm font-bold text-zinc-700">
                          <BedDouble className="me-1.5 inline h-3.5 w-3.5" />
                          Number of rooms
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {ROOM_RANGES.map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, rooms: r }))}
                              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                                form.rooms === r
                                  ? 'border-zinc-950 bg-zinc-950 text-white'
                                  : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                              }`}
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes" className="text-sm font-bold text-zinc-700">
                          Anything specific you&apos;d like to see? <span className="font-medium text-zinc-400">(optional)</span>
                        </Label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={form.notes}
                          onChange={handleChange}
                          rows={3}
                          className="mt-1.5 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 transition focus-visible:border-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-200"
                          placeholder="ZATCA setup, multi-property, OTA sync…"
                        />
                      </div>

                      <motion.div whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.99 }}>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="mt-1 h-11 w-full rounded-full bg-zinc-950 text-sm font-bold text-white shadow-lg shadow-zinc-950/20 transition-all hover:bg-zinc-800 hover:shadow-xl hover:shadow-zinc-950/25"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="me-2 h-4 w-4 animate-spin" />
                              Submitting…
                            </>
                          ) : (
                            <>
                              Request my demo
                              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
                            </>
                          )}
                        </Button>
                      </motion.div>

                      <p className="text-center text-[11px] font-medium text-zinc-400">
                        We&apos;ll never share your details. One follow-up email max.
                      </p>
                    </form>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="py-6 text-center"
                  >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-7 w-7 text-emerald-700" />
                    </div>
                    <h2 className="mt-5 text-lg font-black tracking-tight text-zinc-950">
                      Thanks, {form.name.split(' ')[0] || 'there'} — we got it.
                    </h2>
                    <p className="mt-2 max-w-sm mx-auto text-sm font-medium leading-relaxed text-zinc-500">
                      A Roomify specialist will reach out within one business day to confirm a time that works for {form.hotelName || 'your property'}.
                    </p>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ hotelName: '', name: '', email: '', phone: '', rooms: '', role: '', notes: '' });
                      }}
                      variant="ghost"
                      className="mt-6 h-10 rounded-full border border-zinc-200 px-5 text-sm font-bold text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950"
                    >
                      Submit another
                    </Button>
                  </motion.div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FieldRow({ icon: Icon, id, label, value, onChange, placeholder, type = 'text', dir }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-bold text-zinc-700">
        {Icon && <Icon className="me-1.5 inline h-3.5 w-3.5" />}
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        dir={dir}
        className="h-11 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm transition-all duration-200 focus-visible:border-zinc-400 focus-visible:ring-zinc-300"
      />
    </div>
  );
}
