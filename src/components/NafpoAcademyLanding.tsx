import { useState, useRef, useEffect, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  Compass,
  BarChart3,
  GraduationCap,
  MessageCircle,
  Search,
  ArrowRight,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

/**
 * NAFPO Academy — landing / app-launcher page.
 * Self-contained: needs only Tailwind CSS + lucide-react (no tailwind.config changes,
 * brand colours are inlined as arbitrary values / CSS variables).
 */

type Status = "live" | "beta";

interface AppTile {
  key: string;
  title: string;
  sub: string;
  href: string;
  icon: LucideIcon;
  accent: string; // brand accent for hover/border/arrow
  tint: string; // soft background blob
  status: Status;
  cta: string;
  featured?: boolean;
  wide?: boolean;
  external?: boolean;
}

const TILES: AppTile[] = [
  {
    key: "document-builder",
    title: "Document Builder",
    sub: "DPR, board minutes & AGM — live preview, English / हिंदी, export to Word & PDF.",
    href: "https://fpo-document-builder-full-stack.vercel.app",
    icon: FileText,
    accent: "#D9A626",
    tint: "rgba(255,255,255,.10)",
    status: "live",
    cta: "Open",
    featured: true,
  },
  {
    key: "credit-readiness",
    title: "Credit-Readiness",
    sub: "Score your FPO in minutes.",
    href: "https://nafpo-academy-assessment-tool.vercel.app",
    icon: BarChart3,
    accent: "#D9A626",
    tint: "#FAF3E0",
    status: "live",
    cta: "Check now",
  },
  {
    key: "whatsapp",
    title: "WhatsApp Bot",
    sub: "Scheme help & alerts.",
    href: "#", // TODO: replace with the WhatsApp group/bot URL
    icon: MessageCircle,
    accent: "#1FA855",
    tint: "#E4F5EA",
    status: "beta",
    cta: "Join",
  },

  {
    key: "academy",
    title: "NAFPO Academy",
    sub: "Multilingual courses on governance, compliance & leadership for CEOs and Boards.",
    href: "https://www.nafpo.in/nafpo-academy",
    icon: GraduationCap,
    accent: "#288A49",
    tint: "#E8F3EC",
    status: "live",
    cta: "Explore",
    wide: true,
    external: true,
  },

  {
    key: "bharat-fpo-finder",
    title: "Bharat FPO Finder",
    sub: "40,000+ FPOs, MCA-verified.",
    href: "https://bharatfpofinder.nafpo.in/main/home",
    icon: Search,
    accent: "#785A3A",
    tint: "#F0E9E1",
    status: "live",
    cta: "Search",
    external: true,
  },

  {
    key: "scheme-navigator",
    title: "Scheme Navigator",
    sub: "34 central & state schemes.",
    href: "./FPO-Scheme-Navigator.html",
    icon: Compass,
    accent: "#46A8D9",
    tint: "#E4F2FA",
    status: "live",
    cta: "Find schemes",
  },
];

function StatusBadge({ status, onDark }: { status: Status; onDark?: boolean }) {
  const label = status === "live" ? "Live" : "Beta";
  const cls = onDark
    ? "bg-white/15 text-white"
    : status === "live"
      ? "bg-[#E8F3EC] text-[#288A49]"
      : "bg-[#FBF1D8] text-[#9a7416]";
  return (
    <span
      className={`absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

function buildHref(href: string, token: string | null): string {
  if (!token || href === "#" || href.startsWith("./")) return href;
  try {
    const url = new URL(href);
    url.searchParams.set("nafpo_token", token);
    return url.toString();
  } catch {
    return href;
  }
}

function Tile({ tile }: { tile: AppTile }) {
  const { token } = useAuth();
  const { icon: Icon, featured, wide } = tile;
  const href = buildHref(tile.href, token);
  const style = {
    ["--accent" as string]: tile.accent,
    ["--tint" as string]: tile.tint,
  } as CSSProperties;

  const span = featured
    ? "sm:col-span-2 lg:col-span-2 lg:row-span-2"
    : wide
      ? "sm:col-span-2 lg:col-span-2"
      : "";

  const base =
    "group relative isolate flex min-h-[200px] flex-col overflow-hidden rounded-[22px] border p-6 transition-all duration-200 hover:-translate-y-1.5";

  if (featured) {
    return (
      <a
        href={href}
        target="_blank"
        style={style}
        className={`${base} ${span} border-transparent bg-[linear-gradient(160deg,#1f7a41,#173626)] text-white hover:shadow-[0_22px_40px_-18px_rgba(23,54,38,.5)]`}
      >
        <StatusBadge status={tile.status} onDark />
        <span className="pointer-events-none absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-white/[.08] transition-transform duration-300 group-hover:scale-150" />
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 text-white">
          <Icon size={26} strokeWidth={2} />
        </div>
        <h3 className="mt-auto text-[30px] font-bold leading-tight">
          {tile.title}
        </h3>
        <p className="mt-1.5 text-[13.5px] text-white/80">{tile.sub}</p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#D9A626]">
          {tile.cta}
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-1"
          />
        </span>
      </a>
    );
  }

  return (
    <a
      href={href}
      target={tile.external ? "_blank" : undefined}
      rel={tile.external ? "noopener noreferrer" : undefined}
      style={style}
      className={`${base} ${span} border-[#E4EAE2] bg-white hover:border-[color:var(--accent)] hover:shadow-[0_22px_40px_-18px_rgba(23,54,38,.28)]`}
    >
      <StatusBadge status={tile.status} />
      <span className="pointer-events-none absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-[color:var(--tint)] opacity-60 transition-transform duration-300 group-hover:scale-150" />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--tint)] text-[color:var(--accent)]">
        <Icon size={26} strokeWidth={2} />
      </div>
      <h3 className="mt-auto text-xl font-bold leading-tight text-[#173626]">
        {tile.title}
      </h3>
      <p className="mt-1.5 text-[13.5px] text-[#6b8577]">{tile.sub}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--accent)]">
        {tile.cta}
        <ArrowRight
          size={16}
          className="transition-transform group-hover:translate-x-1"
        />
      </span>
    </a>
  );
}

