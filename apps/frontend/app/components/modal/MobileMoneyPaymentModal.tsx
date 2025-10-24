"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePayment } from '../../context/PaymentContext';
import { X, Phone, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

interface MobileMoneyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    id: number;
    title: string;
    artist: string;
    price: number;
    currency: string;
  };
}

export const MobileMoneyPaymentModal: React.FC<MobileMoneyPaymentModalProps> = ({
  isOpen,
  onClose,
  media,
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

  const validatePhoneNumber = (phone: string): boolean => {
    // Zambian MTN number validation
    const cleaned = phone.replace(/\s/g, '');
    const regex = /^(260|0)?(96|97|76|77)\d{7}$/;
    return regex.test(cleaned);
  };

  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\s/g, '');

    // Remove leading 0 if present and ensure 260 prefix
    if (cleaned.startsWith('0')) {
      cleaned = '260' + cleaned.substring(1);
    } else if (!cleaned.startsWith('260')) {
      cleaned = '260' + cleaned;
    }

    return cleaned;
  };

  // Move pollPaymentStatus OUTSIDE handleSubmit so it is declared before use
  const pollPaymentStatus = async (txId: number) => {
    console.debug("Polling payment status for transaction:", txId);
    const maxAttempts = 30; // 2.5 minutes max
    let attempts = 0;

    const poll = async () => {
      try {
        // You would implement the actual status check here
        // For now, we'll simulate a successful payment after 10 seconds
        if (attempts >= 3) { // Simulate success after 3 attempts (30 seconds)
          setStep('success');
          return;
        }

        attempts++;

        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Check every 10 seconds
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

        // Start polling for payment status
        await pollPaymentStatus(result.transactionId);
      } else {
        throw new Error('Invalid response from payment service');
      }
    } catch (error) {
      setStep('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Payment initiation failed. Please try again.'
      );
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

  // --- RETURN JSX ---
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-gradient-to-br from-[#0a1f29] to-[#0a3747] rounded-2xl p-6 w-full max-w-md border border-[#0a4a5f] shadow-xl"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#e51f48]" />
                  Mobile Money Payment
                </h2>
                <p className="text-sm text-gray-400 mt-1">
                  Complete purchase with MTN Mobile Money
                </p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-[#0a3747]"
                disabled={isProcessing && step === 'processing'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Info */}
            <div className="mb-6 p-4 bg-[#0a3747]/50 rounded-xl border border-[#0a4a5f]">
              <h3 className="font-semibold text-white truncate">{media.title}</h3>
              <p className="text-gray-400 text-sm truncate">{media.artist}</p>
              <div className="mt-2 flex justify-between items-center">
                <span className="text-2xl font-bold text-[#e51f48]">
                  {media.currency} {media.price.toFixed(2)}
                </span>
                <div className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  Secure Payment
                </div>
              </div>
            </div>

            {/* Form Step */}
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    MTN Mobile Money Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="0961234567"
                      className="w-full px-4 py-3 bg-[#0a3747] border border-[#0a4a5f] rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e51f48] focus:border-transparent transition-all"
                      disabled={isProcessing}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#e51f48] text-white rounded text-xs">
                        <Phone className="w-3 h-3" />
                        ZM
                      </div>
                    </div>
                  </div>
                  {errorMessage && (
                    <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {errorMessage}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Enter your MTN Zambia number. You&apos;ll receive a USSD prompt to complete payment.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-[#0a3747] transition-colors"
                    disabled={isProcessing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !phoneNumber.trim()}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-[#e51f48] to-[#ff4d6d] text-white rounded-xl hover:from-[#ff4d6d] hover:to-[#e51f48] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                  >
                    {isProcessing ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </form>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <div className="text-center py-8 space-y-4">
                <div className="w-20 h-20 border-4 border-[#e51f48] border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Processing Payment
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Please check your phone for a USSD prompt...
                  </p>
                  <div className="space-y-2 text-sm text-gray-400">
                    <p>1. Enter your Mobile Money PIN when prompted</p>
                    <p>2. Confirm the transaction amount</p>
                    <p>3. Wait for payment confirmation</p>
                  </div>
                </div>
                <div className="pt-4">
                  <p className="text-xs text-gray-500">
                    Transaction ID: {transactionId}
                  </p>
                </div>
              </div>
            )}

            {/* Success Step */}
            {step === 'success' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Payment Successful!
                  </h3>
                  <p className="text-gray-400">
                    Your purchase of <span className="text-white font-medium">&apos;{media.title}&apos;</span> has been completed.
                  </p>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <p className="text-green-400 text-sm">
                    The song has been added to your library. You can now download and stream it anytime.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] transition-colors font-semibold"
                >
                  Start Listening
                </button>
              </div>
            )}

            {/* Error Step */}
            {step === 'error' && (
              <div className="text-center py-6 space-y-4">
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-2">
                    Payment Failed
                  </h3>
                  <p className="text-gray-400 mb-4">{errorMessage}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 border border-gray-600 text-gray-300 rounded-xl hover:bg-[#0a3747] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('form')}
                    className="flex-1 px-4 py-3 bg-[#e51f48] text-white rounded-xl hover:bg-[#ff4d6d] transition-colors font-semibold"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};