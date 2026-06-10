import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  ArrowLeft, Shield, Satellite, FileText, Database,
  CheckCircle2, XCircle, AlertTriangle, ChevronRight, Zap, MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Sicily SVG map ───────────────────────────────────────────────────────────
// Viewport 320×210. Bounding box: lon 12.43–15.65, lat 36.67–38.27
// project(lon, lat) = x=(lon-12.43)/3.22*320, y=(38.27-lat)/1.60*210

function toXY(lon: number, lat: number): [number, number] {
  return [
    ((lon - 12.43) / 3.22) * 320,
    ((38.27 - lat) / 1.60) * 210,
  ];
}

const ETNA_LON = 15.0128, ETNA_LAT = 37.7475;   // Contrada Rovittello
const RAGUSA_LON = 14.7265, RAGUSA_LAT = 36.927; // Ragusa (fraud location)

// Simplified Sicily outline polygon (clockwise from W tip)
const SICILY_POLY = [
  [0,66],[8,50],[20,38],[48,24],[80,14],[115,7],[155,4],
  [195,5],[232,6],[268,4],[295,3],[312,1],[319,3],
  [317,16],[312,30],[305,50],[295,72],[290,95],[288,118],
  [285,138],[278,160],[272,183],[258,203],[240,208],[218,210],
  [195,208],[168,204],[140,200],[112,195],[85,188],[62,177],
  [42,162],[24,144],[12,122],[4,98],[0,66],
].map(([x,y]) => `${x},${y}`).join(" ");

// Etna DOC zone approximate boundary (rough ellipse via polygon)
const ETNA_DOC = (() => {
  const [cx, cy] = toXY(ETNA_LON, ETNA_LAT);
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    pts.push(`${cx + Math.cos(a) * 18},${cy + Math.sin(a) * 14}`);
  }
  return pts.join(" ");
})();

interface SicilyMapProps { showFraud: boolean }