function UserMenu() {
  const { user, loading, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) return null;

  if (!user) {
    return (
      <a
        href="https://www.nafpo.in/become-associate"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#173626] px-[18px] py-2.5 text-[13.5px] font-medium text-white transition hover:bg-[#288A49]"
      >
        Join NAFPO
      </a>
    );
  }

  const initials = [user.first_name, user.last_name]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");
  const displayInitials =
    initials || user.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 rounded-full border border-[#E4EAE2] bg-white py-1.5 pl-1.5 pr-3 transition hover:border-[#288A49] hover:shadow-sm"
      >
        {user.avatar_url ? (
          <img
            src={user.avatar_url}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#288A49] text-[13px] font-bold text-white">
            {displayInitials}
          </span>
        )}
        <span className="hidden text-[13.5px] font-medium text-[#173626] sm:block">
          {user.name}
        </span>
        <ChevronDown
          size={14}
          className={`text-[#6b8577] transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-64 overflow-hidden rounded-2xl border border-[#E4EAE2] bg-white shadow-[0_12px_32px_rgba(23,54,38,.12)]">
          <div className="border-b border-[#E4EAE2] px-4 py-3.5">
            <p className="text-[14px] font-semibold text-[#173626]">
              {user.name}
            </p>
            <p className="mt-0.5 text-[12px] text-[#6b8577]">{user.email}</p>
            {user.fpo_name && (
              <p className="mt-1 text-[12px] text-[#288A49]">{user.fpo_name}</p>
            )}
          </div>
          <div className="p-1.5">
            <a
              href="https://www.nafpo.in/my-account"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-[#173626] transition hover:bg-[#F6F8F4]"
            >
              <User size={16} className="text-[#6b8577]" />
              My Account
            </a>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-[#173626] transition hover:bg-[#FEF2F2] hover:text-red-600"
            >
              <LogOut size={16} className="text-[#6b8577]" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NafpoAcademyLanding() {
  return (
    <div className="min-h-screen bg-[#F6F8F4] font-sans text-[#173626] antialiased">
      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-[#E4EAE2] bg-[#F6F8F4]/80 backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1180px] items-center justify-between px-6">
          <img
            src="https://www.nafpo.in/assets/nafpo-logo-yRsENiCS.png"
            alt="NAFPO"
            className="h-11 w-auto"
          />
          <UserMenu />
        </div>
      </nav>

      {/* Hero */}
      <header className="relative overflow-hidden pb-8 pt-[76px]">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 300px at 15% -10%, rgba(40,138,73,.16), transparent 60%), radial-gradient(500px 300px at 95% 10%, rgba(217,166,38,.16), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-[1180px] px-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E4EAE2] bg-white px-3.5 py-2 font-mono text-[11.5px] uppercase tracking-[0.14em] text-[#288A49] shadow-[0_4px_14px_rgba(23,54,38,.05)]">
            <span className="h-[7px] w-[7px] rounded-full bg-[#288A49] shadow-[0_0_0_4px_rgba(40,138,73,.15)]" />
            NAFPO Academy · Toolkit
          </span>
          <h1 className="mt-[22px] max-w-[15ch] text-[clamp(34px,6vw,60px)] font-black leading-[1.05] tracking-[-0.02em]">
            Tools that make FPOs{" "}
            <span className="text-[#288A49]">stronger</span>.
          </h1>
          <p className="mt-[18px] max-w-[44ch] text-[18px] text-[#6b8577]">
            Build documents, find schemes, check credit-readiness — in one
            place.
          </p>
        </div>
      </header>

      {/* Bento grid */}
      <section className="pb-16 pt-[34px]">
        <div className="mx-auto max-w-[1180px] px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TILES.map((tile) => (
              <Tile key={tile.key} tile={tile} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4EAE2] py-7">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3.5 px-6 text-[12.5px] text-[#6b8577]">
          <div>
            © NAFPO ·{" "}
            <b className="text-[#173626]">
              Representation · Collaboration · Transformation
            </b>
          </div>
          <a
            href="https://www.nafpo.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#288A49]"
          >
            nafpo.in
          </a>
        </div>
      </footer>
    </div>
  );
}
