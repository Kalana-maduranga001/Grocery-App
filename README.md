# Welcome to your Grocery App 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Download

- [Latest Android build](https://drive.google.com/file/d/1ltokiIqq86tZ512sQkCnoXuJziJSUntR/view?usp=sharing)

## Overview

SmartGrocer keeps grocery shopping and household stock management simple. Plan supermarket visits by creating reusable lists, tick items off in real time while you shop, and record purchased quantities with expected depletion dates. The app learns usage patterns, estimates when essentials will run low, and notifies you before stocks are exhausted so you can restock without stress.

## Folder Structure

| Path                                   | Description                                                   |
| -------------------------------------- | ------------------------------------------------------------- |
| [app](app)                             | Expo Router screens and layouts driving navigation.           |
| [app/(auth)](app/%28auth%29)           | Authentication flows for login and registration.              |
| [app/(dashboard)](app/%28dashboard%29) | Post-login dashboard experiences including stock and lists.   |
| [components](components)               | Reusable UI components such as glass buttons and loaders.     |
| [context](context)                     | React context providers for authentication and loading state. |
| [hooks](hooks)                         | Custom hooks that wrap context accessors and business logic.  |
| [services](services)                   | API and Firebase helpers powering data access.                |
| [types](types)                         | Shared TypeScript types for consistent models.                |
| [utils](utils)                         | Utility helpers for notifications and Cloudinary integration. |
| [assets/images](assets/images)         | App imagery consumed across screens.                          |
| [assets/logos](assets/logos)           | Brand assets and icons for marketing surfaces.                |

## Services

- [services/authService.ts](services/authService.ts) – Handles authentication workflows backed by Firebase.
- [services/firebaseConfig.ts](services/firebaseConfig.ts) – Centralized Firebase configuration shared across the app.

## Technologies

- Expo Router with React Native and TypeScript.
- Firebase authentication and Firestore integration.
- Tailwind CSS (via NativeWind) for styling.
- Expo Notifications for timely restock reminders.

## Assets and Logos

Access brand visuals inside [assets/logos](assets/logos). Use these files for in-app placements or promotional materials, and add new logo variants here so they remain versioned with the project.

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
