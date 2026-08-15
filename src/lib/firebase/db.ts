import {
  doc,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./config";
import * as paths from "@/lib/db/paths";
import type {
  Period,
  FixedExpenseDef,
  FixedExpenseInstance,
  Envelope,
  Transaction,
  TransferTask,
  UserSettings,
} from "@/domain/types";
import {
  encryptPeriod,
  decryptPeriod,
  encryptFixedExpenseDef,
  decryptFixedExpenseDef,
  encryptFixedExpenseInstance,
  decryptFixedExpenseInstance,
  encryptEnvelope,
  decryptEnvelope,
  encryptTransaction,
  decryptTransaction,
  encryptTransferTask,
  decryptTransferTask,
  encryptSettings,
  decryptSettings,
} from "@/lib/crypto/encrypt-fields";
import { isEncryptionReady } from "@/lib/crypto/key-store";

// ─── Generic helpers ─────────────────────────────────────────────────────────

function docRef(path: string) {
  return doc(db(), path);
}

function collRef(path: string) {
  return collection(db(), path);
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function getSettings(budgetId: string): Promise<UserSettings | null> {
  const snap = await getDoc(docRef(paths.settingsPath(budgetId)));
  if (!snap.exists()) return null;
  const data = snap.data() as UserSettings;
  // Don't decrypt settings during getSettings - it's called before key is ready
  // Only pinHash is encrypted, and it's compared as encrypted value
  return data;
}

export async function saveSettings(budgetId: string, settings: UserSettings): Promise<void> {
  const encrypted = isEncryptionReady()
    ? await encryptSettings(settings as unknown as Record<string, unknown>)
    : settings;
  await setDoc(docRef(paths.settingsPath(budgetId)), encrypted);
}

export async function updateSettings(
  budgetId: string,
  updates: Partial<UserSettings>
): Promise<void> {
  await updateDoc(docRef(paths.settingsPath(budgetId)), updates as DocumentData);
}

export function subscribeSettings(
  budgetId: string,
  callback: (settings: UserSettings | null) => void
): Unsubscribe {
  return onSnapshot(docRef(paths.settingsPath(budgetId)), async (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    const data = snap.data() as UserSettings;
    if (isEncryptionReady()) {
      const decrypted = await decryptSettings(data as unknown as Record<string, unknown>);
      callback(decrypted as unknown as UserSettings);
    } else {
      callback(data);
    }
  });
}

// ─── Periods ─────────────────────────────────────────────────────────────────

export async function savePeriod(budgetId: string, period: Period): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptPeriod(period as unknown as Record<string, unknown>)
    : period;
  await setDoc(docRef(paths.periodDoc(budgetId, period.id)), data);
}

export async function updatePeriod(
  budgetId: string,
  periodId: string,
  updates: Partial<Period>
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptPeriod(updates as unknown as Record<string, unknown>)
    : updates;
  await updateDoc(docRef(paths.periodDoc(budgetId, periodId)), data as DocumentData);
}

export function subscribePeriods(
  budgetId: string,
  callback: (periods: Period[]) => void
): Unsubscribe {
  const q = query(collRef(paths.periodsCollection(budgetId)));
  return onSnapshot(q, async (snap) => {
    const periods = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Period);
    if (isEncryptionReady()) {
      const decrypted = await Promise.all(
        periods.map((p) => decryptPeriod(p as unknown as Record<string, unknown>))
      );
      callback(decrypted as unknown as Period[]);
    } else {
      callback(periods);
    }
  });
}

// ─── Fixed Expense Defs ──────────────────────────────────────────────────────

export async function saveFixedExpenseDef(
  budgetId: string,
  def: FixedExpenseDef
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptFixedExpenseDef(def as unknown as Record<string, unknown>)
    : def;
  await setDoc(docRef(paths.fixedExpenseDefDoc(budgetId, def.id)), data);
}

export async function updateFixedExpenseDef(
  budgetId: string,
  defId: string,
  updates: Partial<FixedExpenseDef>
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptFixedExpenseDef(updates as unknown as Record<string, unknown>)
    : updates;
  await updateDoc(
    docRef(paths.fixedExpenseDefDoc(budgetId, defId)),
    data as DocumentData
  );
}