function SicilyMap({ showFraud }: SicilyMapProps) {
  const [ex, ey] = toXY(ETNA_LON, ETNA_LAT);
  const [rx, ry] = toXY(RAGUSA_LON, RAGUSA_LAT);

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0d1f12]">
      {/* Dark satellite texture overlay */}
      <div className="absolute inset-0 opacity-20"
        style={{ backgroundImage: "radial-gradient(ellipse at 70% 30%, #1a4a2a 0%, transparent 60%)" }} />

      <svg viewBox="0 0 320 210" className="w-full" style={{ maxHeight: 220 }}>
        {/* Ocean */}
        <rect width="320" height="210" fill="#0a1a2e" />

        {/* Sicily landmass */}
        <polygon points={SICILY_POLY} fill="#1c3a22" stroke="#2d5a34" strokeWidth="1" />

        {/* Elevation hint for Etna area */}
        <ellipse cx={ex} cy={ey} rx={24} ry={18}
          fill="#243d2a" stroke="none" opacity="0.6" />
        <ellipse cx={ex} cy={ey} rx={14} ry={10}
          fill="#2d5a34" stroke="none" opacity="0.5" />

        {/* Etna DOC zone ring */}
        <polygon points={ETNA_DOC}
          fill="none" stroke="#4ade80" strokeWidth="1"
          strokeDasharray="3,2" opacity="0.5" />

        {/* Distance line (only when showing fraud) */}
        {showFraud && (
          <line x1={ex} y1={ey} x2={rx} y2={ry}
            stroke="#f87171" strokeWidth="1.5"
            strokeDasharray="5,3" opacity="0.7" />
        )}

        {/* Distance label on line */}
        {showFraud && (
          <>
            <rect
              x={(ex + rx) / 2 - 18} y={(ey + ry) / 2 - 9}
              width="36" height="16" rx="3"
              fill="#1a0a0a" stroke="#f87171" strokeWidth="0.5" opacity="0.9" />
            <text
              x={(ex + rx) / 2} y={(ey + ry) / 2 + 3.5}
              textAnchor="middle" fill="#f87171"
              fontSize="8" fontFamily="monospace" fontWeight="bold">
              95 km
            </text>
          </>
        )}

        {/* Etna pin — always shown */}
        <circle cx={ex} cy={ey} r="10"
          fill="#4ade80" fillOpacity="0.15"
          stroke="#4ade80" strokeWidth="1.5" />
        <circle cx={ex} cy={ey} r="4" fill="#4ade80" />
        {/* Pulse ring */}
        <circle cx={ex} cy={ey} r="10"
          fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values="8;16;8" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="3s" repeatCount="indefinite" />
        </circle>

        {/* Etna label */}
        <rect x={ex + 8} y={ey - 14} width="74" height="26" rx="3"
          fill="#0a1a0f" stroke="#4ade80" strokeWidth="0.5" opacity="0.92" />
        <text x={ex + 12} y={ey - 4} fill="#4ade80"
          fontSize="7" fontFamily="monospace" fontWeight="bold">
          Etna DOC Zone
        </text>
        <text x={ex + 12} y={ey + 6} fill="#4ade8099"
          fontSize="6" fontFamily="monospace">
          {ETNA_LAT}°N {ETNA_LON}°E
        </text>

        {/* Ragusa fraud pin — only when showing fraud */}
        {showFraud && (
          <>
            <circle cx={rx} cy={ry} r="10"
              fill="#f87171" fillOpacity="0.15"
              stroke="#f87171" strokeWidth="1.5" />
            <circle cx={rx} cy={ry} r="4" fill="#f87171" />
            {/* X mark */}
            <line x1={rx - 3} y1={ry - 3} x2={rx + 3} y2={ry + 3}
              stroke="#ffffff" strokeWidth="1.2" />
            <line x1={rx + 3} y1={ry - 3} x2={rx - 3} y2={ry + 3}
              stroke="#ffffff" strokeWidth="1.2" />

            {/* Ragusa label */}
            <rect x={rx - 80} y={ry - 14} width="70" height="26" rx="3"
              fill="#1a0a0a" stroke="#f87171" strokeWidth="0.5" opacity="0.92" />
            <text x={rx - 76} y={ry - 4} fill="#f87171"
              fontSize="7" fontFamily="monospace" fontWeight="bold">
              Declared location
            </text>
            <text x={rx - 76} y={ry + 6} fill="#f8717199"
              fontSize="6" fontFamily="monospace">
              {RAGUSA_LAT}°N {RAGUSA_LON}°E
            </text>
          </>
        )}

        {/* Compass */}
        <text x="8" y="18" fill="#ffffff22" fontSize="9" fontFamily="monospace">N↑</text>

        {/* Scale bar */}
        <line x1="8" y1="200" x2="58" y2="200" stroke="#ffffff22" strokeWidth="1" />
        <text x="8" y="208" fill="#ffffff22" fontSize="6" fontFamily="monospace">~50 km</text>
      </svg>

      {/* Map label */}
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm
        rounded px-2 py-0.5 text-[9px] text-white/40 tracking-widest uppercase">
        Sicily · EU GI Zone
      </div>
    </div>
  );
}

// ─── Deforestation visualisation ──────────────────────────────────────────────
// Grid of 15×8 cells showing land cover change

