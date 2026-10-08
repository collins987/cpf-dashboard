"use client";

import { useState } from "react";
import { PillarSection } from "./PillarSection";
import { ChevronDownIcon } from "./icons";
import type { SubsidiaryView } from "@/lib/orchestration/view-models";
import type { SubsidiaryColorKey } from "./colors";
import type { Period } from "@/lib/calculations/period";

interface SubsidiaryContentProps {
  view: SubsidiaryView;
  colorKey: SubsidiaryColorKey;
  period: Period;
}

/**
 * Phase 5 Extended UI Enhancement §9.1 — Service Dropdown. Lets the user
 * narrow a subsidiary's view to one pillar instead of scrolling through all
 * of them stacked vertically. Resets to "All" whenever `view` changes
 * identity (i.e. the user navigated to a different subsidiary route).
 */
export function SubsidiaryContent({ view, colorKey, period }: SubsidiaryContentProps) {
  const [selected, setSelected] = useState<string>("All");

  const options = ["All", ...view.pillars.map((p) => p.title)];
  const visiblePillars =
    selected === "All" ? view.pillars : view.pillars.filter((p) => p.title === selected);

  return (
    <>
      {view.pillars.length > 1 ? (
        <div className="servicedropdown">
          <label htmlFor="service-select" className="servicedropdownlabel">
            View
          </label>
          <div className="servicedropdownwrap">
            <select
              id="service-select"
              className="servicedropdownselect"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="servicedropdownchev" />
          </div>
        </div>
      ) : null}
      {visiblePillars.map((pillar) => (
        <PillarSection key={pillar.title} pillar={pillar} color={colorKey} period={period} />
      ))}
    </>
  );
}
