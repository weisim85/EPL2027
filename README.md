# ⚽ EPL 2026/27 Predictor

AI-powered Premier League prediction and betting analysis app.

## Features

- ⚡ Power Rankings — squad strength ratings for all 20 clubs
- 🏆 Season Table — live standings via ESPN, manual result entry
- 🔴 Live Scores — real-time EPL scores, auto-refresh
- 🏥 Match Intel — lineups, injuries, suspensions via RapidAPI
- 🔮 Match Predictor — Poisson model + AI preview for any fixture
- 🎯 Betting Edge — 1X2, Asian Handicap, Total Goals EV calculator
- 📡 Live Odds — bookmaker odds via the-odds-api.com
- 🔍 Team Intel — per-club deep dive with AI season preview
- 📊 Results Tracker — prediction accuracy tracking

## 2026/27 Season

- **Defending Champions:** Arsenal (85 pts)
- **Promoted:** Coventry City · Ipswich Town · Hull City
- **Relegated:** West Ham · Burnley · Wolverhampton
- **Season starts:** 21 August 2026

## Tech Stack

- React 18 + Vite
- Poisson distribution match prediction model
- Anthropic Claude API (AI previews + web search)
- ESPN public API (live scores + standings)
- RapidAPI — Free API Live Football Data (lineups)
- the-odds-api.com (bookmaker odds)

## Setup

```bash
npm install
npm run dev
