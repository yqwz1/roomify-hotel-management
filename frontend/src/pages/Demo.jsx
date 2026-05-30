import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

const HIGHLIGHT_IDS = ['walkthrough', 'data', 'qa', 'noObligation'];

const ROOM_RANGES = ['Under 30', '30 – 80', '80 – 150', '150 – 300', '300+'];

export default function Demo() {
  const { t } = useTranslation();
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
      setError(t('m.demo.error.required'));
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-full bg-brand-surface">
      <section className="relative overflow-hidden">
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-20 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-brand-accent-gold/20 to-transparent blur-3xl"
          animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />

        <div className="relative mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10 lg:py-20">
          <div className="grid min-w-0 items-start gap-10 lg:grid-cols-[1fr_1.05fr]">

            {/* LEFT — Pitch */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-brand-surface-border bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-brand-ink-muted shadow-sm"
              >
                <Calendar className="h-3 w-3 shrink-0" />
                {t('m.demo.eyebrow')}
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1, ease: EASE }}
                className="mt-4 font-serif text-[2.1rem] font-medium leading-[1.1] tracking-[-0.015em] text-brand-ink sm:text-[2.5rem]"
              >
                {t('m.demo.headline')}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                className="mt-3 max-w-md text-[0.95rem] font-medium leading-relaxed text-brand-ink-muted"
              >
                {t('m.demo.bio')}
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
                {HIGHLIGHT_IDS.map((id) => (
                  <motion.li
                    key={id}
                    variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                    transition={{ duration: 0.55, ease: EASE }}
                    className="flex min-w-0 items-start gap-3 rounded-2xl border border-brand-surface-border bg-white px-4 py-3"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-success" />
                    <div>
                      <p className="text-sm font-black text-brand-ink break-words">{t(`m.demo.hi.${id}.label`)}</p>
                      <p className="text-[12px] font-medium leading-snug text-brand-ink-muted break-words">{t(`m.demo.hi.${id}.desc`)}</p>
                    </div>
                  </motion.li>
                ))}
              </motion.ul>
            </div>

            {/* RIGHT — Form / Success */}
            <Reveal delay={0.15} variant="scale" className="relative">
              <div className="rounded-[2rem] border border-brand-surface-border bg-white p-6 shadow-xl shadow-brand-primary-deep/10 sm:p-8">
                {!submitted ? (
                  <>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-brand-ink-hint break-words">{t('m.demo.formStep')}</p>
                    <h2 className="mt-1 text-lg font-black tracking-tight text-brand-ink break-words">{t('m.demo.formTitle')}</h2>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-3 rounded-xl border border-brand-danger/30 bg-brand-danger/5 px-3 py-2 text-xs font-semibold text-brand-danger"
                      >
                        {error}
                      </motion.p>
                    )}

                    <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                      <FieldRow
                        icon={Building2}
                        id="hotelName"
                        label={t('m.demo.field.hotelName')}
                        value={form.hotelName}
                        onChange={handleChange}
                        placeholder={t('m.demo.field.hotelNamePh')}
                      />
                      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                        <FieldRow
                          icon={User}
                          id="name"
                          label={t('m.demo.field.name')}
                          value={form.name}
                          onChange={handleChange}
                          placeholder={t('m.demo.field.namePh')}
                        />
                        <FieldRow
                          id="role"
                          label={t('m.demo.field.role')}
                          value={form.role}
                          onChange={handleChange}
                          placeholder={t('m.demo.field.rolePh')}
                        />
                      </div>
                      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                        <FieldRow
                          icon={Mail}
                          id="email"
                          label={t('m.demo.field.email')}
                          type="email"
                          value={form.email}
                          onChange={handleChange}
                          placeholder={t('m.demo.field.emailPh')}
                          dir="ltr"
                        />
                        <FieldRow
                          icon={Phone}
                          id="phone"
                          label={t('m.demo.field.phone')}
                          value={form.phone}
                          onChange={handleChange}
                          placeholder={t('m.demo.field.phonePh')}
                          dir="ltr"
                        />
                      </div>

                      {/* Room range chips */}
                      <div>
                        <Label className="text-sm font-bold text-brand-ink">
                          <BedDouble className="me-1.5 inline h-3.5 w-3.5 shrink-0" />
                          {t('m.demo.field.rooms')}
                        </Label>
                        <div className="mt-2 flex min-w-0 flex-wrap gap-2">
                          {ROOM_RANGES.map((r) => (
                            <Button variant="unstyled" size="none"
                              key={r}
                              type="button"
                              onClick={() => setForm((p) => ({ ...p, rooms: r }))}
                              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-all ${
                                form.rooms === r
                                  ? 'border-brand-primary bg-brand-primary text-white'
                                  : 'border-brand-surface-border bg-white text-brand-ink-muted hover:border-brand-primary/30 hover:bg-brand-surface-light'
                              }`}
                            >
                              {r}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="notes" className="text-sm font-bold text-brand-ink">
                          {t('m.demo.field.notes')} <span className="font-medium text-brand-ink-hint break-words">{t('m.demo.field.optional')}</span>
                        </Label>
                        <textarea
                          id="notes"
                          name="notes"
                          value={form.notes}
                          onChange={handleChange}
                          rows={3}
                          className="mt-1.5 w-full rounded-xl border border-brand-surface-border bg-white px-3.5 py-2.5 text-sm text-brand-ink transition focus-visible:border-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary-tint"
                          placeholder={t('m.demo.field.notesPh')}
                        />
                      </div>

                      <motion.div whileHover={{ scale: 1.005 }} whileTap={{ scale: 0.99 }}>
                        <Button
                          type="submit"
                          disabled={submitting}
                          className="mt-1 h-11 w-full rounded-full bg-brand-primary text-sm font-bold text-white shadow-lg shadow-brand-primary/30 transition-all hover:bg-brand-primary-deep hover:shadow-xl hover:shadow-brand-primary-deep/35"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="me-2 h-4 w-4 animate-spin shrink-0" />
                              {t('m.demo.submitting')}
                            </>
                          ) : (
                            <>
                              {t('m.demo.submit')}
                              <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180 shrink-0" />
                            </>
                          )}
                        </Button>
                      </motion.div>

                      <p className="text-center text-[11px] font-medium text-brand-ink-hint break-words">
                        {t('m.demo.privacy')}
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
                    <div className="mx-auto flex min-w-0 h-14 w-14 items-center justify-center rounded-full bg-brand-success/15">
                      <CheckCircle2 className="h-7 w-7 text-brand-success shrink-0" />
                    </div>
                    <h2 className="mt-5 text-lg font-black tracking-tight text-brand-ink break-words">
                      {t('m.demo.success.titlePrefix')}, {form.name.split(' ')[0] || t('m.demo.success.fallbackName')} ✓
                    </h2>
                    <p className="mt-2 max-w-sm mx-auto text-sm font-medium leading-relaxed text-brand-ink-muted break-words">
                      {t('m.demo.success.bodyA')} {form.hotelName || t('m.demo.success.fallbackHotel')}.
                    </p>
                    <Button
                      onClick={() => {
                        setSubmitted(false);
                        setForm({ hotelName: '', name: '', email: '', phone: '', rooms: '', role: '', notes: '' });
                      }}
                      variant="ghost"
                      className="mt-6 h-10 rounded-full border border-brand-surface-border px-5 text-sm font-bold text-brand-ink hover:bg-brand-surface-light hover:text-brand-ink"
                    >
                      {t('m.demo.success.another')}
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
      <Label htmlFor={id} className="text-sm font-bold text-brand-ink">
        {Icon && <Icon className="me-1.5 inline h-3.5 w-3.5 shrink-0" />}
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
        className="h-11 rounded-xl border border-brand-surface-border bg-white px-3.5 text-sm transition-all duration-200 focus-visible:border-brand-primary focus-visible:ring-brand-primary-tint"
      />
    </div>
  );
}
