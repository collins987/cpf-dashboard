"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MenuIcon, BellIcon, SearchIcon } from "./icons";
import { SubsidiaryContent } from "./SubsidiaryContent";
import { GroupSection } from "./GroupSection";
import { AboutSection } from "./AboutSection";
import type { SubsidiaryView, GroupView } from "@/lib/orchestration/view-models";
import type { RefreshMeta } from "@/lib/orchestration/refresh-meta";
import type { Period } from "@/lib/calculations/period";

type TabId = "rukisha" | "cpffs" | "cpfca" | "group" | "about";

interface DashboardShellProps {
  /** Each page fetches and supplies only the view(s) its own route needs —
   * e.g. /rukisha passes only `rukisha`. Group still needs all three
   * subsidiaries' totals (unavoidable; see docs/Phase 5 - Development.docx
   * §9.2), so /group's page fetches all three but only passes `group`. */
  rukisha?: SubsidiaryView;
  cpffs?: SubsidiaryView;
  cpfca?: SubsidiaryView;
  group?: GroupView;
  refreshMeta: RefreshMeta;
}

const ROUTE_FOR_TAB: Record<TabId, string> = {
  rukisha: "/rukisha",
  cpffs: "/cpf-financial-services",
  cpfca: "/cpf-capital-advisory",
  group: "/group",
  about: "/about",
};

const TAB_FOR_ROUTE: Record<string, TabId> = {
  "/rukisha": "rukisha",
  "/cpf-financial-services": "cpffs",
  "/cpf-capital-advisory": "cpfca",
  "/group": "group",
  "/about": "about",
};

// Navigation-link / search-target label — what the user clicks or types.
// Kept distinct from the hero/page title below ("Group Comparison View"),
// which stays the fuller descriptive heading shown once you're on that page.
const TAB_LABELS: Record<TabId, string> = {
  rukisha: "Rukisha",
  cpffs: "CPF Financial Services",
  cpfca: "CPF Capital & Advisory",
  group: "Group View",
  about: "About",
};

const TAG_COLORS: Record<"rukisha" | "cpffs" | "cpfca", string> = {
  rukisha: "#1F5FA8",
  cpffs: "#2E8B57",
  cpfca: "#C1440E",
};

const ALERTS = [
  {
    color: "#B3261E",
    text: "CPF Financial Services: Trust Fund Growth (4.1%) is tracking below the 5% quarterly target.",
    time: "2 hours ago",
  },
  {
    color: "#1E7B34",
    text: "CPF Capital & Advisory: Linzi Sukuk KDF Housing closed oversubscribed at 118%.",
    time: "1 day ago",
  },
  {
    color: "#1E7B34",
    text: "Rukisha: blended default rate improved 0.4pp month-on-month, within risk appetite.",
    time: "3 days ago",
  },
];

/**
 * Search (§9.3.b) and Export (§9.3.c) operate only on data already loaded
 * for the active route — real KPI label/value pairs, never raw database
 * rows. "Filters" (§9.3.d): inspected the data model and found no
 * filterable dimension beyond Service (the dropdown in SubsidiaryContent)
 * and Period (below) — both already exist as real controls, so no third,
 * redundant "Filters" control was added; there was no pre-existing filter
 * UI in this codebase to leave dead either.
 */
function buildExportRows(
  active: TabId,
  rukisha?: SubsidiaryView,
  cpffs?: SubsidiaryView,
  cpfca?: SubsidiaryView,
  group?: GroupView,
): { label: string; value: string; note?: string }[] {
  const view =
    active === "rukisha"
      ? rukisha
      : active === "cpffs"
        ? cpffs
        : active === "cpfca"
          ? cpfca
          : undefined;
  if (view)
    return view.pillars.flatMap((p) =>
      p.kpis.map((k) => ({ label: k.label, value: k.value, note: k.note })),
    );
  if (active === "group" && group)
    return group.scorecard.map((s) => ({ label: s.label, value: s.value, note: s.note }));
  return [];
}

function slugify(tab: TabId): string {
  return tab === "cpffs"
    ? "cpf-financial-services"
    : tab === "cpfca"
      ? "cpf-capital-advisory"
      : tab;
}

