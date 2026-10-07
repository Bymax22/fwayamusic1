"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '../../context/PaymentContext';
import { X, Phone, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MobileMoneyPaymentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: number;
    title: string;
    artist: string;
    price: number;
    currency: string;
  };
  onSuccess?: () => void;
}

export const MobileMoneyPaymentPreviewModal: React.FC<MobileMoneyPaymentPreviewModalProps> = ({
  isOpen,
  onClose,
  media,
  onSuccess,
}) => {
  const { initiateMobileMoneyPayment, isProcessing } = usePayment();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [step, setStep] = useState<'form' | 'processing' | 'success' | 'error'>('form');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionId, setTransactionId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('form');
      setPhoneNumber('');
      setErrorMessage('');
      setTransactionId(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (step === 'success' && typeof onSuccess === 'function') {
      try {
        onSuccess();
      } catch (err) {
        console.warn('onSuccess handler threw', err);
      }
    }
  }, [step, onSuccess]);

  const validatePhoneNumber = (phone: string): boolean => {
    const cleaned = phone.replace(/\s/g, '');
    const regex = /^(260|0)?(96|97|76|77)\d{7}$/;
    return regex.test(cleaned);
  };

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '260' + cleaned.substring(1);
    } else if (!cleaned.startsWith('260')) {
      cleaned = '260' + cleaned;
    }
    return cleaned;
  };

  const pollPaymentStatus = async () => {
    const maxAttempts = 30;
    let attempts = 0;

    const poll = async () => {
      try {
        if (attempts >= 3) {
          setStep('success');
          return;
        }
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setStep('error');
          setErrorMessage('Payment timeout. Please check your phone and try again.');
        }
      } catch (error) {
        console.error('Polling error:', error);
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000);
        } else {
          setStep('error');
          setErrorMessage('Failed to verify payment status. Please contact support.');
        }
      }
    };

    poll();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setErrorMessage('Please enter your MTN Mobile Money number');
      return;
    }
    if (!validatePhoneNumber(phoneNumber)) {
      setErrorMessage('Please enter a valid Zambian MTN number (e.g., 0961234567)');
      return;
    }

    setStep('processing');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      const result = await initiateMobileMoneyPayment(
        media.id,
        formattedPhone,
        media.price,
        media.currency
      );

      if (result && result.transactionId) {
        setTransactionId(result.transactionId);
        pollPaymentStatus();
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error) {
      setStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment initiation failed. Please try again.');
      console.error('Payment error:', error);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('form');
      setPhoneNumber('');
      setErrorMessage('');
      setTransactionId(null);
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-background to-card rounded-2xl p-6 w-full max-w-md border border-card shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-card-foreground" />
                  Preview: Unlock Full Track
                </h2>
                <p className="text-sm text-white/60 mt-1">This is a 30s preview — purchase to continue listening.</p>
              </div>
              <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-card" disabled={isProcessing && step === 'processing'}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6 p-4 bg-card/50 rounded-xl border border-card">
              <h3 className="font-semibold text-white truncate">{media.title}</h3>
              <p className="text-white/60 text-sm truncate">{media.artist}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-2xl font-bold text-card-foreground">{media.currency} {media.price.toFixed(2)}</span>
                <div className="flex items-center gap-1 text-xs text-purple/60 bg-purple/10 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  Secure Payment
                </div>
              </div>
            </div>

            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">MTN Mobile Money Number</label>
                  <div className="relative">
                    <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0961234567" className="w-full px-4 py-3 bg-card border border-card rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all" disabled={isProcessing} />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-card text-white rounded text-xs">
                        <Phone className="w-3 h-3" />
                        ZM
                      </div>
                    </div>
                  </div>
                  {errorMessage && (
                    <p className="text-purple/60 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errorMessage}</p>
                  )}
                  <p className="text-xs text-white/60 mt-2">Enter your MTN Zambia number. You&apos;ll receive a USSD prompt to complete payment.</p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={handleClose} className="flex-1 px-4 py-3 border border-charcoal/50 text-white/90 rounded-xl hover:bg-card transition-colors" disabled={isProcessing}>Cancel</button>
                  <button type="submit" disabled={isProcessing || !phoneNumber.trim()} className="flex-1 px-4 py-3 bg-gradient-to-r from-card to-primary text-white rounded-xl hover:from-primary hover:to-card disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold">{isProcessing ? 'Processing...' : 'Pay Now'}</button>
                </div>
              </form>
            )}

            {step === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 border-4 border-card border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Processing Payment</h3>
                  <p className="text-white/60 mb-4">Please check your phone for a USSD prompt...</p>
                </div>
                <div className="pt-4"><p className="text-xs text-white/60">Transaction ID: {transactionId}</p></div>
              </div>
            )}

            {step === 'success' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 bg-purple/75 rounded-full flex items-center justify-center mx-auto"><CheckCircle2 className="w-10 h-10 text-white" /></div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Payment Successful!</h3>
                  <p className="text-white/60">Your purchase of <span className="text-white font-medium">&apos;{media.title}&apos;</span> has been completed.</p>
                </div>
                <div className="bg-purple/10 border border-purple/20 rounded-xl p-4">
                  <p className="text-purple/60 text-sm">The song has been added to your library. You can now download and stream it anytime.</p>
                </div>
                <button onClick={handleClose} className="w-full px-4 py-3 bg-card text-white rounded-xl hover:bg-primary transition-colors font-semibold">Start Listening</button>
              </div>
            )}

            {step === 'error' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 bg-purple/75 rounded-full flex items-center justify-center mx-auto"><AlertCircle className="w-10 h-10 text-white" /></div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">Payment Failed</h3>
                  <p className="text-white/60 mb-4">{errorMessage}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleClose} className="flex-1 px-4 py-3 border border-charcoal/50 text-white/90 rounded-xl hover:bg-card transition-colors">Cancel</button>
                  <button onClick={() => setStep('form')} className="flex-1 px-4 py-3 bg-card text-white rounded-xl hover:bg-primary transition-colors font-semibold">Try Again</button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