export async function deleteFixedExpenseDef(
  budgetId: string,
  defId: string
): Promise<void> {
  await deleteDoc(docRef(paths.fixedExpenseDefDoc(budgetId, defId)));
}

export async function saveFixedExpenseDefs(
  budgetId: string,
  defs: FixedExpenseDef[]
): Promise<void> {
  const batch = writeBatch(db());
  for (const def of defs) {
    const data = isEncryptionReady()
      ? await encryptFixedExpenseDef(def as unknown as Record<string, unknown>)
      : def;
    batch.set(docRef(paths.fixedExpenseDefDoc(budgetId, def.id)), data as DocumentData);
  }
  await batch.commit();
}

export function subscribeFixedExpenseDefs(
  budgetId: string,
  callback: (defs: FixedExpenseDef[]) => void
): Unsubscribe {
  const q = query(
    collRef(paths.fixedExpenseDefsCollection(budgetId)),
    orderBy("order")
  );
  return onSnapshot(q, async (snap) => {
    const defs = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as FixedExpenseDef);
    if (isEncryptionReady()) {
      const decrypted = await Promise.all(
        defs.map((d) => decryptFixedExpenseDef(d as unknown as Record<string, unknown>))
      );
      callback(decrypted as unknown as FixedExpenseDef[]);
    } else {
      callback(defs);
    }
  });
}

// ─── Fixed Expense Instances ─────────────────────────────────────────────────

export async function saveFixedExpenseInstance(
  budgetId: string,
  instance: FixedExpenseInstance
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptFixedExpenseInstance(instance as unknown as Record<string, unknown>)
    : instance;
  await setDoc(
    docRef(paths.fixedExpenseInstanceDoc(budgetId, instance.id)),
    data as DocumentData
  );
}

export async function saveFixedExpenseInstances(
  budgetId: string,
  instances: FixedExpenseInstance[]
): Promise<void> {
  const batch = writeBatch(db());
  for (const inst of instances) {
    const data = isEncryptionReady()
      ? await encryptFixedExpenseInstance(inst as unknown as Record<string, unknown>)
      : inst;
    batch.set(
      docRef(paths.fixedExpenseInstanceDoc(budgetId, inst.id)),
      data as DocumentData
    );
  }
  await batch.commit();
}

export async function updateFixedExpenseInstance(
  budgetId: string,
  instanceId: string,
  updates: Partial<FixedExpenseInstance>
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptFixedExpenseInstance(updates as unknown as Record<string, unknown>)
    : updates;
  await updateDoc(
    docRef(paths.fixedExpenseInstanceDoc(budgetId, instanceId)),
    data as DocumentData
  );
}

export function subscribeFixedExpenseInstances(
  budgetId: string,
  periodId: string,
  callback: (instances: FixedExpenseInstance[]) => void
): Unsubscribe {
  const q = query(
    collRef(paths.fixedExpenseInstancesCollection(budgetId)),
    where("periodId", "==", periodId)
  );
  return onSnapshot(q, async (snap) => {
    const instances = snap.docs.map(
      (d) => ({ ...d.data(), id: d.id }) as FixedExpenseInstance
    );
    if (isEncryptionReady()) {
      const decrypted = await Promise.all(
        instances.map((i) =>
          decryptFixedExpenseInstance(i as unknown as Record<string, unknown>)
        )
      );
      callback(decrypted as unknown as FixedExpenseInstance[]);
    } else {
      callback(instances);
    }
  });
}

export function subscribeAllFixedExpenseInstances(
  budgetId: string,
  callback: (instances: FixedExpenseInstance[]) => void
): Unsubscribe {
  return onSnapshot(
    collRef(paths.fixedExpenseInstancesCollection(budgetId)),
    async (snap) => {
      const instances = snap.docs.map(
        (d) => ({ ...d.data(), id: d.id }) as FixedExpenseInstance
      );
      if (isEncryptionReady()) {
        const decrypted = await Promise.all(
          instances.map((i) =>
            decryptFixedExpenseInstance(i as unknown as Record<string, unknown>)
          )
        );
        callback(decrypted as unknown as FixedExpenseInstance[]);
      } else {
        callback(instances);
      }
    }
  );
}

