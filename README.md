# 🎬 Movie-Buddy

**Movie-Buddy** is a high-performance, Netflix-inspired movie discovery web app built with **React**, **Vite**, and **CSS Modules**. Powered by the **TMDB API**, it features real-time debounced search, genre filtering, infinite pagination, and a personal movie progress tracker with dynamic state calculations. Engineered with custom inline SVGs for instant rendering and seamless light/dark mode adaptation.

---

## ✨ Features

- **⚡ Live Debounced Search**: Custom `useDebounce` hook optimizes API calls during typing.
- **📊 Watchlist Progress Tracker**: State-driven completion percentage updated dynamically.
- **🎨 Custom Inline SVGs**: Scalable, zero-overhead vector icons that adapt to light and dark themes.
- **🌓 Light/Dark Mode**: Instant theme switching managed via React Context API.
- **🍿 Deduplicated Pagination**: Smooth "Load More" fetching with automatic duplicate ID filtering.

---

## 🛠 Tech Stack

- **Frontend**: React, React Router, Context API
- **Build Tool**: Vite
- **Styling**: CSS Modules, CSS Variables
- **API**: The Movie Database (TMDB) API
- **Deployment**: Vercel

---

## 🚀 Quick Start

1. **Clone the repository**:
   ```bash
   git clone [https://github.com/Khalid-max009/movie-buddy.git](https://github.com/Khalid-max009/movie-buddy.git)