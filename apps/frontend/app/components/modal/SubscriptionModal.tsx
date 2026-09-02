"use client";

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Crown, LoaderCircle, Phone, Shield, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePayment } from '@/context/PaymentContext';

type Plan = { id: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'; name: string; price: number; duration: string; description: string };

const PLANS: Plan[] = [
  { id: 'DAILY', name: 'Daily', price: 5, duration: '24 hours', description: 'A quick premium pass' },
  { id: 'WEEKLY', name: 'Weekly', price: 20, duration: '7 days', description: 'Premium for the week' },
  { id: 'MONTHLY', name: 'Monthly', price: 50, duration: '30 days', description: 'Best for regular listeners' },
  { id: 'YEARLY', name: 'Yearly', price: 500, duration: '365 days', description: 'The best annual value' },
];

interface SubscriptionModalProps { isOpen: boolean; onClose: () => void; onSuccess?: () => void; }

export default function SubscriptionModal({ isOpen, onClose, onSuccess }: SubscriptionModalProps) {
  const { user, refreshUser } = useAuth();
  const { initiateSubscriptionPayment, processMobileMoneyPayment, isProcessing } = usePayment();
  const [selectedPlan, setSelectedPlan] = useState<Plan>(PLANS[2]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setStep('form'); setPhoneNumber(''); setError(''); }
  }, [isOpen]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalized = phoneNumber.replace(/\s/g, '');
    if (!/^(260|0)?(96|97|76|77)\d{7}$/.test(normalized)) {
      setError('Enter a valid Zambian MTN number, for example 0961234567.');
      return;
    }
    if (!user?.id) { setError('Please sign in before subscribing.'); return; }
    setStep('processing'); setError('');
    try {
      const phone = normalized.startsWith('0') ? `260${normalized.slice(1)}` : normalized.startsWith('260') ? normalized : `260${normalized}`;
      const transaction = await initiateSubscriptionPayment(user.id, selectedPlan.id, phone, selectedPlan.price);
      await processMobileMoneyPayment(transaction.transactionId, phone);
      await refreshUser();
      setStep('success');
      onSuccess?.();
    } catch (caught) {
      setStep('error');
      setError(caught instanceof Error ? caught.message : 'Payment failed. Please try again.');
    }
  };

  return <AnimatePresence>{isOpen && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
    <motion.div initial={{ opacity: 0, y: 20, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20 }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#11111c] p-5 text-white shadow-2xl sm:p-7">
      <div className="flex items-start justify-between"><div><div className="mb-2 flex items-center gap-2 text-purple-300"><Crown size={18} /><span className="text-sm font-semibold uppercase tracking-widest">Fwaya Premium</span></div><h2 className="text-2xl font-bold">Choose your listening plan</h2><p className="mt-1 text-sm text-white/60">Unlock premium listening with secure MTN Mobile Money.</p></div><button onClick={onClose} aria-label="Close subscription modal" className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"><X size={20} /></button></div>
      {step === 'success' ? <div className="py-12 text-center"><Check className="mx-auto mb-4 rounded-full bg-emerald-500/20 p-3 text-emerald-400" size={64} /><h3 className="text-xl font-bold">Subscription active</h3><p className="mt-2 text-white/60">Your {selectedPlan.name.toLowerCase()} plan is ready. Enjoy Fwaya Premium.</p><button onClick={onClose} className="mt-6 rounded-full bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500">Start listening</button></div> : <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">{PLANS.map(plan => <button type="button" key={plan.id} onClick={() => setSelectedPlan(plan)} className={`rounded-2xl border p-4 text-left transition ${selectedPlan.id === plan.id ? 'border-purple-400 bg-purple-500/15' : 'border-white/10 bg-white/[.03] hover:border-white/25'}`}><div className="flex items-center justify-between"><span className="font-semibold">{plan.name}</span><span className="font-bold text-purple-300">ZMW {plan.price}</span></div><p className="mt-1 text-sm text-white/60">{plan.description}</p><p className="mt-3 text-xs text-white/40">{plan.duration}</p></button>)}</div>
        <label className="block"><span className="mb-2 block text-sm font-medium">MTN Mobile Money number</span><div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-4"><Phone size={18} className="text-purple-300" /><input value={phoneNumber} onChange={event => setPhoneNumber(event.target.value)} placeholder="096 123 4567" className="w-full bg-transparent py-3 outline-none" inputMode="tel" disabled={step === 'processing'} /></div></label>
        {error && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
        <div className="flex items-center gap-2 text-xs text-white/50"><Shield size={15} /> You will receive a USSD prompt on your phone.</div>
        <button type="submit" disabled={isProcessing || step === 'processing'} className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 font-semibold hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60">{step === 'processing' ? <><LoaderCircle className="animate-spin" size={18} /> Processing payment...</> : `Pay ZMW ${selectedPlan.price} and subscribe`}</button>
        {step === 'error' && <button type="button" onClick={() => setStep('form')} className="w-full text-sm text-white/60 hover:text-white">Try again</button>}
      </form>}
    </motion.div>
  </div>}</AnimatePresence>;
}