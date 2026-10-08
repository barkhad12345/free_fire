# DimaTop — Free Fire Diamonds Top-Up WebApp

A modern, clean, mobile-first Free Fire Diamonds Top-Up WebApp built for the Somali gaming community.

## 🚀 Features

- **Mobile-First UI/UX**: Clean, blue-and-white theme inspired by modern mobile apps.
- **Vanilla Web Stack**: Built purely with HTML5, modern CSS3, and Vanilla JavaScript (No heavy frameworks).
- **Free Fire Diamonds Packages**: Dynamic package cards with diamond amounts, bonuses, and prices.
- **Player ID Verification**: In-game Player ID verification flow with Somali identity confirmation banner ("Ma aha akoonkaaga? Dib u hubi ID-ga").
- **Local Somali Payment Methods**: Seamless support for ZAAD (Telesom) and EVC Plus (Hormuud).
- **Order Tracking & Receipt**: Complete transaction summaries, digital receipts, and real-time order history.
- **Supabase Integration**:
  - PostgreSQL database schema with Row Level Security (RLS) policies.
  - Supabase Authentication (Sign up, Login, Password Reset).
  - Admin dashboard for managing orders, packages, and support inquiries.
- **Offline Resilient**: Built-in fallback capabilities ensuring zero UI downtime.

## 📁 Project Structure

```
DimaTop/
├── index.html              # Main Single Page Application shell
├── css/
│   └── style.css           # Modern responsive styles & animations
├── js/
│   ├── app.js              # Application core logic & Supabase client
│   ├── supabase.js         # Supabase JS UMD bundle
│   └── lucide.min.js       # Lucide icons library
├── assets/
│   ├── icons/              # SVG vectors (ZAAD, EVC Plus, Free Fire, etc.)
│   └── images/             # Diamond packages & banners
├── supabase-schema.sql     # PostgreSQL database schema & RLS rules
└── server.js               # Lightweight Node.js local preview server
```

## 🛠️ Getting Started

### Local Development
You can run DimaTop with any static HTTP server or Node.js:

```bash
# Using Node.js
node server.js
```

Then open `http://localhost:3000` in your web browser.

### Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Go to the SQL Editor and execute `supabase-schema.sql`.
3. Your database tables (`profiles`, `packages`, `orders`, `payment_methods`, `support_messages`, `notifications`) and RLS policies are now live!

## 📄 License
MIT