// ─── Envelopes ───────────────────────────────────────────────────────────────

export async function saveEnvelope(
  budgetId: string,
  envelope: Envelope
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptEnvelope(envelope as unknown as Record<string, unknown>)
    : envelope;
  await setDoc(docRef(paths.envelopeDoc(budgetId, envelope.id)), data as DocumentData);
}

export async function saveEnvelopes(
  budgetId: string,
  envelopes: Envelope[]
): Promise<void> {
  const batch = writeBatch(db());
  for (const env of envelopes) {
    const data = isEncryptionReady()
      ? await encryptEnvelope(env as unknown as Record<string, unknown>)
      : env;
    batch.set(docRef(paths.envelopeDoc(budgetId, env.id)), data as DocumentData);
  }
  await batch.commit();
}

export async function updateEnvelope(
  budgetId: string,
  envelopeId: string,
  updates: Partial<Envelope>
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptEnvelope(updates as unknown as Record<string, unknown>)
    : updates;
  await updateDoc(
    docRef(paths.envelopeDoc(budgetId, envelopeId)),
    data as DocumentData
  );
}

export async function deleteEnvelope(
  budgetId: string,
  envelopeId: string
): Promise<void> {
  await deleteDoc(docRef(paths.envelopeDoc(budgetId, envelopeId)));
}

export function subscribeEnvelopes(
  budgetId: string,
  callback: (envelopes: Envelope[]) => void
): Unsubscribe {
  const q = query(
    collRef(paths.envelopesCollection(budgetId)),
    orderBy("order")
  );
  return onSnapshot(q, async (snap) => {
    const envelopes = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Envelope);
    if (isEncryptionReady()) {
      const decrypted = await Promise.all(
        envelopes.map((e) => decryptEnvelope(e as unknown as Record<string, unknown>))
      );
      callback(decrypted as unknown as Envelope[]);
    } else {
      callback(envelopes);
    }
  });
}

// ─── Transactions ────────────────────────────────────────────────────────────

export async function saveTransaction(
  budgetId: string,
  transaction: Transaction
): Promise<string> {
  const ref = transaction.id
    ? docRef(paths.transactionDoc(budgetId, transaction.id))
    : doc(collRef(paths.transactionsCollection(budgetId)));
  // Strip undefined values - Firestore rejects them
  const raw: Record<string, unknown> = { ...transaction, id: ref.id };
  for (const key of Object.keys(raw)) {
    if (raw[key] === undefined) delete raw[key];
  }
  const data = isEncryptionReady()
    ? await encryptTransaction(raw)
    : raw;
  await setDoc(ref, data);
  return ref.id;
}

export async function updateTransaction(
  budgetId: string,
  transactionId: string,
  updates: Partial<Transaction>
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptTransaction(updates as unknown as Record<string, unknown>)
    : updates;
  await updateDoc(
    docRef(paths.transactionDoc(budgetId, transactionId)),
    data as DocumentData
  );
}

export async function deleteTransaction(
  budgetId: string,
  transactionId: string
): Promise<void> {
  await deleteDoc(docRef(paths.transactionDoc(budgetId, transactionId)));
}

export function subscribeTransactions(
  budgetId: string,
  periodId: string,
  callback: (transactions: Transaction[]) => void
): Unsubscribe {
  const q = query(
    collRef(paths.transactionsCollection(budgetId)),
    where("periodId", "==", periodId),
    orderBy("date", "desc")
  );
  return onSnapshot(q, async (snap) => {
    const txs = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Transaction);
    if (isEncryptionReady()) {
      const decrypted = await Promise.all(
        txs.map((t) => decryptTransaction(t as unknown as Record<string, unknown>))
      );
      callback(decrypted as unknown as Transaction[]);
    } else {
      callback(txs);
    }
  });
}

export function subscribeAllTransactions(
  budgetId: string,
  callback: (transactions: Transaction[]) => void
): Unsubscribe {
  const q = query(
    collRef(paths.transactionsCollection(budgetId)),
    orderBy("date", "desc")
  );
  return onSnapshot(q, async (snap) => {
    const txs = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Transaction);
    if (isEncryptionReady()) {
      const decrypted = await Promise.all(
        txs.map((t) => decryptTransaction(t as unknown as Record<string, unknown>))
      );
      callback(decrypted as unknown as Transaction[]);
    } else {
      callback(txs);
    }
  });
}

