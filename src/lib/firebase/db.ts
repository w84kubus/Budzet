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
  return snap.data() as UserSettings;
}

export async function saveSettings(budgetId: string, settings: UserSettings): Promise<void> {
  await setDoc(docRef(paths.settingsPath(budgetId)), settings);
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
  return onSnapshot(docRef(paths.settingsPath(budgetId)), (snap) => {
    callback(snap.exists() ? (snap.data() as UserSettings) : null);
  });
}

// ─── Periods ─────────────────────────────────────────────────────────────────

export async function savePeriod(budgetId: string, period: Period): Promise<void> {
  await setDoc(docRef(paths.periodDoc(budgetId, period.id)), period);
}

export async function updatePeriod(
  budgetId: string,
  periodId: string,
  updates: Partial<Period>
): Promise<void> {
  await updateDoc(docRef(paths.periodDoc(budgetId, periodId)), updates as DocumentData);
}

export function subscribePeriods(
  budgetId: string,
  callback: (periods: Period[]) => void
): Unsubscribe {
  const q = query(collRef(paths.periodsCollection(budgetId)));
  return onSnapshot(q, (snap) => {
    const periods = snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Period);
    callback(periods);
  });
}

// ─── Fixed Expense Defs ──────────────────────────────────────────────────────

export async function saveFixedExpenseDef(
  budgetId: string,
  def: FixedExpenseDef
): Promise<void> {
  await setDoc(docRef(paths.fixedExpenseDefDoc(budgetId, def.id)), def);
}

export async function updateFixedExpenseDef(
  budgetId: string,
  defId: string,
  updates: Partial<FixedExpenseDef>
): Promise<void> {
  await updateDoc(
    docRef(paths.fixedExpenseDefDoc(budgetId, defId)),
    updates as DocumentData
  );
}

export async function saveFixedExpenseDefs(
  budgetId: string,
  defs: FixedExpenseDef[]
): Promise<void> {
  const batch = writeBatch(db());
  for (const def of defs) {
    batch.set(docRef(paths.fixedExpenseDefDoc(budgetId, def.id)), def);
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
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as FixedExpenseDef));
  });
}

// ─── Fixed Expense Instances ─────────────────────────────────────────────────

export async function saveFixedExpenseInstance(
  budgetId: string,
  instance: FixedExpenseInstance
): Promise<void> {
  await setDoc(
    docRef(paths.fixedExpenseInstanceDoc(budgetId, instance.id)),
    instance
  );
}

export async function saveFixedExpenseInstances(
  budgetId: string,
  instances: FixedExpenseInstance[]
): Promise<void> {
  const batch = writeBatch(db());
  for (const inst of instances) {
    batch.set(docRef(paths.fixedExpenseInstanceDoc(budgetId, inst.id)), inst);
  }
  await batch.commit();
}

export async function updateFixedExpenseInstance(
  budgetId: string,
  instanceId: string,
  updates: Partial<FixedExpenseInstance>
): Promise<void> {
  await updateDoc(
    docRef(paths.fixedExpenseInstanceDoc(budgetId, instanceId)),
    updates as DocumentData
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
  return onSnapshot(q, (snap) => {
    callback(
      snap.docs.map((d) => ({ ...d.data(), id: d.id }) as FixedExpenseInstance)
    );
  });
}

export function subscribeAllFixedExpenseInstances(
  budgetId: string,
  callback: (instances: FixedExpenseInstance[]) => void
): Unsubscribe {
  return onSnapshot(
    collRef(paths.fixedExpenseInstancesCollection(budgetId)),
    (snap) => {
      callback(
        snap.docs.map(
          (d) => ({ ...d.data(), id: d.id }) as FixedExpenseInstance
        )
      );
    }
  );
}

// ─── Envelopes ───────────────────────────────────────────────────────────────

export async function saveEnvelope(
  budgetId: string,
  envelope: Envelope
): Promise<void> {
  await setDoc(docRef(paths.envelopeDoc(budgetId, envelope.id)), envelope);
}

export async function saveEnvelopes(
  budgetId: string,
  envelopes: Envelope[]
): Promise<void> {
  const batch = writeBatch(db());
  for (const env of envelopes) {
    batch.set(docRef(paths.envelopeDoc(budgetId, env.id)), env);
  }
  await batch.commit();
}

export async function updateEnvelope(
  budgetId: string,
  envelopeId: string,
  updates: Partial<Envelope>
): Promise<void> {
  await updateDoc(
    docRef(paths.envelopeDoc(budgetId, envelopeId)),
    updates as DocumentData
  );
}

export function subscribeEnvelopes(
  budgetId: string,
  callback: (envelopes: Envelope[]) => void
): Unsubscribe {
  const q = query(
    collRef(paths.envelopesCollection(budgetId)),
    orderBy("order")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Envelope));
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
  await setDoc(ref, { ...transaction, id: ref.id });
  return ref.id;
}

export async function updateTransaction(
  budgetId: string,
  transactionId: string,
  updates: Partial<Transaction>
): Promise<void> {
  await updateDoc(
    docRef(paths.transactionDoc(budgetId, transactionId)),
    updates as DocumentData
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
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Transaction));
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
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Transaction));
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
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as Transaction));
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
  await setDoc(ref, { ...task, id: ref.id });
  return ref.id;
}

export async function updateTransferTask(
  budgetId: string,
  taskId: string,
  updates: Partial<TransferTask>
): Promise<void> {
  await updateDoc(
    docRef(paths.transferTaskDoc(budgetId, taskId)),
    updates as DocumentData
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
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as TransferTask));
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

  batch.set(docRef(paths.settingsPath(budgetId)), settings);
  batch.set(docRef(paths.periodDoc(budgetId, period.id)), period);

  for (const def of fixedExpenseDefs) {
    batch.set(docRef(paths.fixedExpenseDefDoc(budgetId, def.id)), def);
  }
  for (const inst of fixedExpenseInstances) {
    batch.set(docRef(paths.fixedExpenseInstanceDoc(budgetId, inst.id)), inst);
  }
  for (const env of envelopes) {
    batch.set(docRef(paths.envelopeDoc(budgetId, env.id)), env);
  }

  await batch.commit();
}
