# **App Name**: SwipeBite

## Core Features:

- Food Item Swipe Interface: Core 'Tinder-style' swipe interaction for food items, displaying detailed card views, and processing 'Like' or 'Nope' actions with immediate UI updates and haptic feedback.
- PWA Onboarding & Install System: A multi-screen onboarding carousel for first-time users, coupled with an advanced PWA installation system, including platform-specific prompts (Safari Redirect, Android Banner, iOS Share Sheet) and persistent reminders.
- Client-Side Data Management: Manages all food item data, user preferences (e.g., 'Veg Only Mode'), swipe counts, liked items, and PWA installation status persistently using client-side localStorage, without requiring a backend.
- Persistent Bottom Navigation: A fixed bottom navigation bar allowing users to switch between Home, Trending, Dashboard, and Profile screens, featuring an animated indicator for the active tab and a live badge for unseen cards.
- Trending Food Items View: Displays a ranked list of food items with dynamic filtering by kiosk and time period ('Today'/'This Week'), visual rank changes, animated like percentage bars, and 'Hot right now' badges.
- Kiosk Analytics Dashboard: Provides analytical insights for food items per kiosk, including total swipes, like/dislike percentages, performance trends, a bar chart of top items, and highlights items 'Needs Improvement'.
- User Profile & History: Allows users to toggle a 'Veg Only Mode' preference, view a grid of their liked food items, and see personal swipe statistics (total swipes, items liked, like rate).

## Style Guidelines:

- Primary action color: A vibrant orange, `#FF6B35`, providing energy and calling attention to interactive elements, aligned with the app's fast-paced food discovery.
- Background color: A very dark gray, `#0f0f0f`, creating a modern, minimalist canvas that makes the primary orange and white text stand out.
- Accent color: A deep, muted red, `#B42D42`, for secondary calls to action or contrasting information, adding depth to the otherwise simple palette.
- Headline and body font: 'Poppins' (sans-serif) for its precise, contemporary, and easily legible aesthetic, suitable for short text chunks across the mobile-first interface.
- Strategic use of expressive emojis (🍔, 🔥, ✅, 🍽️, 👀, 📊, ❤️, 📲, 🧭) for clear visual communication, complemented by intuitive share, add-to-home-screen, and checkmark icons.
- Mobile-first design with a max-width of 430px centered on desktop for a focused experience. Utilizes layered card stacking with scaling for depth, fixed bottom navigation, and dedicated full-screen layouts for onboarding and PWA install prompts.
- Seamless screen transitions with Framer Motion (fade and subtle slide-up: y: 10→0, opacity: 0→1, 0.25s ease-out). Includes dynamic navigation bar animations, engaging card movements for first-time hints, a shimmering skeleton loader, and confetti bursts on key user actions.