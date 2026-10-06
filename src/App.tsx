import React, { useState, useMemo, useCallback } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CalculationResult {
  riskAmount: number;
  stopLossPips: number;
  takeProfitPips: number;
  riskRewardRatio: number;
  lotSize: number;
  units: number;
  potentialProfit: number;
  potentialLoss: number;
  pipValue: number;
  isValid: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PAIR_CONFIG: Record<string, { pipSize: number; pipValuePerLot: number; description: string }> = {
  "EUR/USD": { pipSize: 0.0001, pipValuePerLot: 10, description: "Euro / US Dollar" },
  "GBP/USD": { pipSize: 0.0001, pipValuePerLot: 10, description: "British Pound / US Dollar" },
  "USD/JPY": { pipSize: 0.01, pipValuePerLot: 6.67, description: "US Dollar / Japanese Yen" },
  "AUD/USD": { pipSize: 0.0001, pipValuePerLot: 10, description: "Australian Dollar / US Dollar" },
  "USD/CHF": { pipSize: 0.0001, pipValuePerLot: 10, description: "US Dollar / Swiss Franc" },
  "USD/CAD": { pipSize: 0.0001, pipValuePerLot: 7.35, description: "US Dollar / Canadian Dollar" },
  "NZD/USD": { pipSize: 0.0001, pipValuePerLot: 10, description: "New Zealand Dollar / US Dollar" },
  "EUR/GBP": { pipSize: 0.0001, pipValuePerLot: 12.5, description: "Euro / British Pound" },
};

const STANDARD_LOT = 100000;
const MINI_LOT = 10000;
const MICRO_LOT = 1000;

// ─── Utility ─────────────────────────────────────────────────────────────────

function formatNumber(num: number, decimals = 2): string {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getLotBreakdown(lots: number): { standard: number; mini: number; micro: number } {
  const standard = Math.floor(lots);
  const remainingAfterStandard = (lots - standard) * 10;
  const mini = Math.floor(remainingAfterStandard);
  const remainingAfterMini = (remainingAfterStandard - mini) * 10;
  const micro = Math.round(remainingAfterMini);
  return { standard, mini, micro };
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  unit,
  color = "emerald",
  icon,
  subtext,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: "emerald" | "red" | "blue" | "amber" | "purple";
  icon: React.ReactNode;
  subtext?: string;
}) {
  const colorMap = {
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
    red: "text-red-400 border-red-500/30 bg-red-500/5",
    blue: "text-blue-400 border-blue-500/30 bg-blue-500/5",
    amber: "text-amber-400 border-amber-500/30 bg-amber-500/5",
    purple: "text-purple-400 border-purple-500/30 bg-purple-500/5",
  };

  return (
    <div className={`metric-card rounded-xl p-5 border ${colorMap[color]}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={colorMap[color].split(" ")[0]}>{icon}</span>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold ${colorMap[color].split(" ")[0]}`}>{value}</span>
        {unit && <span className="text-sm text-gray-500">{unit}</span>}
      </div>
      {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
    </div>
  );
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  step,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  step?: string;
  min?: string;
  max?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-400">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            {prefix}
          </span>
        )}
        <input
          type="number"
          className={`input-field ${prefix ? "pl-8" : ""} ${suffix ? "pr-12" : ""}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={step || "any"}
          min={min}
          max={max}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function RiskMeter({ percentage }: { percentage: number }) {
  const getColor = () => {
    if (percentage <= 1) return "bg-emerald-500";
    if (percentage <= 2) return "bg-amber-500";
    return "bg-red-500";
  };

  const getLabel = () => {
    if (percentage <= 1) return "Conservative";
    if (percentage <= 2) return "Moderate";
    if (percentage <= 5) return "Aggressive";
    return "Very High Risk";
  };

  const getTextColor = () => {
    if (percentage <= 1) return "text-emerald-400";
    if (percentage <= 2) return "text-amber-400";
    return "text-red-400";
  };

  const width = Math.min(percentage * 10, 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-400">Risk Level</span>
        <span className={`text-xs font-semibold ${getTextColor()}`}>{getLabel()}</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColor()}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function LotSizeVisualizer({ lots }: { lots: number }) {
  const breakdown = getLotBreakdown(lots);
  const totalUnits = Math.round(lots * STANDARD_LOT);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="text-lg font-bold text-emerald-400">{breakdown.standard}</div>
          <div className="text-xs text-gray-500">Standard</div>
        </div>
        <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="text-lg font-bold text-blue-400">{breakdown.mini}</div>
          <div className="text-xs text-gray-500">Mini</div>
        </div>
        <div className="text-center p-3 bg-gray-900/50 rounded-lg border border-gray-800">
          <div className="text-lg font-bold text-purple-400">{breakdown.micro}</div>
          <div className="text-xs text-gray-500">Micro</div>
        </div>
      </div>
      <div className="text-center text-xs text-gray-500">
        Total: <span className="text-gray-300 font-medium">{totalUnits.toLocaleString()}</span> units
      </div>
    </div>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────

export default function App() {
  const [accountBalance, setAccountBalance] = useState("10000");
  const [riskPercentage, setRiskPercentage] = useState("1");
  const [entryPrice, setEntryPrice] = useState("1.0850");
  const [stopLossPrice, setStopLossPrice] = useState("1.0800");
  const [takeProfitPrice, setTakeProfitPrice] = useState("1.0950");
  const [selectedPair, setSelectedPair] = useState("EUR/USD");
  const [tradeDirection, setTradeDirection] = useState<"buy" | "sell">("buy");

  const calculate = useCallback((): CalculationResult => {
    const balance = parseFloat(accountBalance);
    const risk = parseFloat(riskPercentage);
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(stopLossPrice);
    const tp = parseFloat(takeProfitPrice);

    if (isNaN(balance) || isNaN(risk) || isNaN(entry) || isNaN(sl) || isNaN(tp)) {
      return {
        riskAmount: 0,
        stopLossPips: 0,
        takeProfitPips: 0,
        riskRewardRatio: 0,
        lotSize: 0,
        units: 0,
        potentialProfit: 0,
        potentialLoss: 0,
        pipValue: 0,
        isValid: false,
      };
    }

    const config = PAIR_CONFIG[selectedPair];
    const riskAmount = (balance * risk) / 100;

    // Calculate pips based on direction
    let slPips: number;
    let tpPips: number;

    if (tradeDirection === "buy") {
      slPips = Math.abs(entry - sl) / config.pipSize;
      tpPips = Math.abs(tp - entry) / config.pipSize;
    } else {
      slPips = Math.abs(sl - entry) / config.pipSize;
      tpPips = Math.abs(entry - tp) / config.pipSize;
    }

    if (slPips === 0) {
      return {
        riskAmount,
        stopLossPips: 0,
        takeProfitPips: tpPips,
        riskRewardRatio: 0,
        lotSize: 0,
        units: 0,
        potentialProfit: 0,
        potentialLoss: riskAmount,
        pipValue: config.pipValuePerLot,
        isValid: false,
      };
    }

    // Position size calculation
    // Risk Amount = Lot Size × SL Pips × Pip Value per Lot
    // Lot Size = Risk Amount / (SL Pips × Pip Value per Lot)
    const pipValuePerLot = config.pipValuePerLot;
    const lotSize = riskAmount / (slPips * pipValuePerLot);
    const units = Math.round(lotSize * STANDARD_LOT);
    const rrRatio = tpPips / slPips;
    const potentialProfit = lotSize * tpPips * pipValuePerLot;

    return {
      riskAmount,
      stopLossPips: slPips,
      takeProfitPips: tpPips,
      riskRewardRatio: rrRatio,
      lotSize: Math.round(lotSize * 100) / 100,
      units,
      potentialProfit,
      potentialLoss: riskAmount,
      pipValue: pipValuePerLot,
      isValid: true,
    };
  }, [accountBalance, riskPercentage, entryPrice, stopLossPrice, takeProfitPrice, selectedPair, tradeDirection]);

  const result = useMemo(() => calculate(), [calculate]);

  const getRRColor = () => {
    if (result.riskRewardRatio >= 3) return "text-emerald-400";
    if (result.riskRewardRatio >= 2) return "text-blue-400";
    if (result.riskRewardRatio >= 1) return "text-amber-400";
    return "text-red-400";
  };

  const getRRLabel = () => {
    if (result.riskRewardRatio >= 3) return "Excellent";
    if (result.riskRewardRatio >= 2) return "Good";
    if (result.riskRewardRatio >= 1) return "Acceptable";
    return "Poor";
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/50 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Forex Calculator</h1>
                <p className="text-xs text-gray-500">Position Size & Risk Management</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="pulse-dot inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="text-xs text-gray-500">Live Calculator</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-5 space-y-6">
            {/* Pair Selector */}
            <div className="card-gradient rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Trading Pair
              </h2>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {Object.keys(PAIR_CONFIG).map((pair) => (
                  <button
                    key={pair}
                    onClick={() => setSelectedPair(pair)}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                      selectedPair === pair
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600"
                    }`}
                  >
                    {pair}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500">{PAIR_CONFIG[selectedPair].description}</p>

              {/* Direction Toggle */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setTradeDirection("buy")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    tradeDirection === "buy"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  ▲ BUY / LONG
                </button>
                <button
                  onClick={() => setTradeDirection("sell")}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    tradeDirection === "sell"
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-gray-800/50 text-gray-400 border border-gray-700/50 hover:border-gray-600"
                  }`}
                >
                  ▼ SELL / SHORT
                </button>
              </div>
            </div>

            {/* Account Settings */}
            <div className="card-gradient rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Account Settings
              </h2>
              <div className="space-y-4">
                <InputField
                  label="Account Balance"
                  value={accountBalance}
                  onChange={setAccountBalance}
                  placeholder="10000"
                  prefix="$"
                  min="0"
                />
                <InputField
                  label="Risk Per Trade"
                  value={riskPercentage}
                  onChange={setRiskPercentage}
                  placeholder="1"
                  suffix="%"
                  min="0.1"
                  max="100"
                  step="0.1"
                />
                <RiskMeter percentage={parseFloat(riskPercentage) || 0} />
              </div>
            </div>

            {/* Trade Setup */}
            <div className="card-gradient rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Trade Setup
              </h2>
              <div className="space-y-4">
                <InputField
                  label="Entry Price"
                  value={entryPrice}
                  onChange={setEntryPrice}
                  placeholder="1.0850"
                  step="0.0001"
                />
                <InputField
                  label="Stop Loss Price"
                  value={stopLossPrice}
                  onChange={setStopLossPrice}
                  placeholder="1.0800"
                  step="0.0001"
                />
                <InputField
                  label="Take Profit Price"
                  value={takeProfitPrice}
                  onChange={setTakeProfitPrice}
                  placeholder="1.0950"
                  step="0.0001"
                />
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-7 space-y-6">
            {/* Primary Result - Lot Size */}
            <div className={`rounded-2xl p-6 border ${result.lotSize > 0 ? "border-emerald-500/30 bg-emerald-500/5" : "border-gray-800 bg-gray-900/30"}`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Recommended Position Size
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  tradeDirection === "buy"
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-red-500/20 text-red-400"
                }`}>
                  {tradeDirection === "buy" ? "▲ BUY" : "▼ SELL"} {selectedPair}
                </span>
              </div>

              <div className="text-center py-4">
                <div className="text-5xl font-bold gradient-text mb-2">
                  {result.isValid ? formatNumber(result.lotSize, 2) : "0.00"}
                </div>
                <div className="text-lg text-gray-400">Standard Lots</div>
                <div className="text-sm text-gray-500 mt-1">
                  {PAIR_CONFIG[selectedPair].pipValuePerLot}/pip per standard lot
                </div>
              </div>

              <LotSizeVisualizer lots={result.isValid ? result.lotSize : 0} />
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <MetricCard
                label="Risk Amount"
                value={`$${formatNumber(result.riskAmount)}`}
                color="red"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
                subtext={`${riskPercentage}% of balance`}
              />
              <MetricCard
                label="Stop Loss"
                value={result.isValid ? formatNumber(result.stopLossPips, 1) : "0"}
                unit="pips"
                color="amber"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              />
              <MetricCard
                label="Take Profit"
                value={result.isValid ? formatNumber(result.takeProfitPips, 1) : "0"}
                unit="pips"
                color="emerald"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <MetricCard
                label="Risk:Reward"
                value={result.isValid ? `1:${formatNumber(result.riskRewardRatio, 2)}` : "—"}
                color={result.riskRewardRatio >= 2 ? "emerald" : result.riskRewardRatio >= 1 ? "amber" : "red"}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                }
                subtext={result.isValid ? getRRLabel() : undefined}
              />
              <MetricCard
                label="Potential Profit"
                value={`$${formatNumber(result.potentialProfit)}`}
                color="emerald"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
              />
              <MetricCard
                label="Max Loss"
                value={`$${formatNumber(result.potentialLoss)}`}
                color="red"
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                }
              />
            </div>

            {/* Trade Summary */}
            <div className="card-gradient rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Trade Summary
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">Pair</span>
                  <span className="text-sm font-medium text-white">{selectedPair}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">Direction</span>
                  <span className={`text-sm font-medium ${tradeDirection === "buy" ? "text-emerald-400" : "text-red-400"}`}>
                    {tradeDirection === "buy" ? "BUY (Long)" : "SELL (Short)"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">Entry Price</span>
                  <span className="text-sm font-medium text-white">{entryPrice}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">Stop Loss</span>
                  <span className="text-sm font-medium text-red-400">{stopLossPrice}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">Take Profit</span>
                  <span className="text-sm font-medium text-emerald-400">{takeProfitPrice}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">Lot Size</span>
                  <span className="text-sm font-bold text-emerald-400">{result.isValid ? formatNumber(result.lotSize, 2) : "0.00"} lots</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">Units</span>
                  <span className="text-sm font-medium text-white">{result.units.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-800/50">
                  <span className="text-sm text-gray-400">Pip Value (per lot)</span>
                  <span className="text-sm font-medium text-white">${result.pipValue}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-400">Risk:Reward Ratio</span>
                  <span className={`text-sm font-bold ${getRRColor()}`}>
                    {result.isValid ? `1 : ${formatNumber(result.riskRewardRatio, 2)}` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual R:R Bar */}
            {result.isValid && result.riskRewardRatio > 0 && (
              <div className="card-gradient rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                  Risk vs Reward Visualization
                </h2>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Risk (SL)</span>
                      <span>{formatNumber(result.stopLossPips, 1)} pips</span>
                    </div>
                    <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.min((result.stopLossPips / (result.stopLossPips + result.takeProfitPips)) * 100, 100)}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          ${formatNumber(result.potentialLoss)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Reward (TP)</span>
                      <span>{formatNumber(result.takeProfitPips, 1)} pips</span>
                    </div>
                    <div className="h-6 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full flex items-center justify-end pr-2"
                        style={{ width: `${Math.min((result.takeProfitPips / (result.stopLossPips + result.takeProfitPips)) * 100, 100)}%` }}
                      >
                        <span className="text-xs text-white font-medium">
                          ${formatNumber(result.potentialProfit)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            ⚠️ This calculator is for educational purposes only. Always verify calculations before placing trades.
            Forex trading involves significant risk of loss.
          </p>
        </div>
      </main>
    </div>
  );
}
