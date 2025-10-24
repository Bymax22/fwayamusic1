"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PaymentTransactionResponse {
  transactionId: number;
  status: string;
  [key: string]: unknown; // Extend as needed
}

interface PaymentStatusResponse {
  transactionId: number;
  status: string;
  [key: string]: unknown; // Extend as needed
}

interface PaymentContextType {
  initiateMobileMoneyPayment: (
    mediaId: number,
    phoneNumber: string,
    amount: number,
    currency?: string
  ) => Promise<PaymentTransactionResponse>;
  checkPaymentStatus: (transactionId: number) => Promise<PaymentStatusResponse>;
  isProcessing: boolean;
}

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
};

interface PaymentProviderProps {
  children: ReactNode;
}

export const PaymentProvider: React.FC<PaymentProviderProps> = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const initiateMobileMoneyPayment = async (
    mediaId: number,
    phoneNumber: string,
    amount: number,
    currency: string = 'ZMW'
  ): Promise<PaymentTransactionResponse> => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:3001/api/v1/payment/transaction', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mediaId,
          amount,
          currency,
          paymentMethod: 'MOBILE_MONEY',
          paymentProvider: 'MTN_MONEY',
          deviceInfo: {
            deviceId: localStorage.getItem('deviceId') || 'web-browser',
            deviceName: 'Web Browser',
            deviceType: 'desktop',
            os: navigator.platform,
            fingerprint: localStorage.getItem('deviceId') || 'web-browser'
          },
          providerData: {
            phoneNumber: phoneNumber
          }
        }),
      });

      if (!response.ok) {
        const errorData: { message?: string } = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Payment initiation failed');
      }

      const data: PaymentTransactionResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const checkPaymentStatus = async (
    transactionId: number
  ): Promise<PaymentStatusResponse> => {
    try {
      const response = await fetch(`http://localhost:3001/api/v1/payment/transaction/${transactionId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      const data: PaymentStatusResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Payment status check error:', error);
      throw error;
    }
  };

  const value: PaymentContextType = {
    initiateMobileMoneyPayment,
    checkPaymentStatus,
    isProcessing,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};