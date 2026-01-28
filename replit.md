# Charge Wealth Platform

## Overview

Charge Wealth is an integrated financial decision-support platform designed for high-net-worth individuals seeking unbiased financial clarity, confidence, and control without the high costs of traditional financial advisors. It aims to empower users to manage their finances effectively by providing tools that cut through industry jargon and sales tactics. The platform features three core AI-powered decision engines: AI Advisor, Tax Advisor, and Portfolio Engine, all built around a unified user financial profile. Key capabilities include proactive financial insights, comprehensive tax strategy analysis with dollar-amount savings estimates, and CFA-level portfolio analysis with specific investment recommendations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology Stack:** React 19 with TypeScript, Wouter for routing, Vite for building, TanStack Query for server state.
- **Application Structure:** Separate landing page (static HTML), React SPA for the dashboard (`/dashboard/*`), and static HTML for legal pages.
- **Route Structure:** Dedicated routes for Overview, AI Advisor, Tax Advisor, Portfolio Engine, Custom Playbooks, Referrals, and Settings.
- **Design System:** Premium dark theme with Midnight Blue, Deep Navy, and Gold accents, utilizing CSS modules for styling, and a mobile-first responsive design.
- **Brand Voice:** Direct, confrontational, intelligent; anti-industry stance (criticizing high fees and commissioned products), targeting high earners experiencing decision paralysis.

### Backend Architecture
- **Technology Stack:** Express.js 5 with TypeScript, TSX for execution, Drizzle ORM with PostgreSQL, session-based authentication (Replit Auth / OpenID Connect).
- **Route Organization:** Modular structure with routes organized by feature (public, auth, referrals, stripe, financial, blog, chargeai, taxintel, cfo, allocation, playbooks, settings).
- **API Endpoints:** Comprehensive set of RESTful APIs for managing user data, financial profiles, AI interactions, tax analysis, portfolio management, referral systems, and playbooks.
- **Database Schema:** Core tables for users, sessions, financial profiles, and documents, with dedicated tables for tax data, portfolio positions, AI sessions, planning memos, and playbooks.

### Core Features
- **AI Advisor:** Central guide providing proactive, CFO-style insights, personalized financial data injection, and planning memos.
- **Tax Advisor:** Analyzes 10+ tax strategies, incorporates state tax recognition, calculates comprehensive tax rates, and provides AI-generated tax insights with savings estimates.
- **Portfolio Engine:** Offers CFA-level analysis of positions, AI-driven stock/ETF/crypto recommendations, opportunity signals, and tax-aware rebalancing. Includes real-time stock/crypto price tracking via Alpha Vantage and CoinGecko APIs, historical price charts (7D/1M/3M), and configurable price alerts with hourly checking.
- **Custom Playbooks:** Step-by-step financial action plans for various categories, with progress tracking and pre-built templates.
- **Gamified Wealth Readiness System:** AI-generated, CFP-vetted recommendations with point values, level progression, and a dashboard component.
- **Settings:** User account management with tabs for Profile (name, email), Email Preferences, Connected Accounts (Google OAuth), Notifications, and Password Change.
- **Onboarding Wizard:** A 5-step process for new users covering tax profile, tax return upload, portfolio setup, initial AI interaction, and a gamified Wealth Readiness score.
- **Landing Page Features:** Streamlined ~2,500 word design with:
  - Interactive Tax Savings Calculator with real-time animated calculations
  - Version toggle system controlled by `FOUNDING_MEMBERS_ACTIVE` flag in index.html JS (set to `true` for founding members phase, `false` after 250 members to show regular pricing)
  - Navigation: Tax Calculator | How It Works | Founding Members/Pricing | Take Charge (external) | FAQ
  - Modern animations: scroll-triggered fade-ins, active nav highlighting, sticky CTA bar after hero, scroll progress indicator, animated counters
  - Founding member counter: 187/250 spots (hardcoded values, update as needed)
  - Two pricing versions: Founding ($279 lifetime) and Regular ($49/mo, $99/3mo, $200/6mo, $499 lifetime)
- **SEO:** Implemented with meta tags, Schema.org, a blog section with SEO-optimized articles, server-side rendered blog posts, and auto-generated sitemap.xml.

## External Dependencies

-   **Replit Auth:** User authentication.
-   **PostgreSQL:** Primary database, backed by Neon.
-   **OpenAI via Replit AI:** Powers all AI-driven features (GPT-4).
-   **Stripe:** Payment processing for subscriptions ($49/mo, $99/3mo, $200/6mo, $279 lifetime).
-   **pdf-parse:** Used for parsing PDF tax returns.
-   **Alpha Vantage API:** Real-time and historical stock price data (requires ALPHA_VANTAGE_API_KEY environment variable).
-   **CoinGecko API:** Real-time crypto price data (free tier, no API key required).
-   **recharts:** Chart library for price history visualization.