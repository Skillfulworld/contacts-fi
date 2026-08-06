"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { loadContacts, saveContacts, loadTransactions, saveTransactions } from '@/lib/storage';

const ContactContext = createContext<any>(null);

export const ContactProvider = ({ children }: { children: React.ReactNode }) => {
  const [contacts, setContacts] = useState<any[]>(() => loadContacts());
  const [transactions, setTransactions] = useState<any[]>(() => loadTransactions());
  const [toasts, setToasts] = useState<any[]>([]);

  useEffect(() => {
    setContacts((prev) => {
      if (prev.length > 0) return prev;
      const seededContacts = loadContacts();
      return seededContacts;
    });
    setTransactions((prev) => {
      if (prev.length > 0) return prev;
      const seededTransactions = loadTransactions();
      return seededTransactions;
    });
  }, []);

  useEffect(() => {
    if (contacts.length > 0 || typeof window !== 'undefined') {
      saveContacts(contacts);
    }
  }, [contacts]);

  useEffect(() => {
    if (transactions.length > 0 || typeof window !== 'undefined') {
      saveTransactions(transactions);
    }
  }, [transactions]);

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

  const updateContactWallets = (contactId: string, updater: (contact: any) => any) => {
    setContacts((prev) => prev.map((contact) => {
      if (contact.id !== contactId) return contact;
      return updater(contact);
    }));
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

  const updateWallet = (contactId: string, walletId: string, updates: any) => {
    updateContactWallets(contactId, (contact) => {
      const nextWallets = contact.wallets.map((wallet: any) => {
        if (wallet.id !== walletId) return wallet;
        const nextWallet = { ...wallet, ...updates };
        return nextWallet;
      });
      const normalizedWallets = updates.isDefault
        ? nextWallets.map((wallet: any) => ({ ...wallet, isDefault: wallet.id === walletId }))
        : nextWallets;

      const nextDefaultProvider = updates.isDefault
        ? normalizedWallets.find((wallet: any) => wallet.id === walletId)?.provider || contact.defaultProvider
        : contact.defaultProvider;
      return {
        ...contact,
        wallets: normalizedWallets,
        defaultProvider: nextDefaultProvider,
      };
    });
    addToast('Wallet updated');
  };

  const deleteWallet = (contactId: string, walletId: string) => {
    updateContactWallets(contactId, (contact) => {
      const nextWallets = contact.wallets.filter((wallet: any) => wallet.id !== walletId);
      const nextDefaultProvider = nextWallets.length > 0 && contact.defaultProvider === contact.wallets.find((wallet: any) => wallet.id === walletId)?.provider
        ? nextWallets[0].provider
        : contact.defaultProvider;
      return {
        ...contact,
        wallets: nextWallets,
        defaultProvider: nextDefaultProvider,
      };
    });
    addToast('Wallet deleted', 'info');
  };

  const setDefaultWallet = (contactId: string, walletId: string) => {
    updateContactWallets(contactId, (contact) => {
      const nextWallets = contact.wallets.map((wallet: any) => ({
        ...wallet,
        isDefault: wallet.id === walletId,
      }));
      const selectedWallet = nextWallets.find((wallet: any) => wallet.id === walletId);
      return {
        ...contact,
        wallets: nextWallets,
        defaultProvider: selectedWallet?.provider || contact.defaultProvider,
      };
    });
    addToast('Default wallet updated');
  };

  const addTransaction = (transaction: any) => {
    const nextTransaction = {
      ...transaction,
      id: transaction.id || `tx-${Date.now()}`,
      date: transaction.date || 'Just now',
      status: transaction.status || 'Success',
    };

    setTransactions((prev) => [...prev, nextTransaction]);

    if (transaction.contactId) {
      setContacts((prev) => prev.map((contact) => {
        if (contact.id !== transaction.contactId) return contact;
        return {
          ...contact,
          transactions: [
            ...(contact.transactions || []),
            {
              ...nextTransaction,
              contact: contact.name,
              wallet: transaction.wallet || contact.defaultProvider,
            },
          ],
        };
      }));
    }
  };

  const resetTransactions = (nextTransactions: any[]) => {
    setTransactions(nextTransactions);
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
      addWallet, 
      updateWallet, 
      deleteWallet, 
      setDefaultWallet, 
      addTransaction, 
      resetTransactions 
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
