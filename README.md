# 🎬 MovieBuddy

**MovieBuddy** is a high-performance, Netflix-inspired full-stack movie discovery web app built with **React**, **Vite**, **Supabase**, and **Tailwind/CSS**. Powered by the **TMDB API**, **Groq AI**, and **Brevo SMTP**, it features strict email-verified authentication, custom onboarding preference matching, a dynamic daily feed, and a responsive mobile-first UI architecture.

---

## ✨ Core Features

- **🔐 Strict Auth & Email Verification**: Secure user signups and logins via **Supabase Auth** integrated with **Brevo SMTP** transactional emails and custom HTML verification templates.
- **🛡️ Protected Routing & Onboarding Gate**: Automated state-driven routing that routes brand-new users through a genre/region onboarding flow (landing on `/home`) and existing users directly to their personalized `/feed`.
- **🤖 AI-Powered Movie Recommendations**: Context-aware assistant powered by **Groq AI** to find custom movie and series matches based on user prompts.
- **⚡ Live Debounced Search & Filtering**: Optimized search handling release years, languages, and genres with zero UI lag.
- **📊 Watchlist & Favourites Tracker**: Real-time state management for saving custom watchlists and tracking movie interests.
- **📱 Mobile-First Responsive UI**: Custom CSS grid optimizations ensuring native-feeling 2-column card layouts on mobile devices with zero horizontal overflow.

---

## 🛠 Tech Stack

- **Frontend**: React, React Router, Context API
- **Backend & Database**: Supabase Auth, PostgreSQL Profiles Table
- **Email Delivery**: Brevo SMTP Relay
- **AI Integration**: Groq AI API
- **Movie Data**: The Movie Database (TMDB) API
- **Build Tool**: Vite
- **Deployment**: Vercel (`reelfriend.vercel.app`)

---

## 🚀 Quick Start

1. **Clone the repository**:
   ```bash
   git clone [https://github.com/Khalid-max009/movie-buddy.git](https://github.com/Khalid-max009/movie-buddy.git)
   cd movie-buddy