# Firestore Setup — No Manual Indexes Needed

## What changed

The old `adminLookupUser()` used:
```js
.collection('users').where('email','==',email).limit(1).get()
```
This requires a **Firestore composite index** that doesn't auto-create and can't be made manually for simple equality queries in the free tier easily.

### Fix: `emailIndex` collection
Now every user login writes a tiny document:
```
emailIndex/{email_sanitised}  →  { uid: "...", email: "..." }
```
Admin lookup reads `emailIndex` by document ID (direct get, zero index needed), then fetches `users/{uid}` directly.

**No indexes. No configuration. Just works.**

---

## Firestore Collections

| Collection | Document ID | Fields | Who writes |
|---|---|---|---|
| `users` | Firebase Auth UID | `trialStart`, `premiumExpiry`, `email` | User on login, Admin panel |
| `emailIndex` | sanitised email (`@`→`_`, `.`→`_`) | `uid`, `email` | User on login |
| `config/admins` | `admins` | `emails: [...]` | Firebase Console only |

---

## One-time Firebase Console steps

### 1. Deploy Security Rules
Go to **Firestore → Rules** and paste contents of `firestore.rules`, then **Publish**.

### 2. Create admin list
In **Firestore → Data**, create:
- Collection: `config`
- Document ID: `admins`
- Field: `emails` (type: **array**)
- Values: your admin email(s)

### 3. No indexes needed
The old `where('email','==',...)` query is gone. No index setup required.

---

## Existing users fix
Users who registered before this update won't have an `emailIndex` entry until they log in once. After one login, they're indexed automatically.

---

## GitHub Secrets (for Razorpay key)
1. Go to your repo → **Settings → Secrets → Actions**
2. Add secret: `RAZORPAY_KEY_ID` = your actual key
3. In `auth.js`, change:
   ```js
   const RAZORPAY_KEY = "YOUR_RAZORPAY_KEY_ID";
   ```
   To (inject at build time via the workflow, or just keep it in the file if repo is private).

Since you're making the repo **private**, keeping the Razorpay key directly in `auth.js` is acceptable. The Firebase config is always safe in client code.
