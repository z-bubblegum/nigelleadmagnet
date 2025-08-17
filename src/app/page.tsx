"use client";

import { useEffect, useMemo, useState } from "react";

type CalculatorState = {
  targetMonthlyRevenue: number;
  pricePerClient: number;
  videosPerMonth: number;
  avgViewsPerVideo: number;
  viewToBookingRatePct: number; // 0.1-5 UI, stored as percent
  showRatePct: number; // 0-100 UI, stored as percent
  closeRatePct: number; // 0-100 UI, stored as percent
};

function computeProjection(s: CalculatorState) {
  const viewToBookingRate = s.viewToBookingRatePct / 100;
  const showRate = s.showRatePct / 100;
  const closeRate = s.closeRatePct / 100;
  const clientsNeeded = Math.ceil(
    s.targetMonthlyRevenue / Math.max(1, s.pricePerClient)
  );
  const monthlyReach = s.videosPerMonth * s.avgViewsPerVideo;
  const bookingsPerMonth = monthlyReach * viewToBookingRate;
  const showsPerMonth = bookingsPerMonth * showRate;
  const newClientsPerMonth = showsPerMonth * closeRate;
  const newMRR = newClientsPerMonth * s.pricePerClient;
  const monthsToGoal = newClientsPerMonth > 0
    ? Math.ceil(clientsNeeded / newClientsPerMonth)
    : Infinity;
  return {
    clientsNeeded,
    monthlyReach,
    bookingsPerMonth,
    showsPerMonth,
    newClientsPerMonth,
    newMRR,
    monthsToGoal,
  };
}

