import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  Calendar,
  ChevronDown,
  ChevronLeft,
  Copy,
  CreditCard,
  DollarSign,
  Grid3X3,
  Image as ImageIcon,
  Layers3,
  LayoutDashboard,
  LayoutGrid,
  Mail,
  Menu,
  Mic,
  Monitor,
  MousePointer2,
  Palette,
  Phone,
  Plus,
  Search,
  Settings,
  Settings2,
  Shield,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  SquareStack,
  Tablet,
  TrendingUp,
  Type,
  Undo2,
  User,
  Users,
  Wand2,
} from "lucide-react";

const BG_IMAGE = "/topo-bg.jpg";
const GREEN = "#19c37d";
const CYAN = "#16b8c8";
const LIME = "#e3f24f";
const AMBER = "#ffd15c";

type View = "builder" | "admin" | "voice";
type Device = "desktop" | "tablet" | "mobile";
type IconType = React.ComponentType<React.SVGProps<SVGSVGElement>>;

type Client = {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  plan: string;
  status: "Active" | "Trial" | "Paused";
  mrr: number;
  owner: string;
  health: number;
};

const clients: Client[] = [
  { id: "1", name: "Alicia Martin", company: "Studio Nova", email: "alicia@studionova.co", phone: "+33 6 11 22 33 44", plan: "Enterprise", status: "Active", mrr: 2400, owner: "Lina", health: 92 },
  { id: "2", name: "Noah Leroy", company: "Monarch Labs", email: "noah@monarchlabs.io", phone: "+33 6 55 66 77 88", plan: "Pro", status: "Trial", mrr: 490, owner: "Sarah", health: 71 },
  { id: "3", name: "Emma Roussel", company: "North Axis", email: "emma@northaxis.fr", phone: "+33 6 20 40 60 80", plan: "Scale", status: "Active", mrr: 1120, owner: "Lina", health: 85 },
  { id: "4", name: "Tom Giraud", company: "Kite Studio", email: "tom@kitestudio.com", phone: "+33 6 10 10 10 10", plan: "Starter", status: "Paused", mrr: 79, owner: "Nora", health: 44 },
];

const adminNav = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Clients", icon: Users },
  { label: "Sales", icon: TrendingUp },
  { label: "Billing", icon: CreditCard },
  { label: "Settings", icon: Settings },
];

const leftTools = [LayoutGrid, Type, ImageIcon, Layers3, Palette, Sparkles, Settings2];
const topActions = [SquareStack, Grid3X3, Wand2, SlidersHorizontal];
const blocks = ["Hero", "Gallery", "Content", "Feature", "Media", "CTA", "Cards", "Form"];

export default function App() {
  const [view, setView] = useState<View>("builder");
  const [device, setDevice] = useState<Device>("desktop");
  const [selectedClientId, setSelectedClientId] = useState(clients[0].id);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? clients[0],
    [selectedClientId]
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf2ec] font-mono text-zinc-700">
      <style>{`
        @keyframes fadeUp {
          0% { opacity: 0; transform: translateY(18px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 14px 32px rgba(60,80,70,0.10); }
          50% { box-shadow: 0 22px 40px rgba(25,195,125,0.16); }
        }
        @keyframes softFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes blinkDot {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }
      `}</style>

      <img src={BG_IMAGE} alt="Background" className="absolute inset-0 h-full w-full object-cover" />

      <div className="relative z-10 p-4 md:p-8">
        <div className="mx-auto max-w-[1480px] rounded-[40px] border border-white/50 bg-white/12 p-5 shadow-[0_30px_80px_rgba(40,70,60,0.16)] backdrop-blur-[12px] md:p-7 animate-[fadeUp_.7s_cubic-bezier(0.22,1,0.36,1)]">
          <Header view={view} setView={setView} device={device} setDevice={setDevice} />

          {view === "builder" ? (
            <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[78px_1fr_320px]">
              <LeftRail />
              <div className="space-y-4">
                <TopToolbar />
                <BuilderCanvas />
                <BlocksRow />
              </div>
              <Inspector />
            </div>
          ) : view === "admin" ? (
            <AdminPage selectedClient={selectedClient} setSelectedClientId={setSelectedClientId} />
          ) : (
            <VoiceAI />
          )}
        </div>
      </div>
    </div>
  );
}