function buildGrid(pct: number, seed: number): boolean[] {
  // Deterministic shuffle so grid looks natural each time
  const cells = Array.from({ length: 120 }, (_, i) => i);
  // Simple seeded shuffle
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(((seed * (i + 1) * 2654435761) >>> 0) % (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  const forestCount = Math.round((pct / 100) * 120);
  const result = new Array(120).fill(false);
  cells.slice(0, forestCount).forEach(i => { result[i] = true; });
  return result;
}

interface DeforestationMapProps {
  pct2020: number;
  pct2024: number;
  compliant: boolean;
}

function DeforestationMap({ pct2020, pct2024, compliant }: DeforestationMapProps) {
  const grid2020 = buildGrid(pct2020, 42);
  const grid2024 = buildGrid(pct2024, 42);

  const Cell = ({ forest, lost }: { forest: boolean; lost: boolean }) => (
    <div className={`rounded-sm transition-colors ${
      forest
        ? "bg-green-600 opacity-80"
        : lost
        ? "bg-orange-700 opacity-90"  // was forest, now cleared
        : "bg-stone-700 opacity-50"   // always cleared
    }`} />
  );

  // Find cells that changed 2020→2024
  const lost = grid2020.map((f, i) => f && !grid2024[i]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#0a1510] p-4">
      <div className="flex gap-4 mb-3">
        {/* 2020 */}
        <div className="flex-1">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-2">
            Sentinel-2 · Dec 2020
          </div>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(15, 1fr)" }}>
            {grid2020.map((f, i) => (
              <div key={i} className={`aspect-square rounded-sm ${f ? "bg-green-600 opacity-80" : "bg-stone-700 opacity-40"}`} />
            ))}
          </div>
          <div className={`mt-2 text-sm font-bold ${compliant ? "text-green-400" : "text-green-400"}`}>
            {pct2020}% forest
          </div>
        </div>

        {/* Arrow */}
        <div className="flex items-center text-white/20 text-xl">→</div>

        {/* 2024 */}
        <div className="flex-1">
          <div className="text-[10px] text-white/30 tracking-widest uppercase mb-2">
            Sentinel-2 · Jan 2024
          </div>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(15, 1fr)" }}>
            {grid2024.map((f, i) => (
              <Cell key={i} forest={f} lost={lost[i]} />
            ))}
          </div>
          <div className={`mt-2 text-sm font-bold ${compliant ? "text-green-400" : "text-red-400"}`}>
            {pct2024}% forest
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-[10px] text-white/30">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-green-600 inline-block" /> Forest
        </span>
        {!compliant && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-orange-700 inline-block" /> Cleared since 2020
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-stone-700 inline-block" /> Non-forest
        </span>
      </div>

      {!compliant && (
        <div className="mt-3 flex items-center gap-2 text-red-400 text-xs">
          <AlertTriangle className="h-3 w-3 flex-shrink-0" />
          {((pct2020 - pct2024) / pct2020 * 100).toFixed(1)}% forest loss detected
          — EUDR baseline violation
        </div>
      )}
    </div>
  );
}

// ─── Demo data ────────────────────────────────────────────────────────────────

const WINE_CASES = [
  {
    id: "w1", label: "Verified producer", verdict: "verified" as const,
    producer: "Benanti Winery", product: "Etna Rosso DOC 2022",
    gps: "37.7475°N  15.0128°E", location: "Contrada Rovittello, Etna Nord",
    regulation: "EU GI Regulation 2024/1143",
    mapShowFraud: false,
    checks: [
      { label: "GPS coordinates", detail: "Contrada Rovittello — verified Etna DOC zone", pass: true },
      { label: "Grape variety", detail: "Nerello Mascalese 100% — matches DOC specification", pass: true },
      { label: "GI on-chain registry", detail: "Producer ID #ET-0047 — active, no violations", pass: true },
      { label: "Declared volume", detail: "12,000 bottles vs registry: 11,847 — within 2% tolerance", pass: true },
    ],
    txHash: "0x3a7f...d91c",
  },
  {
    id: "w2", label: "Fraudulent producer", verdict: "flagged" as const,
    producer: "Vini Meridionali Srl", product: "Etna Rosso DOC 2022",
    gps: "36.9270°N  14.7265°E", location: "Ragusa — 95 km from Etna",
    regulation: "EU GI Regulation 2024/1143",
    mapShowFraud: true,
    checks: [
      { label: "GPS coordinates", detail: "Location is Ragusa — 95 km outside Etna DOC zone ✗", pass: false },
      { label: "Grape variety", detail: "Declared Nerello Mascalese — satellite shows Nero d'Avola parcels ✗", pass: false },
      { label: "GI on-chain registry", detail: "Producer ID not found in Etna DOC registry ✗", pass: false },
      { label: "Declared volume", detail: "50,000 bottles declared vs registry: 0 ✗", pass: false },
    ],
    txHash: "0xb82e...44f1",
  },
];

const SOY_CASES = [
  {
    id: "s1", label: "Compliant supplier", verdict: "verified" as const,
    producer: "Fazenda São Paulo", product: "Certified Soy — Lot #BR-2024-0441",
    gps: "-14.235°S  -51.925°W", location: "Mato Grosso, Brazil",
    regulation: "EUDR Regulation 2023/1115",
    pct2020: 94, pct2024: 92,
    checks: [
      { label: "Forest cover 2020", detail: "94.2% — baseline Dec 31 2020 established", pass: true },
      { label: "Forest cover 2024", detail: "91.8% — 2.4% delta, within threshold. No deforestation detected", pass: true },
      { label: "EUDR due diligence", detail: "Statement #DD-2024-BR-0441 submitted and verified", pass: true },
      { label: "Carbon registry", detail: "Toucan Protocol — 1,240 tCO₂e retired on-chain", pass: true },
    ],
    txHash: "0x91cc...f207",
  },
  {
    id: "s2", label: "Non-compliant supplier", verdict: "flagged" as const,
    producer: "AgriSoy Export Ltd", product: "Commodity Soy — Lot #BR-2024-0819",
    gps: "-12.500°S  -54.300°W", location: "Pará, Brazil",
    regulation: "EUDR Regulation 2023/1115",
    pct2020: 87, pct2024: 43,
    checks: [
      { label: "Forest cover 2020", detail: "87.3% — baseline Dec 31 2020", pass: true },
      { label: "Forest cover 2024", detail: "43.1% — 50.6% loss detected. Deforestation confirmed ✗", pass: false },
      { label: "EUDR due diligence", detail: "No due diligence statement on file for this operator ✗", pass: false },
      { label: "Carbon registry", detail: "No carbon credit record found for declared plot ✗", pass: false },
    ],
    txHash: "0x55ab...9d3e",
  },
];

const AGENT_STEPS = [
  { icon: Satellite, label: "Reading satellite imagery",       duration: 900 },
  { icon: FileText,  label: "Parsing producer declarations",   duration: 700 },
  { icon: Database,  label: "Querying on-chain registry",      duration: 800 },
  { icon: Shield,    label: "Cross-referencing data streams",  duration: 600 },
];

type Tab   = "wine" | "soy";
type Phase = "idle" | "running" | "result";
type AnyCase = typeof WINE_CASES[number] | typeof SOY_CASES[number];

// ─── Main component ───────────────────────────────────────────────────────────

export default function GreenAgentPage() {
  const [tab, setTab]   = useState<Tab>("wine");
  const [selected, setSelected] = useState<string | null>(null);
  const [phase, setPhase]       = useState<Phase>("idle");
  const [activeStep, setActiveStep]       = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showChecks, setShowChecks] = useState(false);
  const [showMap, setShowMap]     = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const cases: AnyCase[] = tab === "wine" ? WINE_CASES : SOY_CASES;
  const selectedCase = cases.find(c => c.id === selected) as AnyCase | undefined;

  useEffect(() => {
    setSelected(null);
    setPhase("idle");
    resetAgent();
  }, [tab]);

  const resetAgent = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActiveStep(-1);
    setCompletedSteps([]);
    setShowChecks(false);
    setShowMap(false);
  };

  const runAgent = () => {
    if (!selectedCase) return;
    resetAgent();
    setPhase("running");

    let cursor = 0;
    AGENT_STEPS.forEach((step, i) => {
      timers.current.push(setTimeout(() => setActiveStep(i), cursor));
      cursor += step.duration;
      timers.current.push(setTimeout(() => setCompletedSteps(p => [...p, i]), cursor));
      cursor += 100;
    });

    timers.current.push(setTimeout(() => {
      setPhase("result");
      setTimeout(() => setShowChecks(true), 250);
      setTimeout(() => setShowMap(true), 600);
    }, cursor + 200));
  };

  const reset = () => { setPhase("idle"); setSelected(null); resetAgent(); };

  const isWine = (c: AnyCase): c is typeof WINE_CASES[number] => tab === "wine";
  const isSoy  = (c: AnyCase): c is typeof SOY_CASES[number]  => tab === "soy";

  return (
    <div className="min-h-screen bg-[#080f09] text-white" style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>

      {/* Header */}
      <header className="border-b border-white/10 px-4 py-3 flex items-center gap-3 sticky top-0 bg-[#080f09]/95 backdrop-blur z-10">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-white/40 hover:text-white h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
          </span>
          <span className="text-green-400 text-sm font-bold tracking-widest uppercase">Green Agent</span>
          <span className="text-white/20 text-xs">· VirtusGreen</span>
        </div>
        <div className="ml-auto text-[10px] text-white/20 tracking-widest uppercase hidden sm:block">
          Pilot v0.1 · ctrl/shift 2026
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4 py-6">

        {/* ── IDLE: case selector ── */}
        {phase === "idle" && (
          <>
            {/* Tab bar */}
            <div className="flex gap-1 mb-5 bg-white/5 rounded-lg p-1">
              {(["wine", "soy"] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={`flex-1 py-2 px-3 rounded-md text-xs font-bold tracking-widest uppercase transition-all ${
                    tab === t ? "bg-green-500 text-black" : "text-white/40 hover:text-white/70"
                  }`}>
                  {t === "wine" ? "🍷  Wine · GI" : "🌿  Soy · EUDR"}
                </button>
              ))}
            </div>

            {/* Regulation pill */}
            <div className="mb-5 text-[10px] text-white/30 tracking-widest uppercase border border-white/8 rounded px-3 py-2">
              {tab === "wine"
                ? "EU Geographical Indications Regulation 2024/1143"
                : "EU Deforestation Regulation 2023/1115 · Soy (Annex I)"}
            </div>

            <p className="text-white/30 text-[10px] mb-3 tracking-widest uppercase">Select a case</p>

            <div className="space-y-3 mb-8">
              {cases.map(c => (
                <button key={c.id} onClick={() => setSelected(c.id)}
                  className={`w-full text-left rounded-xl border p-4 transition-all ${
                    selected === c.id
                      ? "border-green-400/60 bg-green-400/5"
                      : "border-white/8 bg-white/2 hover:border-white/20 hover:bg-white/4"
                  }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded mr-2 ${
                        c.verdict === "verified"
                          ? "bg-green-400/10 text-green-400"
                          : "bg-red-400/10 text-red-400"
                      }`}>{c.label}</span>
                      <div className="font-bold text-white text-sm mt-2">{c.producer}</div>
                      <div className="text-white/50 text-xs mt-0.5">{c.product}</div>
                      <div className="text-white/25 text-[11px] mt-1">{c.gps}</div>
                    </div>
                    <ChevronRight className={`h-4 w-4 mt-1 flex-shrink-0 ${
                      selected === c.id ? "text-green-400" : "text-white/15"
                    }`} />
                  </div>
                </button>
              ))}
            </div>

            <Button onClick={runAgent} disabled={!selected}
              className={`w-full h-14 text-sm font-bold tracking-widest uppercase transition-all ${
                selected
                  ? "bg-green-500 hover:bg-green-400 text-black shadow-[0_0_20px_rgba(74,222,128,0.3)]"
                  : "bg-white/5 text-white/15 cursor-not-allowed"
              }`}>
              <Zap className="h-4 w-4 mr-2" />
              Run Green Agent
            </Button>
          </>
        )}

        {/* ── RUNNING: animated steps ── */}
        {phase === "running" && selectedCase && (
          <div className="py-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 text-green-400 text-xs tracking-widest uppercase mb-3">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                Agent running
              </div>
              <h2 className="text-white font-bold">{selectedCase.producer}</h2>
              <p className="text-white/40 text-sm">{selectedCase.product}</p>
            </div>

            <div className="space-y-3">
              {AGENT_STEPS.map((step, i) => {
                const Icon = step.icon;
                const done    = completedSteps.includes(i);
                const active  = activeStep === i && !done;
                return (
                  <div key={i} className={`flex items-center gap-4 rounded-xl border px-5 py-4 transition-all duration-500 ${
                    done   ? "border-green-400/30 bg-green-400/5"
                    : active ? "border-green-400/60 bg-green-400/8 shadow-[0_0_24px_rgba(74,222,128,0.12)]"
                    : "border-white/5 bg-white/1"
                  }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      done || active ? "bg-green-400/15" : "bg-white/4"
                    }`}>
                      {done
                        ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                        : <Icon className={`h-4 w-4 ${active ? "text-green-400 animate-pulse" : "text-white/15"}`} />
                      }
                    </div>
                    <span className={`text-sm font-bold tracking-wide ${
                      done ? "text-green-400" : active ? "text-white" : "text-white/15"
                    }`}>
                      {step.label}{active && <span className="animate-pulse">...</span>}
                    </span>
                    {done && <span className="ml-auto text-green-400/50 text-xs">✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESULT ── */}
        {phase === "result" && selectedCase && (
          <div className="py-2">

            {/* Verdict banner */}
            <div className={`rounded-2xl border-2 p-6 mb-5 text-center ${
              selectedCase.verdict === "verified"
                ? "border-green-400 bg-green-400/5 shadow-[0_0_40px_rgba(74,222,128,0.12)]"
                : "border-red-400 bg-red-400/5 shadow-[0_0_40px_rgba(248,113,113,0.12)]"
            }`}>
              <div className="mb-3">
                {selectedCase.verdict === "verified"
                  ? <CheckCircle2 className="h-14 w-14 text-green-400 mx-auto" />
                  : <XCircle       className="h-14 w-14 text-red-400 mx-auto" />
                }
              </div>
              <div className={`text-2xl font-black tracking-widest uppercase mb-1 ${
                selectedCase.verdict === "verified" ? "text-green-400" : "text-red-400"
              }`}>
                {selectedCase.verdict === "verified" ? "Provenance Verified" : "Compliance Flagged"}
              </div>
              <div className="text-white/50 text-sm">{selectedCase.producer}</div>
              <div className="text-white/30 text-xs mt-0.5">{selectedCase.product}</div>
              {selectedCase.verdict === "flagged" && (
                <div className="mt-3 flex items-center justify-center gap-2 text-amber-400 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Purchase order paused · Compliance team notified automatically
                </div>
              )}
            </div>

            {/* ── MAP / VISUALISATION ── */}
            <div className={`mb-5 transition-all duration-700 ${
              showMap ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}>
              {isWine(selectedCase) && (
                <>
                  <p className="text-white/25 text-[10px] tracking-widest uppercase mb-2 flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Geographic verification · Sicily
                  </p>
                  <SicilyMap showFraud={selectedCase.mapShowFraud} />
                </>
              )}
              {isSoy(selectedCase) && (
                <>
                  <p className="text-white/25 text-[10px] tracking-widest uppercase mb-2 flex items-center gap-1">
                    <Satellite className="h-3 w-3" /> Satellite land cover analysis · {selectedCase.location}
                  </p>
                  <DeforestationMap
                    pct2020={selectedCase.pct2020}
                    pct2024={selectedCase.pct2024}
                    compliant={selectedCase.verdict === "verified"}
                  />
                </>
              )}
            </div>

            {/* Check breakdown */}
            <div className={`space-y-2 mb-5 transition-all duration-500 ${
              showChecks ? "opacity-100" : "opacity-0"
            }`}>
              <p className="text-white/25 text-[10px] tracking-widest uppercase mb-3">
                Agent verification breakdown
              </p>
              {selectedCase.checks.map((check, i) => (
                <div key={i} className={`flex gap-3 rounded-xl border px-4 py-3 ${
                  check.pass
                    ? "border-green-400/15 bg-green-400/4"
                    : "border-red-400/15 bg-red-400/4"
                }`}>
                  <div className="flex-shrink-0 mt-0.5">
                    {check.pass
                      ? <CheckCircle2 className="h-4 w-4 text-green-400" />
                      : <XCircle       className="h-4 w-4 text-red-400" />
                    }
                  </div>
                  <div>
                    <div className={`text-xs font-bold ${check.pass ? "text-green-300" : "text-red-300"}`}>
                      {check.label}
                    </div>
                    <div className="text-white/35 text-xs mt-0.5">{check.detail}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* On-chain proof */}
            {showChecks && (
              <div className="border border-white/8 rounded-xl px-4 py-3 mb-5 bg-white/2">
                <p className="text-white/25 text-[10px] tracking-widest uppercase mb-2">On-chain proof</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Shield className="h-3 w-3 text-green-400/50 flex-shrink-0" />
                  <span className="text-white/40 text-xs">{selectedCase.txHash}</span>
                  <span className="ml-auto text-[10px] text-white/15">Immutable · Public · Permanent</span>
                </div>
                <div className="mt-1 text-[10px] text-white/15">{selectedCase.regulation}</div>
              </div>
            )}

            {/* Actions */}
            {showChecks && (
              <div className="flex gap-3">
                <Button onClick={reset} variant="outline"
                  className="flex-1 border-white/15 text-white/50 hover:text-white hover:border-white/30 bg-transparent font-bold tracking-widest uppercase text-xs">
                  ← Back
                </Button>
                <Button onClick={() => { setSelected(null); setPhase("idle"); resetAgent(); }}
                  className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold tracking-widest uppercase text-xs">
                  New check
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pt-5 border-t border-white/5 text-center space-y-1">
          <p className="text-white/15 text-[10px] tracking-widest uppercase">
            VirtusGreen Green Agent Pilot · ctrl/shift Naples 2026
          </p>
          <p className="text-white/10 text-[9px]">
            Demo mode · Pre-seeded data · Blockchain connections mocked for presentation
          </p>
        </div>
      </div>
    </div>
  );
}
