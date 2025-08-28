"use client";

import { useEffect, useMemo, useState } from "react";
import Script from "next/script";

type CalculatorState = {
  targetMonthlyRevenue: number;
  pricePerClient: number;
  videosPerMonth: number;
  avgViewsPerVideo: number;
  viewToBookingRatePct: number; // 0.5–2 UI, stored as percent
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
  // Align displayed New MRR with the rounded "New Clients/Month" metric
  const newClientsRounded = Math.round(newClientsPerMonth);
  const newMRR = newClientsRounded * s.pricePerClient;
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
      pricePerClient: numberFromQuery(q, "pricePerClient", 500),
      videosPerMonth: numberFromQuery(q, "videosPerMonth", 12),
      avgViewsPerVideo: numberFromQuery(q, "avgViewsPerVideo", 1000),
      viewToBookingRatePct: numberFromQuery(q, "viewToBookingRatePct", 0.8),
      showRatePct: numberFromQuery(q, "showRatePct", 60),
      closeRatePct: numberFromQuery(q, "closeRatePct", 40),
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
            min={0.5}
            max={2}
            step={0.1}
            help="Benchmark: 0.5–2%"
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
          {/* Share box removed */}
        </section>
      </div>

      <div className="mt-8 rounded-lg border border-white/15 p-5 bg-white/5">
        <h3 className="font-medium mb-2">Get the full YouTube-to-Revenue Playbook</h3>
        <p className="text-sm text-white/70 mb-3">Enter your email to get our best practices for faith driven fitness coaching offers, will only be sharing future resources here</p>
        <ConvertKitForm />
      </div>
    </div>
  );
}

