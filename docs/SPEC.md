# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
NewMomCircle is a comprehensive postpartum wellness web and mobile application for Indian mothers. This milestone focuses on delivering high-fidelity design updates, interactive multimedia content (YouTube integration), a multilingual articles library, a dynamic community feed, and premium CSS-based visual enhancements across key screens.

## Goals
1. **Hero Video & Logo**: Upgrade the landing page navbar with a custom SVG mother-and-baby logo and a high-definition video background.
2. **Dynamic Community Feed**: Populate the feed page with rich Indian-centric dummy posts when Firebase is empty, support pagination ("Load More"), and add an animated background and auto-scrolling trending topics.
3. **Multimedia Visualization & Workouts**: Embed YouTube guides in the visualization modal and transition postpartum workouts into a 7-day tabbed training program with progress tracking saved in localStorage.
4. **Insights Dashboard Visuals**: Add animated gradients, glowing particle effects, hover states, entrance animations, and an animated count-up script.
5. **Multilingual Article Library**: Support 50 detailed articles across 5 Indian languages with search, categorization, and language toggle selectors.

## Non-Goals (Out of Scope)
- Dynamic custom video upload backend.
- Full real-time notification servers.
- Complex database state syncing for guest users (localStorage is used for offline persistent items).

## Users
- Indian mothers seeking postpartum physical and mental wellness guidance.

## Constraints
- Must run cleanly inside the existing Next.js layout structures.
- CSS transitions and animations must remain performant on both desktop and mobile devices.

## Success Criteria
- [ ] Landing page shows high-quality background video and custom SVG logo.
- [ ] Community feed merges Firebase posts and fallback dummy posts, with a working "Load More" action.
- [ ] Guided visualization component streams YouTube videos via a custom playback modal.
- [ ] 7-Day movement routine displays progress, supports marking complete, and persists status to localStorage.
- [ ] Insights page animates values, displays a glowing gradient background, and features a pulsing fire icon.
- [ ] 50 articles in the Wellness Library load instantly and support English, Hindi, Telugu, Tamil, and Kannada translations.
