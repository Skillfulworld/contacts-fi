"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { MOCK_CONTACTS, ALL_TRANSACTIONS } from '@/lib/mockData';

const ContactContext = createContext<any>(null);

export const ContactProvider = ({ children }: { children: React.ReactNode }) => {
  const [contacts, setContacts] = useState(MOCK_CONTACTS);
  const [transactions, setTransactions] = useState(ALL_TRANSACTIONS);
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const updateContact = (id: string, updates: any) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    addToast('Contact updated');
  };

  const addContact = (contact: any) => {
    const newContact = {
      ...contact,
      id: Math.random().toString(36).substr(2, 9),
      initials: contact.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
      wallets: [],
      health: ['Fresh Wallet'],
      transactions: []
    };
    setContacts((prev) => [...prev, newContact]);
    addToast('Contact added');
    return newContact.id;
  };

  const deleteContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
    addToast('Contact deleted', 'info');
  };

  const addWallet = (contactId: string, wallet: any) => {
    setContacts((prev) => prev.map((c) => {
      if (c.id === contactId) {
        const newWallet = { ...wallet, id: Math.random().toString(36).substr(2, 9) };
        const updatedWallets = wallet.isDefault 
          ? c.wallets.map((w: any) => ({ ...w, isDefault: false })).concat(newWallet)
          : c.wallets.concat(newWallet);
        return { ...c, wallets: updatedWallets, defaultProvider: wallet.isDefault ? wallet.provider : c.defaultProvider };
      }
      return c;
    }));
    addToast('Wallet added');
  };

  return (
    <ContactContext.Provider value={{ 
      contacts, 
      transactions, 
      toasts, 
      addToast, 
      updateContact, 
      addContact, 
      deleteContact, 
      addWallet 
    }}>
      {children}
      {/* Toast Overlay */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-xs">
        {toasts.map((t) => (
          <div key={t.id} className={`p-4 rounded-2xl shadow-lg text-white text-sm font-medium animate-bounce-in ${t.type === 'success' ? 'bg-green-600' : 'bg-blue-600'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ContactContext.Provider>
  );
};

export const useContacts = () => useContext(ContactContext);
