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
 * Service Dropdown — shows one pillar at a time. Defaults to the first
 * pillar; selection resets when `view` identity changes (new subsidiary).
 */
export function SubsidiaryContent({ view, colorKey, period }: SubsidiaryContentProps) {
  const firstPillar = view.pillars[0]?.title ?? "";
  const [selected, setSelected] = useState<string>(firstPillar);

  const options = view.pillars.map((p) => p.title);
  const activeTitle = options.includes(selected) ? selected : firstPillar;
  const visiblePillars = view.pillars.filter((p) => p.title === activeTitle);

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