function LabeledNumber(props: { label: string; value: number; onChange: (v: number) => void; min?: number; step?: number }) {
  const [text, setText] = useState<string>(String(props.value));

  // Keep local text in sync when value changes externally
  useEffect(() => {
    setText(String(props.value));
  }, [props.value]);

  const commitIfValid = (valueStr: string) => {
    if (valueStr === "") return; // allow empty while typing
    const next = Number(valueStr);
    if (Number.isFinite(next)) {
      props.onChange(next);
    }
  };

  const handleBlur = () => {
    if (text === "") {
      const fallback = props.min ?? 0;
      setText(String(fallback));
      props.onChange(fallback);
    } else {
      commitIfValid(text);
    }
  };

  return (
    <label className="flex flex-col gap-1 mb-3">
      <span className="text-sm text-white/80">{props.label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={text}
        min={props.min}
        step={props.step}
        onChange={(e) => {
          const v = e.target.value;
          setText(v);
          // Update parent as the user types when a number is parsable
          commitIfValid(v);
        }}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={handleBlur}
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

// Share component removed

function ConvertKitForm() {
  const html = `
<form action="https://app.kit.com/forms/8465972/subscriptions" class="seva-form formkit-form" method="post" data-sv-form="8465972" data-uid="b42dc6796e" data-format="inline" data-version="5" data-options="{&quot;settings&quot;:{&quot;after_subscribe&quot;:{&quot;action&quot;:&quot;message&quot;,&quot;success_message&quot;:&quot;Success! Now check your email to confirm your subscription.&quot;,&quot;redirect_url&quot;:&quot;&quot;},&quot;analytics&quot;:{&quot;google&quot;:null,&quot;fathom&quot;:null,&quot;facebook&quot;:null,&quot;segment&quot;:null,&quot;pinterest&quot;:null,&quot;sparkloop&quot;:null,&quot;googletagmanager&quot;:null},&quot;modal&quot;:{&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15},&quot;powered_by&quot;:{&quot;show&quot;:false,&quot;url&quot;:&quot;https://kit.com/features/forms?utm_campaign=poweredby&amp;utm_content=form&amp;utm_medium=referral&amp;utm_source=dynamic&quot;},&quot;recaptcha&quot;:{&quot;enabled&quot;:false},&quot;return_visitor&quot;:{&quot;action&quot;:&quot;show&quot;,&quot;custom_content&quot;:&quot;&quot;},&quot;slide_in&quot;:{&quot;display_in&quot;:&quot;bottom_right&quot;,&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15},&quot;sticky_bar&quot;:{&quot;display_in&quot;:&quot;top&quot;,&quot;trigger&quot;:&quot;timer&quot;,&quot;scroll_percentage&quot;:null,&quot;timer&quot;:5,&quot;devices&quot;:&quot;all&quot;,&quot;show_once_every&quot;:15}},&quot;version&quot;:&quot;5&quot;}" min-width="400 500 600 700 800"><div data-style="clean"><ul class="formkit-alert formkit-alert-error" data-element="errors" data-group="alert"></ul><div data-element="fields" data-stacked="false" class="seva-fields formkit-fields"><div class="formkit-field"><input class="formkit-input" name="email_address" aria-label="Email Address" placeholder="Email Address" required="" type="email" style="color: rgb(0, 0, 0); border-color: rgb(227, 227, 227); border-radius: 4px; font-weight: 400;"></div><button data-element="submit" class="formkit-submit formkit-submit" style="color: rgb(255, 255, 255); background-color: rgb(255, 84, 3); border-radius: 4px; font-weight: 400;"><div class="formkit-spinner"><div></div><div></div><div></div></div><span class="">Subscribe</span></button></div></div><style>.formkit-form[data-uid="b42dc6796e"] *{box-sizing:border-box;}.formkit-form[data-uid="b42dc6796e"]{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}.formkit-form[data-uid="b42dc6796e"] legend{border:none;font-size:inherit;margin-bottom:10px;padding:0;position:relative;display:table;}.formkit-form[data-uid="b42dc6796e"] fieldset{border:0;padding:0.01em 0 0 0;margin:0;min-width:0;}.formkit-form[data-uid="b42dc6796e"] body:not(:-moz-handler-blocked) fieldset{display:table-cell;}.formkit-form[data-uid="b42dc6796e"] h1,.formkit-form[data-uid="b42dc6796e"] h2,.formkit-form[data-uid="b42dc6796e"] h3,.formkit-form[data-uid="b42dc6796e"] h4,.formkit-form[data-uid="b42dc6796e"] h5,.formkit-form[data-uid="b42dc6796e"] h6{color:inherit;font-size:inherit;font-weight:inherit;}.formkit-form[data-uid="b42dc6796e"] h2{font-size:1.5em;margin:1em 0;}.formkit-form[data-uid="b42dc6796e"] h3{font-size:1.17em;margin:1em 0;}.formkit-form[data-uid="b42dc6796e"] p{color:inherit;font-size:inherit;font-weight:inherit;}.formkit-form[data-uid="b42dc6796e"] ol:not([template-default]),.formkit-form[data-uid="b42dc6796e"] ul:not([template-default]),.formkit-form[data-uid="b42dc6796e"] blockquote:not([template-default]){text-align:left;}.formkit-form[data-uid="b42dc6796e"] p:not([template-default]),.formkit-form[data-uid="b42dc6796e"] hr:not([template-default]),.formkit-form[data-uid="b42dc6796e"] blockquote:not([template-default]),.formkit-form[data-uid="b42dc6796e"] ol:not([template-default]),.formkit-form[data-uid="b42dc6796e"] ul:not([template-default]){color:inherit;font-style:initial;}.formkit-form[data-uid="b42dc6796e"] .ordered-list,.formkit-form[data-uid="b42dc6796e"] .unordered-list{list-style-position:outside !important;padding-left:1em;}.formkit-form[data-uid="b42dc6796e"] .list-item{padding-left:0;}.formkit-form[data-uid="b42dc6796e"][data-format="modal"]{display:none;}.formkit-form[data-uid="b42dc6796e"][data-format="slide in"]{display:none;}.formkit-form[data-uid="b42dc6796e"][data-format="sticky bar"]{display:none;}.formkit-sticky-bar .formkit-form[data-uid="b42dc6796e"][data-format="sticky bar"]{display:block;}.formkit-form[data-uid="b42dc6796e"] .formkit-input,.formkit-form[data-uid="b42dc6796e"] .formkit-select,.formkit-form[data-uid="b42dc6796e"] .formkit-checkboxes{width:100%;}.formkit-form[data-uid="b42dc6796e"] .formkit-button,.formkit-form[data-uid="b42dc6796e"] .formkit-submit{border:0;border-radius:5px;color:#ffffff;cursor:pointer;display:inline-block;text-align:center;font-size:15px;font-weight:500;cursor:pointer;margin-bottom:15px;overflow:hidden;padding:0;position:relative;vertical-align:middle;}.formkit-form[data-uid="b42dc6796e"] .formkit-button:hover,.formkit-form[data-uid="b42dc6796e"] .formkit-submit:hover,.formkit-form[data-uid="b42dc6796e"] .formkit-button:focus,.formkit-form[data-uid="b42dc6796e"] .formkit-submit:focus{outline:none;}.formkit-form[data-uid="b42dc6796e"] .formkit-button:hover > span,.formkit-form[data-uid="b42dc6796e"] .formkit-submit:hover > span,.formkit-form[data-uid="b42dc6796e"] .formkit-button:focus > span,.formkit-form[data-uid="b42dc6796e"] .formkit-submit:focus > span{background-color:rgba(0,0,0,0.1);}.formkit-form[data-uid="b42dc6796e"] .formkit-button > span,.formkit-form[data-uid="b42dc6796e"] .formkit-submit > span{display:block;-webkit-transition:all 300ms ease-in-out;transition:all 300ms ease-in-out;padding:12px 24px;}.formkit-form[data-uid="b42dc6796e"] .formkit-input{background:#ffffff;font-size:15px;padding:12px;border:1px solid #e3e3e3;-webkit-flex:1 0 auto;-ms-flex:1 0 auto;flex:1 0 auto;line-height:1.4;margin:0;-webkit-transition:border-color ease-out 300ms;transition:border-color ease-out 300ms;}.formkit-form[data-uid="b42dc6796e"] .formkit-input:focus{outline:none;border-color:#1677be;-webkit-transition:border-color ease 300ms;transition:border-color ease 300ms;}.formkit-form[data-uid="b42dc6796e"] .formkit-input::placeholder{color:inherit;opacity:0.8;}.formkit-form[data-uid="b42dc6796e"] [data-group="dropdown"]{position:relative;display:inline-block;width:100%;}.formkit-form[data-uid="b42dc6796e"] [data-group="dropdown"]::before{content:"";top:calc(50% - 2.5px);right:10px;position:absolute;pointer-events:none;border-color:#4f4f4f transparent transparent transparent;border-style:solid;border-width:6px 6px 0 6px;height:0;width:0;z-index:999;}.formkit-form[data-uid="b42dc6796e"] [data-group="dropdown"] select{height:auto;width:100%;cursor:pointer;color:#333333;line-height:1.4;margin-bottom:0;padding:0 6px;-webkit-appearance:none;-moz-appearance:none;appearance:none;font-size:15px;padding:12px;padding-right:25px;border:1px solid #e3e3e3;background:#ffffff;}.formkit-form[data-uid="b42dc6796e"] [data-group="dropdown"] select:focus{outline:none;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"]{text-align:left;margin:0;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"]{margin-bottom:10px;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] *{cursor:pointer;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] input[type="checkbox"]{display:none;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] input[type="checkbox"] + label::after{content:none;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] input[type="checkbox"]:checked + label::after{border-color:#ffffff;content:"";}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] input[type="checkbox"]:checked + label::before{background:#10bf7a;border-color:#10bf7a;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] label{position:relative;display:inline-block;padding-left:28px;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] label::before,.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] label::after{position:absolute;content:"";display:inline-block;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] label::before{height:16px;width:16px;border:1px solid #e3e3e3;background:#ffffff;left:0px;top:3px;}.formkit-form[data-uid="b42dc6796e"] [data-group="checkboxes"] [data-group="checkbox"] label::after{height:4px;width:8px;border-left:2px solid #4d4d4d;border-bottom:2px solid #4d4d4d;-webkit-transform:rotate(-45deg);-ms-transform:rotate(-45deg);transform:rotate(-45deg);left:4px;top:8px;}.formkit-form[data-uid="b42dc6796e"] .formkit-alert{background:#f9fafb;border:1px solid #e3e3e3;border-radius:5px;-webkit-flex:1 0 auto;-ms-flex:1 0 auto;flex:1 0 auto;list-style:none;margin:25px auto;padding:12px;text-align:center;width:100%;}.formkit-form[data-uid="b42dc6796e"] .formkit-alert:empty{display:none;}.formkit-form[data-uid="b42dc6796e"] .formkit-alert-success{background:#d3fbeb;border-color:#10bf7a;color:#0c905c;}.formkit-form[data-uid="b42dc6796e"] .formkit-alert-error{background:#fde8e2;border-color:#f2643b;color:#ea4110;}.formkit-form[data-uid="b42dc6796e"] .formkit-spinner{display:flex;height:0px;width:0px;margin:0 auto;position:absolute;top:0;left:0;right:0;width:0px;overflow:hidden;text-align:center;transition:all 300ms ease-in-out;}.formkit-form[data-uid="b42dc6796e"] .formkit-spinner > div{margin:auto;width:12px;height:12px;background-color:#fff;opacity:0.3;border-radius:100%;display:inline-block;animation:formkit-bouncedelay-formkit-form-data-uid-b42dc6796e- 1.4s infinite ease-in-out both;}.formkit-form[data-uid="b42dc6796e"] .formkit-spinner > div:nth-child(1){animation-delay:-0.32s;}.formkit-form[data-uid="b42dc6796e"] .formkit-spinner > div:nth-child(2){animation-delay:-0.16s;}.formkit-form[data-uid="b42dc6796e"] .formkit-submit[data-active] .formkit-spinner{opacity:1;height:100%;width:50px;}.formkit-form[data-uid="b42dc6796e"] .formkit-submit[data-active] .formkit-spinner ~ span{opacity:0;}.formkit-form[data-uid="b42dc6796e"] .formkit-powered-by[data-active="false"]{opacity:0.35;}.formkit-form[data-uid="b42dc6796e"] .formkit-powered-by-convertkit-container{display:flex;width:100%;margin:10px 0;position:relative;}.formkit-form[data-uid="b42dc6796e"] .formkit-powered-by-convertkit-container[data-active="false"]{opacity:0.35;}.formkit-form[data-uid="b42dc6796e"] .formkit-powered-by-convertkit{align-items:center;background-color:#ffffff;border-radius:9px;color:#3d3d3d;cursor:pointer;display:block;height:36px;margin:0 auto;opacity:0.95;padding:0;text-decoration:none;text-indent:100%;transition:ease-in-out all 200ms;white-space:nowrap;overflow:hidden;user-select:none;width:157px;background-repeat:no-repeat;background-position:center;}.formkit-form[data-uid="b42dc6796e"] .formkit-powered-by-convertkit:hover,.formkit-form[data-uid="b42dc6796e"] .formkit-powered-by-convertkit:focus{background-color:#ffffff;transform:scale(1.025) perspective(1px);opacity:1;}.formkit-form[data-uid="b42dc6796e"] .formkit-powered-by-convertkit[data-variant="dark"],.formkit-form[data-uid="b42dc6796e"] .formkit-powered-by-convertkit[data-variant="light"]{background-color:transparent;border-color:transparent;width:133px;} </style></form>`;
  return (
    <div className="ck-embed">
      <Script src="https://f.convertkit.com/ckjs/ck.5.js" strategy="afterInteractive" />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
