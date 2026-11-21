# CarryGo — On-Demand Parcel & Courier Delivery App

CarryGo is a React Native (Expo SDK 58) on-demand parcel delivery app designed with the **Urban Velocity** visual design language, Ghana Cedi (`GH₵`) & kilometer (`km`) pricing, OpenStreetMap Nominatim/OSRM routing, and Supabase integration with seamless Demo Fallback Mode.

## Quick Start (Expo Go on Your Phone)

1. Install dependencies (if not already installed):
   ```bash
   npm install
   ```
2. Start the Expo dev server:
   ```bash
   npx expo start
   ```
3. Scan the QR code with **Expo Go** on Android or the Camera app on iOS.
4. Tap **"Quick Start with Demo Account"** or **"Continue with Demo Account"** on the sign-in screen to explore immediately with pre-seeded Accra locations, MTN MoMo / CarryGo Wallet, and live courier simulation.

## Connecting Supabase (Optional for Cloud Sync)

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in your Supabase SQL Editor.
3. Copy `.env.example` to `.env` and fill in your credentials:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. Restart Expo (`npx expo start -c`).

## Features Included

- **Onboarding & Auth**: 3-slide onboarding, Supabase Email/Password sign-in & sign-up, plus 1-tap Demo Account.
- **Map-First Send Studio**: Live `react-native-maps` view, GPS auto-detect, OpenStreetMap Nominatim search, tap-on-map pinning, and OSRM road route calculation.
- **Bike & Car Tiers**: Instant fare comparison in `GH₵` based on real route distance (`km`) and ETA (`mins`).
- **Parcel & Checkout**: Size tiers (`Envelope`, `Small Box`, `Medium Parcel`, `Large / Multi-Box`), Fragile handling toggle, recipient details, Promo Codes (`CARRY10`, `ACCRA5`, `FREEDROP`), and payment options (MTN MoMo, CarryGo Wallet, Visa, Cash on Pickup/Delivery).
- **Live Courier Simulation & Tracking**: Animated rotating rider marker moving along the route, 6-step milestone timeline, 4-digit Delivery Security PIN, Proof of Delivery, Rider Rating & Tipping, and in-app Rider Chat with smart replies.
- **Account & Wallet**: CarryGo Wallet top-ups, Saved Addresses manager, Payment Methods manager, and System/Light/Dark appearance switcher.
