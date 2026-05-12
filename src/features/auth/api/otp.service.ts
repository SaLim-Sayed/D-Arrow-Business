import emailjs from "@emailjs/browser";
import { doc, setDoc, getDoc } from "firebase/firestore/lite";
import { db } from "@/lib/firebase";

const COLLECTION = "otpResets";
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function emailToKey(email: string): string {
  return email.toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export const OtpService = {
  /** Generate OTP, store in Firestore, send via EmailJS */
  async sendOtp(email: string): Promise<void> {
    const otp = generateOtp();
    const key = emailToKey(email);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    // Store in Firestore
    await setDoc(doc(db, COLLECTION, key), {
      email,
      otp,
      expiresAt,
      used: false,
      createdAt: new Date().toISOString(),
    });

    // Send via EmailJS
    const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string;
    const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string;

    if (!serviceId || !templateId || !publicKey) {
      // Dev fallback: log OTP to console
      console.warn(`[OTP DEV] Code for ${email}: ${otp}`);
      return;
    }

    await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: email,
        otp_code: otp,
        expiry_minutes: "10",
      },
      { publicKey }
    );
  },

  /** Returns true if OTP is valid and marks it as used */
  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const key = emailToKey(email);
    const ref = doc(db, COLLECTION, key);
    const snap = await getDoc(ref);

    if (!snap.exists()) return false;

    const data = snap.data();

    if (data.used) return false;
    if (new Date(data.expiresAt) < new Date()) return false;
    if (data.otp !== otp.trim()) return false;

    // Mark as used so it can't be reused
    await setDoc(ref, { ...data, used: true });
    return true;
  },
};
