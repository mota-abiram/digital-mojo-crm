# ☕ Java Installation Fix for macOS 12

## Problem
Firebase Emulators need Java, but Homebrew's `openjdk@17` requires full Xcode on macOS 12.

---

## ✅ Solution: Use Temurin (Eclipse Adoptium)

Temurin is a pre-built OpenJDK distribution that **doesn't require Xcode**.

### Install Command (Already Running)
```bash
brew install --cask temurin
```

**Note:** You'll need to enter your password when prompted.

---

## 🔍 After Installation - Verify Java

```bash
java -version
```

You should see something like:
```
openjdk version "17.0.x" 2024-xx-xx
OpenJDK Runtime Environment Temurin-17.0.x
```

---

## 🚀 Then Start Emulators

```bash
npm run emulators
```

---

## 🆘 Alternative: Manual Java Download

If the Homebrew installation fails, download Java manually:

1. **Download Temurin JDK 17**
   - Visit: https://adoptium.net/temurin/releases/
   - Select: macOS, x64 or aarch64 (based on your Mac), JDK 17
   - Download the `.pkg` installer

2. **Install**
   - Double-click the downloaded `.pkg` file
   - Follow the installation wizard

3. **Verify**
   ```bash
   java -version
   ```

4. **Start Emulators**
   ```bash
   npm run emulators
   ```

---

## 💡 Why Temurin?

- ✅ **No Xcode required** - Pre-built binaries
- ✅ **Official OpenJDK** - Eclipse Foundation
- ✅ **Free & Open Source**
- ✅ **Works on macOS 12**
- ✅ **Same as Oracle JDK** - Fully compatible

---

## 🎯 Quick Checklist

- [ ] Install Temurin: `brew install --cask temurin` (enter password when prompted)
- [ ] Verify Java: `java -version`
- [ ] Start emulators: `npm run emulators`
- [ ] Start dev server: `npm run dev` (in new terminal)
- [ ] Open app: http://localhost:5173
- [ ] Check for "Connected to Firebase Emulators" in console ✨
