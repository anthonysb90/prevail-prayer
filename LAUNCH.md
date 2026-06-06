# Prevail Prayer — Launch Prep Guide

## App Icon & Splash Screen

Before building for TestFlight, place these files in `assets/images/`:

| File | Size | Notes |
|---|---|---|
| `icon.png` | 1024×1024 | No rounded corners, no transparency. iOS + Android |
| `adaptive-icon.png` | 1024×1024 | Android foreground layer (subject centered, with padding) |
| `splash.png` | 1242×2208 | Full-bleed splash. Use cream (#F5F0E8) background |
| `favicon.png` | 48×48 | Web only |
| `notification-icon.png` | 96×96 | Android notification icon (white on transparent) |

**Design spec:**
- Background: `#F5F0E8` (cream)
- Primary element: praying hands or cross with amber (`#F5B942`) accent
- "Prevail Prayer" wordmark below icon on splash
- Font on splash: Playfair Display Bold

---

## EAS Setup (one-time)

```bash
npm install -g eas-cli
eas login
eas build:configure  # links to your Expo account
```

Update `eas.json` with your actual:
- Apple ID: `btwomediallc@gmail.com` (already set)
- App Store Connect App ID: (get from appstoreconnect.apple.com after creating app)
- Apple Team ID: (get from developer.apple.com)

---

## First Build for TestFlight

```bash
# Development build (for device testing with Expo Go replacement)
eas build --platform ios --profile development

# Production build (for TestFlight)
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios --profile production
```

---

## App Store Connect Setup

1. Sign in at appstoreconnect.apple.com
2. Click + New App
3. Bundle ID: `com.missionusa.prevailprayer`
4. Name: Prevail Prayer
5. Primary language: English (U.S.)
6. Category: Lifestyle (primary), Health & Fitness (secondary)

**App Store metadata:**

**Name:** Prevail Prayer

**Subtitle:** Prayer Journal & Reminders

**Description:**
Prevail Prayer is a Christian prayer app designed to help you build a consistent, meaningful prayer life. Track your prayer requests, celebrate answered prayers, journal your reflections, and stay connected to Scripture — all in one place.

**Features:**
• Prayer requests with categories, urgent flags, and status tracking
• Prayer List — a focused, distraction-free view of your prayers
• Prayer Journal — reflect on what God is doing and link it to your requests
• Scripture Library — 60+ KJV verses organized by topic
• Prayer Timer — pray with peaceful ambient music
• Daily Devotions — guided readings with Scripture and reflection questions
• Reminders — never miss your prayer time
• Push Notifications — stay connected to prayer needs and updates

**Keywords:**
prayer,prayer journal,Bible,devotional,Christian,faith,prayer tracker,Scripture,KJV,spiritual growth

**Privacy Policy URL:** https://prevailprayer.com/privacy
**Support URL:** https://prevailprayer.com/support

---

## RevenueCat Setup (required before IAP testing)

1. Create account at app.revenuecat.com
2. New project → "Prevail Prayer"
3. Add iOS app: Bundle ID `com.missionusa.prevailprayer`
4. Add Android app: Package `com.missionusa.prevailprayer`
5. Create Entitlement: `premium`
6. In App Store Connect: create subscription group "Prevail Prayer Premium"
   - Product ID: `com.missionusa.prevailprayer.premium_yearly`
   - Price: $14.99/year
   - Free trial: 14 days
7. Link the product in RevenueCat
8. Copy iOS API key → add to `.env` as `EXPO_PUBLIC_RC_IOS_KEY`

---

## Making Yourself Admin (one-time)

In the Supabase dashboard, SQL Editor:

```sql
UPDATE profiles
SET is_admin = TRUE
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'btwomediallc@gmail.com'
);
```

---

## Environment Variables Checklist

```
EXPO_PUBLIC_SUPABASE_URL=https://pvcxobbqbugghlqjpmph.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=✅ already set
EXPO_PUBLIC_RC_IOS_KEY=⬜ add after RevenueCat setup
EXPO_PUBLIC_RC_ANDROID_KEY=⬜ add after RevenueCat setup
```

---

## Font Files Needed

Download from Google Fonts and place in `assets/fonts/`:

| File | Source |
|---|---|
| `PlayfairDisplay-Bold.ttf` | fonts.google.com/specimen/Playfair+Display |
| `PlayfairDisplay-SemiBold.ttf` | same |
| `DMSans-Regular.ttf` | fonts.google.com/specimen/DM+Sans |
| `DMSans-Medium.ttf` | same |
| `DMSans-SemiBold.ttf` | same |

---

## Audio Files Needed

Place in `assets/audio/` — must be commercial-use licensed MP3s:

| File | Description | Source |
|---|---|---|
| `ambient-morning.mp3` | Soft piano, peaceful | Pixabay Music (CC0) |
| `ambient-waters.mp3` | Nature + strings | Pixabay Music (CC0) |
| `ambient-holy.mp3` | Worship ambient pad | Free Music Archive |
| `chime.mp3` | Single soft bell chime | Freesound.org (CC0) |
