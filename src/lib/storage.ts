import { MOCK_CONTACTS, ALL_TRANSACTIONS } from '@/lib/mockData';

const STORAGE_VERSION_KEY = 'contactsfi_storage_version';
const STORAGE_VERSION = 1;
const CONTACTS_KEY = 'contactsfi_contacts';
const TRANSACTIONS_KEY = 'contactsfi_transactions';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const writeJSON = (key: string, value: unknown) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Failed to write ${key} to localStorage`, error);
  }
};

const readJSON = <T>(key: string, fallback: T): T => {
  if (!isBrowser()) return fallback;

  try {
    const storedValue = window.localStorage.getItem(key);
    if (storedValue === null) return fallback;

    const parsedValue = JSON.parse(storedValue) as T;
    return parsedValue;
  } catch (error) {
    console.warn(`Failed to parse ${key} from localStorage`, error);
    return fallback;
  }
};

const setStorageVersion = () => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(STORAGE_VERSION_KEY, String(STORAGE_VERSION));
  } catch (error) {
    console.warn('Failed to write storage version', error);
  }
};

const getStoredVersion = (): number => {
  if (!isBrowser()) return 0;

  try {
    const currentVersion = window.localStorage.getItem(STORAGE_VERSION_KEY);
    return currentVersion ? Number(currentVersion) : 0;
  } catch (error) {
    console.warn('Failed to read storage version', error);
    return 0;
  }
};

export const loadContacts = () => {
  if (!isBrowser()) return MOCK_CONTACTS;

  const storedContacts = readJSON<any[] | null>(CONTACTS_KEY, null);
  const hasStoredContacts = Array.isArray(storedContacts) && storedContacts.length > 0;
  if (hasStoredContacts) {
    if (getStoredVersion() !== STORAGE_VERSION) {
      setStorageVersion();
    }
    return storedContacts;
  }

  const seededContacts = MOCK_CONTACTS;
  saveContacts(seededContacts);
  return seededContacts;
};

export const saveContacts = (contacts: any[]) => {
  if (!isBrowser()) return;

  writeJSON(CONTACTS_KEY, contacts);
  setStorageVersion();
};

export const loadTransactions = () => {
  if (!isBrowser()) return ALL_TRANSACTIONS;

  const storedTransactions = readJSON<any[] | null>(TRANSACTIONS_KEY, null);
  const hasStoredTransactions = Array.isArray(storedTransactions) && storedTransactions.length > 0;
  if (hasStoredTransactions) {
    if (getStoredVersion() !== STORAGE_VERSION) {
      setStorageVersion();
    }
    return storedTransactions;
  }

  const seededTransactions = ALL_TRANSACTIONS;
  saveTransactions(seededTransactions);
  return seededTransactions;
};

export const saveTransactions = (transactions: any[]) => {
  if (!isBrowser()) return;

  writeJSON(TRANSACTIONS_KEY, transactions);
  setStorageVersion();
};