export function subscribeEnvelopeTransactions(
  budgetId: string,
  envelopeId: string,
  callback: (transactions: Transaction[]) => void
): Unsubscribe {
  const q = query(
    collRef(paths.transactionsCollection(budgetId)),
    where("envelopeId", "==", envelopeId),
    orderBy("date", "desc")
  );
  return onSnapshot(q, async (snap) => {
    const txs = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Transaction);
    if (isEncryptionReady()) {
      const decrypted = await Promise.all(
        txs.map((t) => decryptTransaction(t as unknown as Record<string, unknown>))
      );
      callback(decrypted as unknown as Transaction[]);
    } else {
      callback(txs);
    }
  });
}

// ─── Transfer Tasks ──────────────────────────────────────────────────────────

export async function saveTransferTask(
  budgetId: string,
  task: TransferTask
): Promise<string> {
  const ref = task.id
    ? docRef(paths.transferTaskDoc(budgetId, task.id))
    : doc(collRef(paths.transferTasksCollection(budgetId)));
  const raw = { ...task, id: ref.id };
  const data = isEncryptionReady()
    ? await encryptTransferTask(raw as unknown as Record<string, unknown>)
    : raw;
  await setDoc(ref, data as DocumentData);
  return ref.id;
}

export async function updateTransferTask(
  budgetId: string,
  taskId: string,
  updates: Partial<TransferTask>
): Promise<void> {
  const data = isEncryptionReady()
    ? await encryptTransferTask(updates as unknown as Record<string, unknown>)
    : updates;
  await updateDoc(
    docRef(paths.transferTaskDoc(budgetId, taskId)),
    data as DocumentData
  );
}

export function subscribeTransferTasks(
  budgetId: string,
  callback: (tasks: TransferTask[]) => void
): Unsubscribe {
  const q = query(
    collRef(paths.transferTasksCollection(budgetId)),
    where("isDone", "==", false)
  );
  return onSnapshot(q, async (snap) => {
    const tasks = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as TransferTask);
    if (isEncryptionReady()) {
      const decrypted = await Promise.all(
        tasks.map((t) => decryptTransferTask(t as unknown as Record<string, unknown>))
      );
      callback(decrypted as unknown as TransferTask[]);
    } else {
      callback(tasks);
    }
  });
}

// ─── Batch: onboarding setup ─────────────────────────────────────────────────

export async function initializeUserData(
  budgetId: string,
  settings: UserSettings,
  period: Period,
  fixedExpenseDefs: FixedExpenseDef[],
  fixedExpenseInstances: FixedExpenseInstance[],
  envelopes: Envelope[]
): Promise<void> {
  const batch = writeBatch(db());
  const ready = isEncryptionReady();

  const encSettings = ready
    ? await encryptSettings(settings as unknown as Record<string, unknown>)
    : settings;
  batch.set(docRef(paths.settingsPath(budgetId)), encSettings as DocumentData);

  const encPeriod = ready
    ? await encryptPeriod(period as unknown as Record<string, unknown>)
    : period;
  batch.set(docRef(paths.periodDoc(budgetId, period.id)), encPeriod as DocumentData);

  for (const def of fixedExpenseDefs) {
    const enc = ready
      ? await encryptFixedExpenseDef(def as unknown as Record<string, unknown>)
      : def;
    batch.set(docRef(paths.fixedExpenseDefDoc(budgetId, def.id)), enc as DocumentData);
  }
  for (const inst of fixedExpenseInstances) {
    const enc = ready
      ? await encryptFixedExpenseInstance(inst as unknown as Record<string, unknown>)
      : inst;
    batch.set(docRef(paths.fixedExpenseInstanceDoc(budgetId, inst.id)), enc as DocumentData);
  }
  for (const env of envelopes) {
    const enc = ready
      ? await encryptEnvelope(env as unknown as Record<string, unknown>)
      : env;
    batch.set(docRef(paths.envelopeDoc(budgetId, env.id)), enc as DocumentData);
  }

  await batch.commit();
}
