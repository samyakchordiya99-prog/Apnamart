# ApnaBazaar

Hyperlocal e-commerce platform connecting local vendors with nearby customers.

## Stack
- React + TypeScript (Vite)
- Firebase Authentication + Cloud Firestore
- Leaflet / OpenStreetMap (free map tiles)
- Nominatim (free geocoding)

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Create env file:
   ```
   copy .env.example .env.local
   ```
   Fill in your Firebase web app config (Project settings → General → Your apps). Do **not** add service-account / admin SDK keys to `.env.local`.
3. Configure Firebase:
   - Enable Email/Password (and optionally Google) in Firebase Authentication.
   - Create a Firestore database.
   - Paste `firestore.rules` into the Firestore Rules tab and publish.
4. Run:
   ```
   npm run dev
   ```
   Open http://localhost:5173

## Notes
- Account roles (customer / vendor) are chosen at signup and locked afterward; users cannot change their own role client-side (enforced by Firestore rules).
- Location is only collected when the user clicks "Use My Current Location" or selects on the map. Continuous background tracking is not used.
- Saving location to a profile requires explicit consent.
- Google sign-in defaults new accounts to the customer role.

## Production build
```
npm run build
npm run preview
```
