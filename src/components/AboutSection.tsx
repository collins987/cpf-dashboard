import { CodeIcon, DatabaseIcon, PipelineIcon } from "./icons";

export function AboutSection() {
  return (
    <>
      <div className="card">
        <span className="sectiontitle serif" style={{ marginBottom: 10 }}>
          Overview
        </span>
        <p style={{ fontSize: 13, color: "#3A4150", lineHeight: 1.6, margin: 0 }}>
          The CPF Group Analytics Dashboard is a prototype multi-subsidiary analytics dashboard,
          built for the Week 7–8 Dashboard &amp; Data Product Build exercise of the Data &amp; AI
          Unit programme. It brings Rukisha, CPF Financial Services and CPF Capital &amp; Advisory
          together into a single comparative view for a CPF Group finance manager, so the three
          business lines can be read side by side instead of as three disconnected reports.
        </p>
      </div>

      <span className="sectiontitle serif">Technology Stack</span>
      <div className="aboutgrid">
        <div className="card">
          <div className="abouticon">
            <CodeIcon />
          </div>
          <div className="aboutstacktitle">Application</div>
          <div className="aboutstackdesc">
            Next.js (App Router) with TypeScript, hosted on Vercel. Chart and KPI components follow
            a reusable, single-responsibility pattern.
          </div>
        </div>
        <div className="card">
          <div className="abouticon">
            <DatabaseIcon />
          </div>
          <div className="aboutstacktitle">Data Platform</div>
          <div className="aboutstackdesc">
            Postgres via Supabase as the system of record, on a single subsidiary-partitioned
            schema. Python and pandas generate and load the dummy dataset.
          </div>
        </div>
        <div className="card">
          <div className="abouticon">
            <PipelineIcon />
          </div>
          <div className="aboutstacktitle">CI/CD</div>
          <div className="aboutstackdesc">
            GitHub Actions runs format, lint and build checks on every push; Vercel auto-deploys the
            main branch to production.
          </div>
        </div>
      </div>

      <div className="card">
        <span className="sectiontitle serif" style={{ marginBottom: 10 }}>
          Design &amp; Engineering Standards
        </span>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#3A4150", lineHeight: 1.8 }}>
          <li>
            Built against a 7-phase SDLC — Planning, Analysis, Design, Development, Testing,
            Deployment, Documentation.
          </li>
          <li>
            Architecture follows Core Design Principles: separation of concerns, a layered
            data/logic/UI structure, and named design patterns (Adapter, Strategy) where they remove
            real complexity.
          </li>
          <li>
            Code follows Clean Coding Practices: SOLID, DRY, descriptive naming, and linting
            enforced in CI on every push.
          </li>
          <li>
            The system design is documented in a Software Design Document (SDD) built on the Data
            &amp; AI Unit&apos;s required template.
          </li>
        </ul>
      </div>

      <div className="card">
        <span className="sectiontitle serif" style={{ marginBottom: 10 }}>
          Data &amp; Scope
        </span>
        <p style={{ fontSize: 13, color: "#3A4150", lineHeight: 1.6, margin: "0 0 8px" }}>
          All figures shown are illustrative dummy data for demonstration purposes only — not CPF
          Group&apos;s real financial results. The calculation methodology behind every KPI is
          standard, real-world financial practice (see the info icon on each tile); only the sample
          values are fictional. This prototype has no live data feed and no authentication, by
          design, for a two-week build.
        </p>
        <p style={{ fontSize: 12, color: "#8B93A1", margin: 0 }}>
          Version 1.0 · Last updated 30 Jun 2026
        </p>
      </div>
    </>
  );
}