function Header({
  view,
  setView,
  device,
  setDevice,
}: {
  view: View;
  setView: (v: View) => void;
  device: Device;
  setDevice: (d: Device) => void;
}) {
  const devices: { id: Device; icon: IconType }[] = [
    { id: "desktop", icon: Monitor },
    { id: "tablet", icon: Tablet },
    { id: "mobile", icon: Smartphone },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-white/50 bg-white/18 px-6 py-5 shadow-[0_12px_28px_rgba(60,80,70,0.12)] backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full bg-white/24 p-1 ring-1 ring-white/60">
          <button
            type="button"
            onClick={() => setView("builder")}
            className="rounded-full px-3 py-1.5 text-[11px]"
            style={{ backgroundColor: view === "builder" ? GREEN : "transparent", color: view === "builder" ? "white" : "#5f6672" }}
          >
            Builder
          </button>
          <button
            type="button"
            onClick={() => setView("admin")}
            className="rounded-full px-3 py-1.5 text-[11px]"
            style={{ backgroundColor: view === "admin" ? CYAN : "transparent", color: view === "admin" ? "white" : "#5f6672" }}
          >
            Admin
          </button>
          <button
            type="button"
            onClick={() => setView("voice")}
            className="rounded-full px-3 py-1.5 text-[11px]"
            style={{ backgroundColor: view === "voice" ? LIME : "transparent", color: view === "voice" ? "#3f4a35" : "#5f6672" }}
          >
            AI Voice
          </button>
        </div>

        <button className="flex h-12 w-12 items-center justify-center rounded-[14px] text-white shadow-[0_8px_20px_rgba(20,110,70,0.28)]" style={{ backgroundColor: GREEN }}>
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="hidden items-center gap-4 md:flex">
          <div className="h-4 w-36 rounded-full bg-white/55" />
          <div className="h-4 w-14 rounded-full bg-white/40" />
          <div className="h-4 w-24 rounded-full bg-white/34" />
          <div className="h-4 w-24 rounded-full bg-white/28" />
        </div>
      </div>

      <div className="flex items-center gap-3 text-zinc-600">
        <Search className="h-5 w-5" />
        <Menu className="h-5 w-5" />
        <Bell className="h-4 w-4" />
        <Undo2 className="h-4 w-4" />
        <div className="mx-1 h-5 w-px bg-white/50" />

        {view === "builder" && (
          <div className="flex items-center gap-1 rounded-full bg-white/24 p-1 ring-1 ring-white/60">
            {devices.map(({ id, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setDevice(id)}
                className="rounded-full px-2.5 py-1.5"
                style={{ backgroundColor: device === id ? GREEN : "transparent", color: device === id ? "white" : "#5f6672" }}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        )}

        <button className="rounded-[14px] px-4 py-2 text-[12px] text-zinc-900 shadow-[0_8px_18px_rgba(90,90,100,0.12)]" style={{ backgroundColor: AMBER }}>
          Publish
        </button>

        <div className="flex h-11 w-11 items-center justify-center rounded-full text-white shadow-[0_8px_18px_rgba(20,110,70,0.22)]" style={{ backgroundColor: CYAN }}>
          <User className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function LeftRail() {
  return (
    <div className="flex flex-row items-start gap-4 xl:flex-col">
      <div className="w-full rounded-[24px] border border-white/50 bg-white/18 py-4 backdrop-blur-xl xl:w-auto xl:min-w-[78px]">
        <div className="flex flex-row items-center justify-center gap-2 px-2 xl:flex-col">
          {leftTools.map((Icon, index) => (
            <button
              key={index}
              className="flex h-12 w-12 items-center justify-center rounded-[14px]"
              style={{ backgroundColor: index === 0 ? GREEN : "rgba(255,255,255,0.24)", color: index === 0 ? "white" : "#5f6672" }}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function TopToolbar() {
  return (
    <div className="rounded-[24px] border border-white/50 bg-white/18 px-5 py-4 backdrop-blur-xl animate-[fadeUp_.9s_cubic-bezier(0.22,1,0.36,1)]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {topActions.map((Icon, index) => (
            <button key={index} className="flex h-10 w-10 items-center justify-center rounded-[12px] text-white shadow-[0_6px_16px_rgba(20,110,70,0.22)]" style={{ backgroundColor: index % 2 === 0 ? GREEN : CYAN }}>
              <Icon className="h-4 w-4" />
            </button>
          ))}
          <div className="ml-2 h-9 w-24 rounded-[10px] bg-white/45" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-[10px] bg-white/35" />
          <div className="h-8 w-8 rounded-[10px] bg-white/35" />
          <div className="h-8 w-16 rounded-[10px]" style={{ backgroundColor: `${LIME}aa` }} />
        </div>
      </div>
    </div>
  );
}

function BuilderCanvas() {
  return (
    <div className="rounded-[28px] border border-white/50 bg-white/14 p-4 backdrop-blur-xl animate-[fadeUp_1s_cubic-bezier(0.22,1,0.36,1)]">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[76px_1fr_140px]">
        <div className="rounded-[22px] border border-white/50 bg-white/18 py-3 backdrop-blur-xl">
          <div className="flex flex-row items-center justify-center gap-2 px-2 xl:flex-col">
            {[LayoutGrid, Wand2, ImageIcon, Type, Layers3, Palette, Settings2, Sparkles].map((Icon, index) => (
              <button
                key={index}
                className="flex h-11 w-11 items-center justify-center rounded-[12px]"
                style={{ backgroundColor: index === 0 ? CYAN : "rgba(255,255,255,0.24)", color: index === 0 ? "white" : "#65707b" }}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[18px] border border-white/45 bg-white/16 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-4 w-40 rounded-full bg-white/55" />
              <div className="h-4 w-52 rounded-full bg-white/38" />
            </div>
            <div className="flex items-center gap-2">
              {[LayoutGrid, Sparkles, Settings2].map((Icon, index) => (
                <button key={index} className="flex h-8 w-8 items-center justify-center rounded-[10px] text-white" style={{ backgroundColor: index === 1 ? GREEN : "rgba(255,255,255,0.28)" }}>
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            <div className="relative rounded-[24px] border border-white/50 bg-white/22 p-7 backdrop-blur-xl shadow-[0_16px_30px_rgba(50,70,60,0.12)] animate-[pulseGlow_4.5s_ease-in-out_infinite]">
              <TerminalText text="Heading text" className="text-[22px] font-semibold tracking-tight text-zinc-700" />
              <TerminalText
                text="Un site builder moderne avec fond topo, panneaux transparents et accents verts, cyan et jaune."
                className="mt-3 min-h-[72px] text-[13px] leading-6 text-zinc-600"
                delay={180}
              />

              <div className="mt-6 space-y-3">
                <div className="h-3 w-[86%] rounded-full bg-white/55" />
                <div className="h-3 w-[64%] rounded-full bg-white/42" />
              </div>

              <button className="mt-10 h-10 w-28 rounded-[12px] shadow-[0_8px_18px_rgba(20,110,70,0.22)]" style={{ backgroundColor: GREEN }} />

              <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-[14px] px-3 py-2 text-white shadow-[0_12px_20px_rgba(20,110,70,0.22)] backdrop-blur-xl animate-[softFloat_4s_ease-in-out_infinite]" style={{ backgroundColor: `${GREEN}dd` }}>
                {[MousePointer2, Sparkles, Copy].map((Icon, index) => (
                  <button key={index} className="rounded-[10px] p-2 transition hover:bg-white/10">
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[22px] border border-white/50 bg-white/12 p-4 backdrop-blur-md">
              <div className="relative h-[240px] overflow-hidden rounded-[18px] bg-[linear-gradient(180deg,#d8efe7_0%,#d9e9d6_40%,#f0ecbf_100%)]">
                <div className="absolute inset-x-8 top-7 h-16 rounded-full bg-white/30 blur-2xl" />
                <div className="absolute left-[11%] top-[18%] h-24 w-24 rounded-full bg-[#1ec9de]/30" />
                <div className="absolute right-[11%] top-[20%] h-12 w-12 rounded-full bg-[#d7ef3b]/45" />
                <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(180deg,#73d6c8_0%,#27b892_100%)] [clip-path:polygon(0_100%,0_66%,13%_48%,28%_65%,42%_40%,57%_59%,74%_43%,89%_57%,100%_45%,100%_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(180deg,#d7ef3b_0%,#9fcd25_100%)] [clip-path:polygon(0_100%,0_83%,15%_66%,31%_82%,45%_62%,60%_78%,77%_67%,100%_82%,100%_100%)]" />
              </div>

              <div className="mt-4 space-y-2">
                {[
                  "Hero section",
                  "Gallery block",
                  "CTA block",
                  "Footer content",
                ].map((item) => (
                  <button key={item} className="flex w-full items-center justify-between rounded-[14px] border border-white/45 bg-white/18 px-4 py-3 text-left backdrop-blur-xl">
                    <div>
                      <div className="text-[12px] text-zinc-700">{item}</div>
                      <div className="mt-1 text-[11px] text-zinc-500">Editable section</div>
                    </div>
                    <Grid3X3 className="h-4 w-4 text-zinc-500" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative rounded-[18px] border border-white/45 bg-white/16 p-3 backdrop-blur-xl">
            <div className="grid grid-cols-[64px_1fr_160px] items-center gap-4">
              <div className="flex h-11 items-center justify-center rounded-[14px] text-white" style={{ backgroundColor: AMBER }}>
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="h-10 rounded-[14px] bg-white/28" />
              <div className="mx-auto flex items-center gap-3 rounded-[16px] bg-white/38 px-4 py-3 shadow-[0_8px_16px_rgba(120,120,140,0.08)]">
                <Sparkles className="h-4 w-4" style={{ color: GREEN }} />
                <Grid3X3 className="h-4 w-4" style={{ color: CYAN }} />
                <Menu className="h-4 w-4" style={{ color: "#7b7f89" }} />
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-white/45 bg-white/16 p-4 backdrop-blur-xl">
            <div className="space-y-3">
              <div className="h-3 w-[88%] rounded-full bg-white/54" />
              <div className="h-3 w-[80%] rounded-full bg-white/46" />
              <div className="h-3 w-[56%] rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[18px] border border-white/50 bg-white/18 p-3 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] tracking-[0.12em] text-zinc-500">GRID</span>
              <div className="h-2 w-10 rounded-full bg-white/45" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="flex h-9 items-center justify-center rounded-[10px] text-white" style={{ backgroundColor: i % 3 === 0 ? CYAN : "rgba(255,255,255,0.30)" }}>
                  <Grid3X3 className="h-3.5 w-3.5" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-white/50 bg-white/18 p-3 backdrop-blur-xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] tracking-[0.12em] text-zinc-500">LAYOUTS</span>
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: LIME }} />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 rounded-[10px]" style={{ backgroundColor: i === 1 ? `${LIME}aa` : "rgba(255,255,255,0.34)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlocksRow() {
  return (
    <div className="rounded-[24px] border border-white/50 bg-white/18 px-4 py-4 backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[12px] tracking-[0.12em] text-zinc-500">BLOCKS</div>
        <button className="rounded-[12px] px-3 py-2 text-[11px] tracking-[0.12em] text-white shadow-[0_8px_16px_rgba(20,110,70,0.20)]" style={{ backgroundColor: GREEN }}>
          Add
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {blocks.map((label, index) => (
          <button
            key={label}
            className={`rounded-[16px] p-2 text-left transition hover:-translate-y-[1px] ${
              index === 3
                ? "bg-white/42 shadow-[0_10px_20px_rgba(120,120,140,0.12)] ring-1 ring-white/70"
                : "bg-white/18 ring-1 ring-white/45"
            }`}
          >
            <div className="mb-2 flex h-14 items-center justify-center rounded-[12px] bg-white/20">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-[10px] shadow-[0_6px_14px_rgba(0,0,0,0.08)]"
                style={{
                  backgroundColor: index % 3 === 0 ? `${CYAN}22` : index % 3 === 1 ? `${LIME}22` : `${AMBER}22`,
                  color: index % 3 === 0 ? CYAN : index % 3 === 1 ? LIME : AMBER,
                }}
              >
                <Grid3X3 className="h-4 w-4" />
              </div>
            </div>
            <div className="text-[11px] tracking-[0.06em] text-zinc-700">{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Inspector() {
  return (
    <div className="space-y-4">
      <InspectorCard title="Block info">
        <Field label="Type"><input value="Hero" readOnly className="w-full rounded-[12px] border border-white/40 bg-white/30 px-3 py-2 text-[12px] outline-none" /></Field>
        <Field label="Title"><input value="Heading text" readOnly className="w-full rounded-[12px] border border-white/40 bg-white/30 px-3 py-2 text-[12px] outline-none" /></Field>
        <Field label="Text"><textarea value="Editable section text and content settings." readOnly rows={4} className="w-full rounded-[12px] border border-white/40 bg-white/30 px-3 py-2 text-[12px] outline-none" /></Field>
      </InspectorCard>

      <InspectorCard title="Colors">
        <div className="grid grid-cols-8 gap-0 overflow-hidden rounded-[12px]">
          {[CYAN, GREEN, LIME, AMBER, "#7fd9ca", "#9de268", "#ffe36d", "#4aa0b2"].map((color) => (
            <div key={color} className="h-11" style={{ backgroundColor: color }} />
          ))}
        </div>
      </InspectorCard>
    </div>
  );
}

function InspectorCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl shadow-[0_10px_20px_rgba(60,80,70,0.10)] animate-[pulseGlow_5s_ease-in-out_infinite]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold tracking-tight text-zinc-700">{title}</h3>
        <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <div className="mb-2 text-[11px] tracking-[0.12em] text-zinc-500">{label}</div>
      {children}
    </label>
  );
}

function AdminPage({ selectedClient, setSelectedClientId }: { selectedClient: Client; setSelectedClientId: (id: string) => void }) {
  const mrr = clients.reduce((sum, client) => sum + client.mrr, 0);
  const activeClients = clients.filter((c) => c.status === "Active").length;
  const avgHealth = Math.round(clients.reduce((sum, c) => sum + c.health, 0) / clients.length);

  return (
    <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[250px_1fr_330px]">
      <aside className="rounded-[28px] border border-white/50 bg-white/18 p-4 backdrop-blur-xl">
        <div className="mb-6 flex items-center justify-between rounded-[18px] bg-white/30 px-4 py-3">
          <div>
            <div className="text-sm font-semibold text-zinc-800">CRM Suite</div>
            <div className="text-[11px] text-zinc-500">Super admin</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-[14px] text-white" style={{ backgroundColor: GREEN }}>
            <Shield className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-2">
          {adminNav.map((item, index) => {
            const Icon = item.icon;
            return (
              <button key={item.label} className="flex w-full items-center justify-between rounded-[16px] px-4 py-3 text-left transition" style={{ backgroundColor: index === 0 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.12)" }}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[12px]" style={{ backgroundColor: index === 0 ? `${GREEN}22` : "rgba(255,255,255,0.25)", color: index === 0 ? GREEN : "#666" }}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[13px] text-zinc-700">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] border border-white/50 bg-white/18 px-5 py-4 backdrop-blur-xl">
          <div className="flex min-w-[280px] flex-1 items-center gap-3 rounded-[18px] border border-white/45 bg-white/26 px-4 py-3">
            <Search className="h-4 w-4 text-zinc-500" />
            <input placeholder="Search client, company or email" className="w-full bg-transparent text-[13px] outline-none placeholder:text-zinc-400" />
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/25"><SlidersHorizontal className="h-4 w-4 text-zinc-700" /></button>
            <button className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white/25"><Bell className="h-4 w-4 text-zinc-700" /></button>
            <button className="flex items-center gap-2 rounded-[14px] px-4 py-2 text-[12px] text-zinc-900" style={{ backgroundColor: AMBER }}>
              Workspace <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <KpiCard title="MRR" value={`€${mrr.toLocaleString("fr-FR")}`} accent={GREEN} hint="+8.4%" />
          <KpiCard title="Clients actifs" value={String(activeClients)} accent={CYAN} hint="+12 ce mois" />
          <KpiCard title="Santé moyenne" value={`${avgHealth}%`} accent={LIME} hint="Stable" />
          <KpiCard title="Pipeline" value="€14.2k" accent={AMBER} hint="4 deals" />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <GlassCard title="Revenue overview" action="This month">
            <RevenueChart />
          </GlassCard>
          <GlassCard title="Live activity" action="Updated now">
            <div className="space-y-3">
              {["Nouveau client créé", "Paiement reçu", "Tâche terminée", "Proposition envoyée"].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-[16px] border border-white/40 bg-white/18 px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: index % 2 === 0 ? GREEN : CYAN }} />
                  <span className="text-[12px] text-zinc-700">{item}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        <section className="rounded-[28px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-[14px] font-semibold text-zinc-800">Clients</h3>
              <p className="mt-1 text-[11px] text-zinc-500">CRM contacts and accounts</p>
            </div>
            <button className="flex items-center gap-2 rounded-[14px] px-4 py-2 text-[12px] text-white" style={{ backgroundColor: GREEN }}>
              <Plus className="h-4 w-4" /> Add client
            </button>
          </div>

          <div className="overflow-hidden rounded-[20px] border border-white/40">
            <div className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.7fr_0.7fr] gap-3 bg-white/20 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-zinc-500">
              <div>Client</div>
              <div>Plan</div>
              <div>Status</div>
              <div>Health</div>
              <div>MRR</div>
            </div>

            <div className="divide-y divide-white/35">
              {clients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className="grid w-full grid-cols-[1.4fr_0.9fr_0.8fr_0.7fr_0.7fr] gap-3 bg-white/10 px-4 py-4 text-left transition hover:bg-white/20"
                  style={{ outline: selectedClient.id === client.id ? `2px solid ${GREEN}` : "none" }}
                >
                  <div>
                    <div className="text-[12px] font-medium text-zinc-800">{client.company}</div>
                    <div className="mt-1 text-[11px] text-zinc-500">{client.name}</div>
                  </div>
                  <div className="text-[12px] text-zinc-700">{client.plan}</div>
                  <div>
                    <span className="rounded-full px-2.5 py-1 text-[10px]" style={{ backgroundColor: (client.status === "Active" ? GREEN : client.status === "Trial" ? AMBER : CYAN) + "33" }}>
                      {client.status}
                    </span>
                  </div>
                  <div className="text-[12px] text-zinc-700">{`${client.health}%`}</div>
                  <div className="text-[12px] font-medium text-zinc-800">{`€${client.mrr}`}</div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <aside className="space-y-4">
        <section className="rounded-[28px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full text-white" style={{ backgroundColor: GREEN }}>
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-zinc-800">{selectedClient.name}</div>
              <div className="mt-1 text-[11px] text-zinc-500">{selectedClient.company}</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            <MiniMetric label="Plan" value={selectedClient.plan} />
            <MiniMetric label="MRR" value={`€${selectedClient.mrr}`} />
            <MiniMetric label="Health" value={`${selectedClient.health}%`} />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
          <div className="mb-4 text-[14px] font-semibold text-zinc-800">Quick actions</div>
          <div className="grid gap-3">
            <ActionRow icon={Plus} label="Create client" />
            <ActionRow icon={Calendar} label="Schedule task" />
            <ActionRow icon={CreditCard} label="Create invoice" />
            <ActionRow icon={Mail} label="Send email" />
          </div>
        </section>

        <section className="rounded-[28px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
          <div className="mb-4 text-[14px] font-semibold text-zinc-800">Client details</div>
          <div className="space-y-3">
            <InfoRow icon={Mail} label="Email" value={selectedClient.email} />
            <InfoRow icon={Phone} label="Phone" value={selectedClient.phone} />
            <InfoRow icon={DollarSign} label="MRR" value={`€${selectedClient.mrr}`} />
          </div>
        </section>
      </aside>
    </div>
  );
}

function KpiCard({ title, value, accent, hint }: { title: string; value: string; accent: string; hint: string }) {
  return (
    <div className="rounded-[24px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
      <div className="text-[11px] tracking-[0.12em] text-zinc-500">{title}</div>
      <div className="mt-3 text-[28px] font-semibold tracking-tight text-zinc-800">{value}</div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-[11px] text-zinc-500">{hint}</span>
      </div>
    </div>
  );
}

function GlassCard({ title, action, children }: { title: string; action: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/50 bg-white/18 p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-zinc-800">{title}</h3>
        <span className="text-[11px] text-zinc-500">{action}</span>
      </div>
      {children}
    </section>
  );
}

function RevenueChart() {
  const bars = [48, 64, 52, 72, 66, 84, 76, 92];
  return (
    <div className="space-y-4">
      <div className="flex h-[210px] items-end gap-3 rounded-[20px] bg-white/20 p-4">
        {bars.map((height, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <div className="w-full rounded-t-[10px]" style={{ height: `${height}%`, background: index % 3 === 0 ? GREEN : index % 3 === 1 ? CYAN : AMBER }} />
            <span className="text-[10px] text-zinc-500">{`0${index + 1}`}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between text-[11px] text-zinc-500">
        <span>Recurring revenue trend</span>
        <span>+12.2% vs last month</span>
      </div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] bg-white/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.12em] text-zinc-500">{label}</div>
      <div className="mt-2 text-[12px] text-zinc-800">{value}</div>
    </div>
  );
}

function ActionRow({ icon: Icon, label }: { icon: React.ComponentType<any>; label: string }) {
  return (
    <button className="flex items-center justify-between rounded-[16px] border border-white/40 bg-white/20 px-4 py-3 transition hover:bg-white/30">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/35">
          <Icon className="h-4 w-4 text-zinc-700" />
        </div>
        <span className="text-[12px] text-zinc-800">{label}</span>
      </div>
      <ChevronDown className="h-4 w-4 rotate-[-90deg] text-zinc-500" />
    </button>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<any>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-white/40 bg-white/18 px-4 py-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-white/30">
        <Icon className="h-4 w-4 text-zinc-700" />
      </div>
      <div>
        <div className="text-[11px] text-zinc-500">{label}</div>
        <div className="mt-1 text-[12px] text-zinc-800">{value}</div>
      </div>
    </div>
  );
}

function VoiceAI() {
  return (
    <div className="mt-6 flex items-center justify-center">
      <div className="w-full max-w-[720px] rounded-[32px] border border-white/50 bg-white/18 p-8 text-center backdrop-blur-xl">
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(25,195,125,0.35), rgba(22,184,200,0.25))",
              boxShadow: "0 0 40px rgba(25,195,125,0.25)",
            }}
          >
            <Mic className="h-10 w-10 text-white" />
          </div>
        </div>

        <h2 className="mb-3 text-2xl text-zinc-800">AI Voice Assistant</h2>
        <p className="mb-6 text-sm text-zinc-600">Speak to generate layouts, edit blocks, or control your builder.</p>

        <div className="flex justify-center gap-3">
          <button className="rounded-[14px] px-5 py-3 text-white" style={{ backgroundColor: GREEN }}>
            Start
          </button>
          <button className="rounded-[14px] bg-white/30 px-5 py-3">Stop</button>
        </div>

        <div className="mt-8 rounded-[20px] bg-white/20 p-4 text-left">
          <div className="mb-2 text-[12px] text-zinc-500">Transcript</div>
          <div className="text-[13px] text-zinc-700">“Create a hero section with image and CTA button”</div>
        </div>
      </div>
    </div>
  );
}

function TerminalText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [visible, setVisible] = useState("");

  useEffect(() => {
    setVisible("");
    let index = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    const timeout = setTimeout(() => {
      timer = setInterval(() => {
        index += 1;
        setVisible(text.slice(0, index));
        if (index >= text.length && timer) clearInterval(timer);
      }, 18);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (timer) clearInterval(timer);
    };
  }, [text, delay]);

  return (
    <div className={className}>
      {visible}
      <span className="ml-1 inline-block h-2 w-2 rounded-full bg-current align-middle animate-[blinkDot_1.1s_ease-in-out_infinite]" />
    </div>
  );
}
