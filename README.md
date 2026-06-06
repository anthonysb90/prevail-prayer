# Prevail Prayer

> "The effectual fervent prayer of a righteous man availeth much." — James 5:16 (KJV)

A Christian prayer app built with Expo, TypeScript, and Supabase.

---

## Tech Stack

- **Expo** (managed workflow, SDK 51)
- **React Native** + **TypeScript**
- **Supabase** — auth, PostgreSQL database, row-level security
- **NativeWind** — Tailwind CSS for React Native
- **Zustand** — global state management
- **TanStack Query** — server state and caching
- **Expo Router** — file-based navigation
- **expo-notifications** — local scheduled notifications
- **expo-av** — audio playback for prayer timer

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/anthonysb90/prevail-prayer.git
cd prevail-prayer
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `/docs/schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and add your Supabase credentials:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Add fonts

Download and place in `/assets/fonts/`:
- [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) — Bold, SemiBold
- [DM Sans](https://fonts.google.com/specimen/DM+Sans) — Regular, Medium, SemiBold

### 5. Run

```bash
npx expo start
```

---

## Project Structure

```
app/           Expo Router screens
components/    Reusable UI components
lib/           Supabase client, notifications, audio
stores/        Zustand state stores
hooks/         React Query data hooks
constants/     Colors, typography, seed data (verses, categories)
types/         TypeScript interfaces
assets/        Fonts, images, audio
```

---

## Features

- Prayer requests (active, ongoing, answered, completed)
- Urgent flagging
- Category / tag system (10 default categories, KJV color-coded)
- Prayer List screen (always dark for focused prayer time)
- Prayer Journal with optional request linking
- Scripture Library (KJV, organized by topic, favoriting)
- Prayer Timer with ambient sound and bell intervals
- Local push notification reminders (request-specific and general)
- Dark mode / light mode support
- Free with support prompts

---

## Build & Deploy

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

Built for Mission USA / Congregational Holiness Church.
