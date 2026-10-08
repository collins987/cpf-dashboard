"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { MenuIcon, BellIcon, SearchIcon } from "./icons";
import { PillarSection } from "./PillarSection";
import { GroupSection } from "./GroupSection";
import { AboutSection } from "./AboutSection";
import type { SubsidiaryView, GroupView } from "@/lib/orchestration/view-models";
import type { RefreshMeta } from "@/lib/orchestration/refresh-meta";

type TabId = "rukisha" | "cpffs" | "cpfca" | "group" | "about";
type Period = "MoM" | "QoQ" | "YTD";

interface DashboardShellProps {
  rukisha: SubsidiaryView;
  cpffs: SubsidiaryView;
  cpfca: SubsidiaryView;
  group: GroupView;
  refreshMeta: RefreshMeta;
}

const TAB_LABELS: Record<Exclude<TabId, "about">, string> = {
  rukisha: "Rukisha",
  cpffs: "CPF Financial Services",
  cpfca: "CPF Capital & Advisory",
  group: "Group Comparison View",
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

export function DashboardShell({ rukisha, cpffs, cpfca, group, refreshMeta }: DashboardShellProps) {
  const [tab, setTab] = useState<TabId>("rukisha");
  const [navOpen, setNavOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!alertsOpen) return;
    function handleClick(e: MouseEvent) {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [alertsOpen]);
  const [period, setPeriod] = useState<Period>("YTD");

  const goTo = (next: TabId) => {
    setTab(next);
    setNavOpen(false);
  };

  const navBtnClass = (id: TabId) => (tab === id ? "navbtn active" : "navbtn");

  const headerTitle = tab === "about" ? "About This Dashboard" : TAB_LABELS[tab];
  const headerSubtitle =
    tab === "about"
      ? "What this prototype is, how it was built, and the standards it follows."
      : tab === "group"
        ? "How Rukisha, CPF Financial Services and CPF Capital & Advisory connect as one group."
        : { rukisha, cpffs, cpfca }[tab].subtitle;
  const eyebrow = tab === "group" ? "Group View" : tab === "about" ? "About" : "Subsidiary View";

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFFFFF" }}>
      <div className="header">
        <div className="headerinner">
          <div className="brand">
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
          </div>

          <div className={navOpen ? "navrow open" : "navrow"}>
            <button className={navBtnClass("rukisha")} onClick={() => goTo("rukisha")}>
              Rukisha
            </button>
            <button className={navBtnClass("cpffs")} onClick={() => goTo("cpffs")}>
              CPF Financial Services
            </button>
            <button className={navBtnClass("cpfca")} onClick={() => goTo("cpfca")}>
              CPF Capital &amp; Advisory
            </button>
            <button className={navBtnClass("group")} onClick={() => goTo("group")}>
              Group View
            </button>
            <button className={navBtnClass("about")} onClick={() => goTo("about")}>
              About
            </button>
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
            <div className="avatar">FM</div>
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
            <div className="searchbox">
              <SearchIcon />
              <span>Search transactions, deals, members…</span>
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
            <span className="btnsolid">Export Report</span>
          </div>
        </div>

        <div className="content">
          {tab === "rukisha" || tab === "cpffs" || tab === "cpfca" ? (
            <>
              <span className="tag" style={{ color: TAG_COLORS[tab] }}>
                {{ rukisha, cpffs, cpfca }[tab].tag}
              </span>
              {{ rukisha, cpffs, cpfca }[tab].pillars.map((pillar) => (
                <PillarSection key={pillar.title} pillar={pillar} color={tab} />
              ))}
            </>
          ) : null}

          {tab === "group" ? <GroupSection group={group} /> : null}
          {tab === "about" ? (
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
              <button className="footerlink" onClick={() => goTo("rukisha")}>
                Rukisha
              </button>
              <button className="footerlink" onClick={() => goTo("cpffs")}>
                CPF Financial Services
              </button>
              <button className="footerlink" onClick={() => goTo("cpfca")}>
                CPF Capital &amp; Advisory
              </button>
              <button className="footerlink" onClick={() => goTo("group")}>
                Group View
              </button>
            </div>
            <div className="footercol">
              <span className="footercoltitle">Resources</span>
              <button className="footerlink" onClick={() => goTo("about")}>
                About this dashboard
              </button>
              <span style={{ fontSize: 13, color: "#C3CEDB" }}>Data &amp; methodology</span>
              <span style={{ fontSize: 13, color: "#C3CEDB" }}>Export report</span>
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