function downloadCsv(filename: string, rows: { label: string; value: string; note?: string }[]) {
  const header = "Label,Value,Note";
  const lines = rows.map(
    (r) =>
      `"${r.label.replace(/"/g, '""')}","${r.value.replace(/"/g, '""')}","${(r.note ?? "").replace(/"/g, '""')}"`,
  );
  const csv = [header, ...lines].join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DashboardShell({ rukisha, cpffs, cpfca, group, refreshMeta }: DashboardShellProps) {
  const pathname = usePathname();
  const active: TabId = TAB_FOR_ROUTE[pathname ?? ""] ?? "rukisha";

  const [navOpen, setNavOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [period, setPeriod] = useState<Period>("YTD");

  const alertsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!alertsOpen && !profileOpen && !searchQuery) return;
    function handleClick(e: MouseEvent) {
      if (alertsOpen && alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchQuery && searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [alertsOpen, profileOpen, searchQuery]);

  const exportRows = useMemo(
    () => buildExportRows(active, rukisha, cpffs, cpfca, group),
    [active, rukisha, cpffs, cpfca, group],
  );

  const navTargets = (Object.keys(ROUTE_FOR_TAB) as TabId[]).map((t) => ({
    label: TAB_LABELS[t],
    href: ROUTE_FOR_TAB[t],
  }));
  const searchResults = searchQuery.trim()
    ? [
        ...navTargets.filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase())),
        ...exportRows
          .filter((r) => r.label.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((r) => ({ label: `${r.label} — ${r.value}`, href: null as string | null })),
      ]
    : [];

  const handleExport = () => {
    if (exportRows.length === 0) return;
    const dateSlug = refreshMeta.lastUpdatedLabel.replace(/\s+/g, "-");
    downloadCsv(`cpf-${slugify(active)}-${dateSlug}.csv`, exportRows);
  };

  const navBtnClass = (id: TabId) => (active === id ? "navbtn active" : "navbtn");

  const headerTitle =
    active === "about"
      ? "About This Dashboard"
      : active === "group"
        ? "Group Comparison View"
        : TAB_LABELS[active];
  const activeSubsidiaryView =
    active === "rukisha"
      ? rukisha
      : active === "cpffs"
        ? cpffs
        : active === "cpfca"
          ? cpfca
          : undefined;
  const headerSubtitle =
    active === "about"
      ? "What this prototype is, how it was built, and the standards it follows."
      : active === "group"
        ? "How Rukisha, CPF Financial Services and CPF Capital & Advisory connect as one group."
        : (activeSubsidiaryView?.subtitle ?? "");
  const eyebrow =
    active === "group" ? "Group View" : active === "about" ? "About" : "Subsidiary View";

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF" }}>
      <div className="header">
        <div className="headerinner">
          <Link href="/rukisha" className="brand" style={{ textDecoration: "none" }}>
            <div className="logochip">
              <Image
                src="/cpf-group-logo.png"
                alt="CPF Group"
                width={120}
                height={120}
                style={{ height: 32, width: "auto", display: "block" }}
                priority
              />
            </div>
            <span className="brandsub">Analytics Dashboard</span>
          </Link>

          <div className={navOpen ? "navrow open" : "navrow"}>
            {(Object.keys(ROUTE_FOR_TAB) as TabId[]).map((id) => (
              <Link
                key={id}
                href={ROUTE_FOR_TAB[id]}
                className={navBtnClass(id)}
                onClick={() => setNavOpen(false)}
              >
                {TAB_LABELS[id]}
              </Link>
            ))}
          </div>

          <div className="rightgroup">
            <button
              className="hamburger"
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Toggle navigation"
            >
              <MenuIcon />
            </button>
            <div className="alertswrap" ref={alertsRef}>
              <button
                className="bellbtn"
                onClick={() => setAlertsOpen((v) => !v)}
                aria-label="Alerts"
              >
                <BellIcon />
                <span className="bellbadge">{ALERTS.length}</span>
              </button>
              <div className={alertsOpen ? "alertspanel open" : "alertspanel"}>
                <div className="alertshead">Alerts &amp; Notifications</div>
                {ALERTS.map((a) => (
                  <div className="alertitem" key={a.text}>
                    <span className="alertdot" style={{ background: a.color }} />
                    <div>
                      <span className="alerttext">{a.text}</span>
                      <span className="alerttime">{a.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="profilewrap" ref={profileRef}>
              <button
                className="avatarbtn"
                onClick={() => setProfileOpen((v) => !v)}
                aria-label="Profile"
              >
                <div className="avatar">FM</div>
              </button>
              <div className={profileOpen ? "profilepanel open" : "profilepanel"}>
                <div className="profilename">Finance Manager</div>
                <div className="profileemail">manager@cpfgroup.co.ke</div>
                <div className="profiledivider" />
                <div className="profilerow">Personal Profile</div>
                <div
                  className="profilerow profilerow-disabled"
                  title="Not available — authentication is outside this prototype's scope"
                >
                  Logout
                </div>
              </div>
            </div>
            <div className="usermeta">
              <span className="username">Finance Manager</span>
              <span className="userrole">manager@cpfgroup.co.ke</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pagewrap">
        <div className="hero">
          <span className="eyebrow">{eyebrow}</span>
          <span className="serif herotitle">{headerTitle}</span>
          <span className="herosub">{headerSubtitle}</span>
          <span className="herometa">
            Data last refreshed {refreshMeta.refreshedAtLabel} · illustrative dummy dataset
          </span>
          <div className="herotools">
            <div className="searchwrap" ref={searchRef}>
              <div className="searchbox">
                <SearchIcon />
                <input
                  type="text"
                  className="searchinput"
                  placeholder="Search KPIs, Rukisha, Group View…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {searchQuery.trim() ? (
                <div className="searchresults">
                  {searchResults.length === 0 ? (
                    <div className="searchempty">No matches</div>
                  ) : (
                    searchResults.slice(0, 8).map((r, i) =>
                      r.href ? (
                        <Link
                          key={i}
                          href={r.href}
                          className="searchresultitem"
                          onClick={() => setSearchQuery("")}
                        >
                          {r.label}
                        </Link>
                      ) : (
                        <span key={i} className="searchresultitem searchresultitem-static">
                          {r.label}
                        </span>
                      ),
                    )
                  )}
                </div>
              ) : null}
            </div>
            <div className="periodswitch">
              {(["MoM", "QoQ", "YTD"] as Period[]).map((p) => (
                <button
                  key={p}
                  className={period === p ? "periodbtn active" : "periodbtn"}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
            <span className="btnline">{refreshMeta.periodRanges[period]}</span>
            <button
              className="btnsolid"
              onClick={handleExport}
              disabled={exportRows.length === 0}
              style={exportRows.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              Export Report
            </button>
          </div>
        </div>

        <div className="content">
          {active === "rukisha" && rukisha ? (
            <>
              <span className="tag" style={{ color: TAG_COLORS.rukisha }}>
                {rukisha.tag}
              </span>
              <SubsidiaryContent view={rukisha} colorKey="rukisha" period={period} />
            </>
          ) : null}
          {active === "cpffs" && cpffs ? (
            <>
              <span className="tag" style={{ color: TAG_COLORS.cpffs }}>
                {cpffs.tag}
              </span>
              <SubsidiaryContent view={cpffs} colorKey="cpffs" period={period} />
            </>
          ) : null}
          {active === "cpfca" && cpfca ? (
            <>
              <span className="tag" style={{ color: TAG_COLORS.cpfca }}>
                {cpfca.tag}
              </span>
              <SubsidiaryContent view={cpfca} colorKey="cpfca" period={period} />
            </>
          ) : null}
          {active === "group" && group ? <GroupSection group={group} /> : null}
          {active === "about" ? (
            <AboutSection lastUpdatedLabel={refreshMeta.lastUpdatedLabel} />
          ) : null}
        </div>
      </div>

      <div className="footer">
        <div className="footerinner">
          <div className="footerbrand">
            <div className="footerlogochip">
              <Image
                src="/cpf-group-logo.png"
                alt="CPF Group"
                width={120}
                height={120}
                style={{ height: 28, width: 28, display: "block", objectFit: "contain" }}
              />
            </div>
            <span className="footertagline">
              Fulfilling Lives — pension funds administration, trust fund administration, agency
              services, digital financial services, and capital markets advisory under one group.
            </span>
          </div>
          <div className="footercols">
            <div className="footercol">
              <span className="footercoltitle">Dashboard</span>
              <Link className="footerlink" href="/rukisha">
                Rukisha
              </Link>
              <Link className="footerlink" href="/cpf-financial-services">
                CPF Financial Services
              </Link>
              <Link className="footerlink" href="/cpf-capital-advisory">
                CPF Capital &amp; Advisory
              </Link>
              <Link className="footerlink" href="/group">
                Group View
              </Link>
            </div>
            <div className="footercol">
              <span className="footercoltitle">Resources</span>
              <Link className="footerlink" href="/about">
                About this dashboard
              </Link>
              <span style={{ fontSize: 13, color: "#C3CEDB" }}>Data &amp; methodology</span>
              <button className="footerlink" onClick={handleExport} style={{ cursor: "pointer" }}>
                Export report
              </button>
            </div>
          </div>
        </div>
        <div className="footerbottom">
          <span className="footercopy">
            © {new Date().getFullYear()} CPF Group · Prototype dashboard · Illustrative dummy data
            for demonstration purposes only
          </span>
          <span className="footerstack">Built with Next.js · Supabase · Python · Vercel</span>
        </div>
      </div>
    </div>
  );
}
