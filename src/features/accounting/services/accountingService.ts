import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
import type { JournalEntry, JournalItem, Account, Journal } from "../types";

const ACCOUNTS_COLLECTION = "accounts";
const JOURNALS_COLLECTION = "journals";
const ENTRIES_COLLECTION = "journal_entries";
const ITEMS_COLLECTION = "journal_items";

export const accountingService = {
  // Accounts
  async getAccounts(): Promise<Account[]> {
    const q = query(collection(db, ACCOUNTS_COLLECTION), orderBy("code", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Account));
  },

  async createAccount(accountData: Omit<Account, "id" | "createdAt" | "updatedAt" | "currentBalance">): Promise<string> {
    const batch = writeBatch(db);
    const newDocRef = doc(collection(db, ACCOUNTS_COLLECTION));
    batch.set(newDocRef, {
      ...accountData,
      currentBalance: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
    return newDocRef.id;
  },

  // Journals
  async getJournals(): Promise<Journal[]> {
    const q = query(collection(db, JOURNALS_COLLECTION), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Journal));
  },

  async createJournal(journalData: Omit<Journal, "id" | "createdAt">): Promise<string> {
    const batch = writeBatch(db);
    const newDocRef = doc(collection(db, JOURNALS_COLLECTION));
    batch.set(newDocRef, {
      ...journalData,
      createdAt: serverTimestamp(),
    });
    await batch.commit();
    return newDocRef.id;
  },

  // Journal Entries (Double Entry Logic)
  async postJournalEntry(
    entryData: Omit<JournalEntry, "id" | "createdAt" | "updatedAt" | "totalDebit" | "totalCredit">,
    itemsData: Omit<JournalItem, "id" | "entryId">[]
  ): Promise<string> {
    if (itemsData.length < 2) {
      throw new Error("A journal entry must have at least two items.");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const item of itemsData) {
      totalDebit += item.debit || 0;
      totalCredit += item.credit || 0;
    }

    // Rounding to avoid floating point issues
    totalDebit = Math.round(totalDebit * 100) / 100;
    totalCredit = Math.round(totalCredit * 100) / 100;

    if (totalDebit !== totalCredit) {
      throw new Error(`Double-entry validation failed: Debits (${totalDebit}) do not equal Credits (${totalCredit}).`);
    }

    if (totalDebit <= 0) {
      throw new Error("Journal entry must have an amount greater than 0.");
    }

    const batch = writeBatch(db);
    const entryRef = doc(collection(db, ENTRIES_COLLECTION));

    // Write the main entry
    batch.set(entryRef, {
      ...entryData,
      totalDebit,
      totalCredit,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Write the items
    itemsData.forEach(item => {
      const itemRef = doc(collection(db, ITEMS_COLLECTION));
      batch.set(itemRef, {
        ...item,
        entryId: entryRef.id,
      });
      // Future Enhancement: We should also update the Account's currentBalance here
      // This is often done via Cloud Functions reacting to journal_items, or via a transaction here
      // For a robust system, Cloud Functions are preferred to avoid client-side manipulation issues.
    });

    await batch.commit();
    return entryRef.id;
  }
};