function numberFromQuery(query: URLSearchParams, key: keyof CalculatorState, fallback: number) {
  const raw = query.get(String(key));
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function formatInt(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function formatPct(n: number) {
  return `${Math.round(n)}%`;
}

function formatPct1(n: number) {
  return `${n.toFixed(1)}%`;
}

export default function Home() {
  const [state, setState] = useState<CalculatorState>(() => {
    const q = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
    return {
      targetMonthlyRevenue: numberFromQuery(q, "targetMonthlyRevenue", 50000),
      pricePerClient: numberFromQuery(q, "pricePerClient", 2000),
      videosPerMonth: numberFromQuery(q, "videosPerMonth", 12),
      avgViewsPerVideo: numberFromQuery(q, "avgViewsPerVideo", 1500),
      viewToBookingRatePct: numberFromQuery(q, "viewToBookingRatePct", 2),
      showRatePct: numberFromQuery(q, "showRatePct", 70),
      closeRatePct: numberFromQuery(q, "closeRatePct", 25),
    };
  });

  useEffect(() => {
    const q = new URLSearchParams();
    Object.entries(state).forEach(([k, v]) => q.set(k, String(v)));
    const url = `${window.location.pathname}?${q.toString()}`;
    window.history.replaceState({}, "", url);
  }, [state]);

  const result = useMemo(() => computeProjection(state), [state]);

  return (
    <div className="min-h-screen p-6 sm:p-10 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-6">PRJCT ZENITH GROWTH CALCULATOR</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-lg border border-white/15 p-5 bg-white/5">
          <h2 className="text-lg font-medium mb-4">Goal</h2>
          <LabeledNumber
            label="Target Monthly Revenue ($)"
            value={state.targetMonthlyRevenue}
            onChange={(v) => setState((s) => ({ ...s, targetMonthlyRevenue: v }))}
            min={1000}
            step={500}
          />
          <LabeledNumber
            label="Price Per Client ($/month)"
            value={state.pricePerClient}
            onChange={(v) => setState((s) => ({ ...s, pricePerClient: v }))}
            min={100}
            step={50}
          />
          <div className="mt-3 text-sm text-white/70">Clients needed: <span className="text-white font-medium">{formatInt(result.clientsNeeded)}</span></div>
        </section>

        <section className="rounded-lg border border-white/15 p-5 bg-white/5">
          <h2 className="text-lg font-medium mb-4">Content</h2>
          <LabeledNumber
            label="Videos Per Month"
            value={state.videosPerMonth}
            onChange={(v) => setState((s) => ({ ...s, videosPerMonth: v }))}
            min={0}
            step={1}
          />
          <LabeledNumber
            label="Average Views Per Video"
            value={state.avgViewsPerVideo}
            onChange={(v) => setState((s) => ({ ...s, avgViewsPerVideo: v }))}
            min={0}
            step={50}
          />
          <div className="mt-3 text-sm text-white/70">Monthly reach: <span className="text-white font-medium">{formatInt(result.monthlyReach)}</span></div>
        </section>

        <section className="rounded-lg border border-white/15 p-5 bg-white/5">
          <h2 className="text-lg font-medium mb-4">Conversion</h2>
          <LabeledSlider
            label={`View → Booking Rate (${formatPct1(state.viewToBookingRatePct)})`}
            value={state.viewToBookingRatePct}
            onChange={(v) => setState((s) => ({ ...s, viewToBookingRatePct: v }))}
            min={0.1}
            max={5}
            step={0.1}
            help="Benchmark: 1–5%"
          />
          <LabeledSlider
            label={`Sales Call Show Rate (${formatPct(state.showRatePct)})`}
            value={state.showRatePct}
            onChange={(v) => setState((s) => ({ ...s, showRatePct: v }))}
            min={0}
            max={100}
            step={0.5}
            help="Benchmark: 60–80%"
          />
          <LabeledSlider
            label={`Sales Call Close Rate (${formatPct(state.closeRatePct)})`}
            value={state.closeRatePct}
            onChange={(v) => setState((s) => ({ ...s, closeRatePct: v }))}
            min={0}
            max={100}
            step={0.5}
            help="Benchmark: 20–40%"
          />
        </section>

        <section className="rounded-lg border border-white/15 p-5 bg-white/5">
          <h2 className="text-lg font-medium mb-4">Projection</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Bookings/Month" value={formatInt(result.bookingsPerMonth)} />
            <Metric label="Shows/Month" value={formatInt(result.showsPerMonth)} />
            <Metric label="New Clients/Month" value={formatInt(result.newClientsPerMonth)} />
            <Metric label="New MRR" value={formatUsd(result.newMRR)} />
            <Metric label="Months to Goal" value={result.monthsToGoal === Infinity ? "—" : formatInt(result.monthsToGoal)} />
          </div>
          <Share url={typeof window !== "undefined" ? window.location.href : ""} />
        </section>
      </div>

      <div className="mt-8 rounded-lg border border-white/15 p-5 bg-white/5">
        <h3 className="font-medium mb-2">Get the full YouTube-to-Revenue Playbook</h3>
        <p className="text-sm text-white/70 mb-3">Enter your email to get a PDF summary of your numbers plus our best practices for fitness coaching offers.</p>
        <EmailCapture />
      </div>
    </div>
  );
}

function LabeledNumber(props: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  return (
    <label className="flex flex-col gap-1 mb-3">
      <span className="text-sm text-white/80">{props.label}</span>
      <input
        type="number"
        value={Number.isFinite(props.value) ? props.value : 0}
        min={props.min}
        step={props.step}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="bg-transparent rounded-md border border-white/20 px-3 py-2 outline-none focus:border-white/40"
      />
    </label>
  );
}

function LabeledSlider(props: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; help?: string }) {
  return (
    <div className="mb-4">
      <div className="flex items-end justify-between mb-1">
        <span className="text-sm text-white/80">{props.label}</span>
        {props.help ? <span className="text-xs text-white/50">{props.help}</span> : null}
      </div>
      {(() => {
        const percent = Math.max(0, Math.min(100, ((props.value - props.min) / (props.max - props.min)) * 100));
        return (
          <input
            type="range"
            min={props.min}
            max={props.max}
            step={props.step}
            value={props.value}
            onChange={(e) => props.onChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none slider-orange"
            style={{
              backgroundColor: "rgba(255,255,255,0.12)",
              backgroundImage: "linear-gradient(to right, #f97316, #fb923c)",
              backgroundRepeat: "no-repeat",
              backgroundSize: `${percent}% 100%`,
            }}
          />
        );
      })()}
    </div>
  );
}

function Metric(props: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-white/10 p-3 bg-black/10">
      <div className="text-xs uppercase tracking-wide text-white/60">{props.label}</div>
      <div className="text-lg font-semibold">{props.value}</div>
    </div>
  );
}

function Share({ url }: { url: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    } catch {}
  };
  return (
    <div className="mt-4 flex items-center gap-2 text-sm">
      <input readOnly value={url} className="flex-1 bg-transparent rounded-md border border-white/20 px-3 py-2" />
      <button onClick={copy} className="rounded-md border border-white/20 px-3 py-2 hover:border-white/40">Copy</button>
    </div>
  );
}

function EmailCapture() {
  const [email, setEmail] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
      .then(() => alert("Thanks! Check your inbox."))
      .catch(() => alert("Something went wrong. Please try again."));
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 bg-transparent rounded-md border border-white/20 px-3 py-2 outline-none focus:border-white/40"
      />
      <button className="rounded-md border border-white/20 px-3 py-2 hover:border-white/40">Send me the plan</button>
    </form>
  );
}
