# 🎯 Quick Guide: Zero-Cost Local Testing

**Yes! You can test without billing using Firebase Emulators!** ✨

When you run on `localhost`, your app **automatically connects** to local Firebase Emulators instead of production. This means:

- ✅ **ZERO Firestore reads billed**
- ✅ **ZERO write costs**
- ✅ **Safe to test features** without affecting production data
- ✅ **Faster development** (no network calls)

---

## 🚀 How to Use

### Quick Start (Two Terminals)

**Terminal 1 - Start Emulators:**
```bash
npm run emulators
```

**Terminal 2 - Start Dev Server:**
```bash
npm run dev
```

Then open http://localhost:5173 - you're now using emulators! 🎉

---

## ⚙️ First-Time Setup

1. **Install Java** (required, one-time):
   ```bash
   brew install openjdk@17
   ```

2. **Install Firebase CLI** (if not installed):
   ```bash
   npm install -g firebase-tools
   firebase login
   ```

3. **Start developing** with zero costs! 🚀

---

## 📊 What You Get

When emulators are running:

- 🌐 **Your App**: http://localhost:5173
- 🎛️ **Emulator UI**: http://localhost:4000 (view/edit data visually)
- 💾 **Firestore Emulator**: localhost:8080
- 🔐 **Auth Emulator**: localhost:9099

---

## 🔍 How to Verify It's Working

Open your app at http://localhost:5173 and check the browser console. You should see:

```
🔥 Connected to Firebase Emulators - ZERO reads billed!
```

---

## 💡 Pro Tips

1. **View all data** in the Emulator UI: http://localhost:4000
2. **Create test users** directly in the Auth Emulator UI
3. **Export data** to save your test state:
   ```bash
   firebase emulators:export ./my-test-data
   ```
4. **Import data** to restore test state:
   ```bash
   firebase emulators:start --import=./my-test-data
   ```

---

## 🔄 Production vs Development

| Environment | Connection | Billing |
|-------------|-----------|---------|
| `localhost:5173` | Emulators | **FREE** ✅ |
| `your-domain.com` | Production Firebase | **Billed** 💳 |

The switch is **automatic** - no code changes needed!

---

## 📚 Full Documentation

See [EMULATOR_SETUP.md](./EMULATOR_SETUP.md) for:
- Detailed setup instructions
- Data persistence
- Troubleshooting
- Advanced configuration

---

**Ready to test?** Just run `npm run emulators` + `npm run dev` and you're set! 🎊
