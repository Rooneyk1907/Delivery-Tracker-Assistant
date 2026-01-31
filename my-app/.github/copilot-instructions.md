# Delivery Tracker Assistant - AI Coding Agent Guide

## Project Overview

**Delivery Tracker Assistant** is a React Native mobile app built with Expo that tracks delivery job metrics (pay, idle time, miles, acceptance rates) across multiple food delivery platforms (GrubHub, DoorDash, UberEats).

**Tech Stack:** Expo 54, React Native 0.81, React 19, TypeScript 5.9, Expo Router 6 (file-based routing)

## Architecture Overview

### File-Based Routing (Expo Router)
- **`app/_layout.tsx`**: Root Stack navigator wrapping the entire app with dark theme styling
- **`app/(tabs)/`**: Tab-based navigation group for main sections (Dashboard, History)
- **`app/(tabs)/index.tsx`**: Dashboard screen - displays aggregated delivery metrics
- **`app/(tabs)/history.tsx`**: History screen (currently empty placeholder)
- **`app/delivery/[id].tsx`**: Dynamic route for individual delivery detail view

### Data Model
- **`types/order.ts`**: Core interface `ActiveOrder` with fields: `date`, `service` (enum: GrubHub|DoorDash|UberEats), `restaurant`, `pay`
- Future: Will likely expand with time tracking, mileage, acceptance rate data

### Styling & Constants
- **`constants/Colors.ts`**: Centralized color palette (primary: `#3498db`, dark: `#2c3e50`, net profit: `#27a360`)
- Component styling uses React Native `StyleSheet` (not a CSS-in-JS library)
- Dark theme by default; app base has `backgroundColor: colors.dark`

## Key Development Patterns

### Component Structure
- Use **functional components** with React hooks (`useState`, etc.)
- Import styles via `StyleSheet.create()` - inline styles for responsive layouts
- Always wrap screens in `SafeAreaView` to handle notches and bottom safe areas
- Use `id` attributes for semantic HTML-like identification in React Native

### Common Patterns in This Codebase
1. **State Management**: Currently using React `useState` for local component state (no Redux/Context yet)
2. **Navigation**: File-based routing with Expo Router - no manual navigation setup needed
3. **Type Safety**: Strict TypeScript (`tsconfig.json` has `"strict": true`) - define types for all data structures
4. **Color System**: Always import from `constants/Colors` - never hardcode colors

### Dashboard Metrics Calculation
The Dashboard screen (`app/(tabs)/index.tsx`) displays:
- **Gross Pay** & **Net Pay** (main stats, centered, large text)
- **Hourly metrics** (Hourly Gross, Hourly Net)
- **Time & Distance** (Total Idle Time, Total Miles)
- **Performance** (Acceptance Rate)

These are stateful `useState` values - future integration point for API/local storage.

## Build & Development Workflow

### Available Scripts
```bash
npm start              # Launch Expo dev server with platform selection
npm run android        # Start Android emulator
npm run ios           # Start iOS simulator
npm run web           # Start web preview
npm run lint          # Run ESLint (expo config)
npm run reset-project # Reset to blank app (moves current app to app-example/)
```

### Common Tasks
- **Testing code changes**: Start with `npm start` and test on target platform (Android/iOS/web)
- **Adding new screens**: Create files in `app/` directory - routing is automatic
- **Global styling changes**: Update `constants/Colors.ts` and root `app/_layout.tsx`
- **Type definitions**: Add to `types/order.ts` or create new files in `types/` directory

## Important Conventions & Gotchas

1. **Path Aliases**: Use `@/` to reference app root (configured in `tsconfig.json`)
   - ✅ `import colors from '@/constants/Colors'`
   - ❌ `import colors from '../constants/Colors'`

2. **Empty Tab Layout**: `app/(tabs)/_layout.tsx` is intentionally empty - Expo Router auto-creates tab navigation from route structure

3. **Root Layout Styling**: Padding applied at root (`app/_layout.tsx`) - be mindful when adding new full-screen content

4. **No Component Library**: Building UI with raw React Native (no NativeBase, Tamagui, etc.) - keep components lightweight

5. **Theme**: Hardcoded dark theme with light accent colors - maintain this visual identity

## Next Steps for Implementation

- Implement order list state management in Dashboard and History
- Connect `ActiveOrder` type to data fetching (API/local storage)
- Build delivery detail screen with `[id].tsx` dynamic route
- Add calculation logic for hourly metrics (requires time tracking data)
- Consider extracting stat display components from Dashboard monolith

## Debugging & Common Issues

- **Build failures**: Clear cache with `expo start -c`
- **TypeScript errors**: Check strict mode - all types must be explicit
- **Navigation issues**: Verify file structure in `app/` matches intended routes
- **Styling not applied**: Ensure `StyleSheet.create()` is used, not inline style objects
