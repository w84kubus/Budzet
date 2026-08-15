import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { auth } from "./config";
import { initEncryptionForNewUser, initEncryptionForLogin, teardownEncryption, reEncryptWithNewPassword } from "@/lib/crypto/setup";

export async function signUp(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth(), email, password);
  // Derive encryption key for the new user - salt + verify token will be
  // saved to settings during onboarding via initializeUserData
  await initEncryptionForNewUser(password);
  return credential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth(), email, password);
  // Derive encryption key from password + salt stored in settings.
  // If no encryption metadata exists yet (pre-E2E account), migrates automatically.
  await initEncryptionForLogin(credential.user.uid, password);
  return credential.user;
}

export async function signOut(): Promise<void> {
  teardownEncryption();
  await firebaseSignOut(auth());
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth(), email);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth(), callback);
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth().currentUser;
  if (!user || !user.email) throw new Error("Not authenticated");

  // Re-authenticate first (Firebase requires recent auth for password change)
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  // Re-encrypt all data with new password before changing it
  await reEncryptWithNewPassword(user.uid, newPassword);

  // Now change Firebase Auth password
  await firebaseUpdatePassword(user, newPassword);
}

export function getCurrentUser(): User | null {
  return auth().currentUser;
}
