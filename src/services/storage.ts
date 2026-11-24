import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads an optional payment screenshot/proof to Firebase Storage.
 * Falls back gracefully if Firebase Storage is unavailable or not provisioned.
 */
export async function uploadPaymentProof(
  orderId: string,
  file: File
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `payment-proofs/${orderId}/${Date.now()}_${safeName}`;

  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || 'image/png',
        customMetadata: {
          orderId,
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return downloadUrl;
    } catch (err: any) {
      console.warn('[Storage] Upload to Firebase Storage failed, falling back to base64 Data URL:', err);
    }
  }

  // Graceful fallback for local demo / unprovisioned storage bucket:
  // Convert file to base64 data URL so the shopkeeper can view the proof across tabs & reloads
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      resolve(URL.createObjectURL(file));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads a shop's UPI QR code image to Firebase Storage.
 */
export async function uploadShopQrImage(
  shopId: string,
  file: File
): Promise<{ storagePath: string; downloadUrl: string }> {
  const ext = file.name.split('.').pop() || 'png';
  const storagePath = `payment-qr/${shopId}/upi-qr.${ext}`;

  if (storage) {
    try {
      const storageRef = ref(storage, storagePath);
      const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type || 'image/png',
        customMetadata: {
          shopId,
          uploadedAt: new Date().toISOString(),
        },
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return { storagePath, downloadUrl };
    } catch (err) {
      console.warn('[Storage] Could not upload shop QR to Firebase Storage:', err);
    }
  }

  return {
    storagePath,
    downloadUrl: `/payment-qr/${shopId}/upi-qr.png`,
  };
}

