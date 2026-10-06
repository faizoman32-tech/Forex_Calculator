# Forex Position Size & Risk Calculator

A professional, dark-themed web application for calculating position sizes, risk-to-reward ratios, and trade management for Forex trading.

![Forex Calculator](https://img.shields.io/badge/Forex-Calculator-emerald?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-blue?style=for-the-badge&logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind-4-cyan?style=for-the-badge&logo=tailwindcss)
![Vite](https://img.shields.io/badge/Vite-6-purple?style=for-the-badge&logo=vite)

## ✨ Features

- **Multi-pair support**: EUR/USD, GBP/USD, USD/JPY, AUD/USD, USD/CHF, USD/CAD, NZD/USD, EUR/GBP
- **Exact lot size calculation** for EUR/USD and all major pairs
- **Risk-to-Reward ratio** with visual bar chart
- **Buy/Sell direction** toggle
- **Risk level indicator** (Conservative → Very High Risk)
- **Lot size breakdown** (Standard, Mini, Micro lots)
- **Real-time calculations** as you type
- **Responsive design** for desktop and mobile
- **Dark trading dashboard theme**

## 🚀 Deploy to GitHub Pages (Step-by-Step)

### Prerequisites

- A [GitHub account](https://github.com/signup) (free)
- [Git](https://git-scm.com/downloads) installed on your computer
- [Node.js](https://nodejs.org/) v18+ installed

---

### Step 1: Configure for GitHub Pages

Before deploying, you need to update the Vite config so assets load correctly on GitHub Pages.

Open `vite.config.js` and add `base: './'` to the config:

```js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',  // ← ADD THIS LINE for GitHub Pages
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
  },
});
```

> **Why?** GitHub Pages serves your site from a subdirectory (e.g., `username.github.io/forex-calculator/`). Setting `base: './'` tells Vite to use relative paths for all assets.

---

### Step 2: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** button (top-right corner) → **New repository**
3. Fill in the details:
   - **Repository name**: `forex-calculator` (or any name you prefer)
   - **Description**: `Forex Position Size & Risk Calculator`
   - **Visibility**: **Public** (required for free GitHub Pages)
   - ✅ Check **Add a README file**
4. Click **Create repository**

---

### Step 3: Push Your Code to GitHub

Open your terminal and run these commands from your project folder:

```bash
# Initialize git in your project
git init

# Add all files to staging
git add .

# Create your first commit
git commit -m "Initial commit: Forex Position Size & Risk Calculator"

# Connect to your GitHub repository (replace YOUR_USERNAME with your actual username)
git remote add origin https://github.com/YOUR_USERNAME/forex-calculator.git

# Push to GitHub
git branch -M main
git push -u origin main
```

> 💡 **Tip**: If GitHub asks for authentication, use a [Personal Access Token](https://github.com/settings/tokens) instead of your password. Generate one with `repo` scope.

---

### Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** (top tab bar)
3. In the left sidebar, click **Pages**
4. Under **Source**, select:
   - **Source**: `GitHub Actions`
5. The workflow file (`.github/workflows/deploy.yml`) is already included in your repo — it will automatically build and deploy!

---

### Step 5: Verify Deployment

1. Go to the **Actions** tab in your repository
2. You should see the "Deploy to GitHub Pages" workflow running
3. Wait for it to complete (✓ green checkmark)
4. Your site will be live at:
   ```
   https://YOUR_USERNAME.github.io/forex-calculator/
   ```

---

### Step 6: Custom Domain (Optional)

If you want to use a custom domain:

1. In **Settings → Pages**, enter your domain under **Custom domain**
2. Add a `CNAME` file to your repo root with your domain name
3. Configure your DNS provider to point to GitHub Pages:
   - **A records**: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **CNAME**: `YOUR_USERNAME.github.io`
4. Enable **Enforce HTTPS**

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
forex-calculator/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment workflow
├── src/
│   ├── App.tsx                  # Main calculator component
│   ├── index.css                # Tailwind styles + custom CSS
│   └── main.tsx                 # React entry point
├── index.html                   # HTML entry point
├── vite.config.js               # Vite configuration
├── package.json                 # Dependencies
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

## 📊 How the Calculator Works

### Position Size Formula

```
Lot Size = Risk Amount / (Stop Loss Pips × Pip Value per Lot)
```

Where:
- **Risk Amount** = Account Balance × Risk Percentage
- **Stop Loss Pips** = |Entry Price - Stop Loss Price| / Pip Size
- **Pip Value per Lot** = $10 for most USD-quote pairs (per standard lot)

### Lot Size Breakdown

| Lot Type | Units    | Example |
|----------|----------|---------|
| Standard | 100,000  | 1.00 lots |
| Mini     | 10,000   | 0.10 lots |
| Micro    | 1,000    | 0.01 lots |

## ⚠️ Disclaimer

This calculator is for **educational purposes only**. Always verify calculations before placing real trades. Forex trading involves significant risk of loss and is not suitable for all investors. Past performance does not guarantee future results.

## 📄 License

MIT License — feel free to use, modify, and distribute.
