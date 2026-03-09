# CompoundIQ — Wealth Manager & Predictive Investment Intelligence Platform

**Version:** 1.0
**Target User:** Beginner–Intermediate Retail Investor (Trading 212 User)

---

## 1. Product Vision

Build an AI-powered wealth management system that connects to Trading 212 and provides:

- Portfolio analytics
- Predictive growth projections
- Scenario simulations
- Risk classification
- Dividend intelligence
- Daily global market insights
- Beginner-friendly explanations

The system acts as a personal Wealth Manager that helps users make structured, long-term investment decisions.

---

## 2. Target User Persona

**Primary User**

- Beginner investor
- Uses Trading 212 pies
- Invests fixed monthly amount
- Interested in long-term wealth building (5–20 years)
- Needs simple explanations
- Interested in: tech, real estate, healthcare, oil & gas, financials, defense

---

## 3. Core Modules Overview

1. Trading 212 Integration Module
2. Portfolio Analytics Engine
3. Projection & Forecast Engine
4. Simulation Engine
5. Risk & Dividend Classification Engine
6. Daily Market Intelligence Engine
7. Education & Explanation Layer
8. Dashboard & Visualization Layer

---

## 4. Trading 212 Integration Module

### 4.1 Authentication

- OAuth-based secure login via Trading 212 API
- No password storage
- Token-based session management

### 4.2 Data Retrieval

Pull:

- Portfolio holdings
- Pie allocations
- Transaction history
- Dividends received
- Current account balance
- Instrument price data

### 4.3 Sync Frequency

- Manual sync
- Scheduled sync (daily)
- Real-time where API allows

---

## 5. Portfolio Analytics Engine

### 5.1 Portfolio Metrics

- Total Portfolio Value
- Total Contributions
- Unrealized Gain/Loss
- Realized Gain/Loss
- Dividend Income (YTD + Total)
- Sector Allocation %
- Asset Allocation %
- Risk Exposure

### 5.2 Risk Metrics

- Beta (vs index)
- Volatility (standard deviation)
- Max historical drawdown
- Sharpe ratio
- Concentration score

### 5.3 Diversification Analysis

- Sector concentration alerts
- Single stock exposure alerts
- Risk imbalance warnings

---

## 6. Projection & Forecast Engine

### 6.1 Recurring Investment Projection

**Inputs:**

- Monthly investment amount
- Expected annual return (editable)
- Inflation adjustment toggle

**Time Horizons:**

- 6 months, 1 year, 2 years, 3 years, 5 years, 10 years, 20 years, custom range

**Outputs:**

- Future Portfolio Value
- Total Contributions
- Projected Profit
- Compound Growth Graph
- CAGR
- Risk-adjusted projection

### 6.2 Forecast Models

**Model Types:**

- Historical Average Return Model
- Monte Carlo Simulation (1000+ simulations)
- Trend-based regression model

**Scenarios:**

- Conservative (low return assumption)
- Moderate
- Aggressive

---

## 7. Simulation Engine

User can simulate:

> Example: "If I add £200 today, what happens over 10 years?"

**Simulation Options:**

- Lump sum addition
- Increased monthly deposit
- Change asset allocation
- Add/remove specific stock
- Dividend reinvestment toggle

**Outputs:**

- Delta portfolio growth
- Risk change impact
- Dividend income projection
- Compounding comparison chart

---

## 8. Risk & Dividend Classification Engine

### 8.1 Risk Categories

| Category    | Criteria                              |
|-------------|---------------------------------------|
| Low Risk    | Beta < 1, low volatility, stable earnings |
| Medium Risk | Beta ~1–1.3                           |
| High Risk   | Beta > 1.3, high volatility           |

### 8.2 Dividend Categories

| Category        | Yield  |
|-----------------|--------|
| Low Dividend    | < 2%   |
| Medium Dividend | 2–4%   |
| High Dividend   | > 4%   |

### 8.3 Stock Classification Output

System categorizes stocks into:

- Low Risk / High Dividend
- High Risk / High Dividend
- Low Risk / Low Dividend
- Medium Risk / High Dividend

Each stock displays:

- Risk Score (1–10)
- Dividend Yield
- 5Y Volatility
- Historical Drawdown
- Plain English summary

---

## 9. Daily Market Intelligence Engine

### 9.1 Global Overview

- S&P 500 trend
- FTSE 100 trend
- NASDAQ trend
- Sector heatmap
- VIX volatility status

### 9.2 Sector Monitoring

**Focus sectors:** Technology, Real Estate, Healthcare, Oil & Gas, Financial Services, Defense

**Daily output:**

- Top movers
- Earnings announcements
- Dividend declarations
- Regulatory risks
- Macro news impact

### 9.3 Personalized Insight

- How today's market impacts your portfolio
- Stocks to watch
- Risk warnings
- Portfolio trend vs market

---

## 10. Education & Explanation Layer

Every metric must include:

- Simple explanation
- Why it matters
- Action guidance

> Example: "Your portfolio beta is 1.4. This means it moves 40% more aggressively than the market. In downturns, you may experience larger losses."

---

## 11. Dashboard & UI Requirements

### Main Dashboard Sections

1. Portfolio Overview
2. Growth Projection Graph
3. Risk Score Summary
4. Dividend Tracker
5. Sector Allocation Chart
6. Daily Insight Panel
7. Simulation Tool

### Graph Types

- Compound growth curves
- Pie charts
- Risk radar chart
- Monte Carlo confidence band chart

---

## 12. Technical Architecture

| Layer      | Stack                                                                 |
|------------|-----------------------------------------------------------------------|
| Frontend   | React / Next.js, Chart.js or Recharts, secure auth layer             |
| Backend    | Node.js / Python, Trading 212 API integration, financial modeling engine, scheduled jobs |
| Data       | PostgreSQL, Redis cache for market data, external market data provider |
| AI         | Predictive modeling, NLP market summary generator, insight recommendation engine |

---

## 13. Notification System

- Daily email summary
- Push alerts for:
  - Portfolio drawdown > X%
  - High dividend announcement
  - Risk imbalance detected
  - Significant sector shift

---

## 14. KPIs

- Forecast accuracy vs historical performance
- User portfolio growth rate
- Simulation usage frequency
- User retention rate

---

## 15. MVP Scope

### Phase 1 (Must Have)

- Trading 212 sync
- Portfolio analytics
- Monthly contribution projection
- Basic simulation
- Basic risk classification
- Daily summary email

### Phase 2

- Monte Carlo modeling
- Advanced AI predictions
- Sector rotation alerts
- Dividend forecasting

### Phase 3

- Machine learning trend prediction
- Macro risk modeling
- Auto-rebalancing suggestions

---

## 16. Compliance Considerations

- Must display disclaimer: *"Projections are estimates and not financial advice."*
- GDPR compliant
- Secure token storage
- No password retention

---

## 17. Success Criteria

The system should:

- Help user understand portfolio clearly
- Provide realistic long-term projections
- Prevent overexposure to risk
- Encourage disciplined recurring investing
- Increase confidence in investing decisions
