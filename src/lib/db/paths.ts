/**
 * Single source for all Firestore paths.
 * Today budgetId === uid. In the future, swap to `budgets/${budgetId}`
 * with a memberUids array and update security rules.
 */

export function budgetRoot(budgetId: string): string {
  return `users/${budgetId}`;
}

export function settingsPath(budgetId: string): string {
  return `${budgetRoot(budgetId)}/settings/data`;
}

export function periodsCollection(budgetId: string): string {
  return `${budgetRoot(budgetId)}/periods`;
}

export function periodDoc(budgetId: string, periodId: string): string {
  return `${periodsCollection(budgetId)}/${periodId}`;
}

export function fixedExpenseDefsCollection(budgetId: string): string {
  return `${budgetRoot(budgetId)}/fixedExpenseDefs`;
}

export function fixedExpenseDefDoc(budgetId: string, defId: string): string {
  return `${fixedExpenseDefsCollection(budgetId)}/${defId}`;
}

export function fixedExpenseInstancesCollection(budgetId: string): string {
  return `${budgetRoot(budgetId)}/fixedExpenseInstances`;
}

export function fixedExpenseInstanceDoc(
  budgetId: string,
  instanceId: string
): string {
  return `${fixedExpenseInstancesCollection(budgetId)}/${instanceId}`;
}

export function envelopesCollection(budgetId: string): string {
  return `${budgetRoot(budgetId)}/envelopes`;
}

export function envelopeDoc(budgetId: string, envelopeId: string): string {
  return `${envelopesCollection(budgetId)}/${envelopeId}`;
}

export function transactionsCollection(budgetId: string): string {
  return `${budgetRoot(budgetId)}/transactions`;
}

export function transactionDoc(
  budgetId: string,
  transactionId: string
): string {
  return `${transactionsCollection(budgetId)}/${transactionId}`;
}

export function transferTasksCollection(budgetId: string): string {
  return `${budgetRoot(budgetId)}/transferTasks`;
}

export function transferTaskDoc(budgetId: string, taskId: string): string {
  return `${transferTasksCollection(budgetId)}/${taskId}`;
}

export function balanceChecksCollection(budgetId: string): string {
  return `${budgetRoot(budgetId)}/balanceChecks`;
}

export function balanceCheckDoc(budgetId: string, checkId: string): string {
  return `${balanceChecksCollection(budgetId)}/${checkId}`;
}
