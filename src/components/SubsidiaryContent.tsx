"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PillarSection } from "./PillarSection";
import { ChevronDownIcon } from "./icons";
import type { SubsidiaryView } from "@/lib/orchestration/view-models";
import type { SubsidiaryColorKey } from "./colors";

interface SubsidiaryContentProps {
  view: SubsidiaryView;
  colorKey: SubsidiaryColorKey;
}

function SubsidiaryContentInner({ view, colorKey }: SubsidiaryContentProps) {
  const searchParams = useSearchParams();
  const requestedService = searchParams.get("service") ?? "";
  const options = view.pillars.map((p) => p.title);
  const firstPillar = options[0] ?? "";
  const initial = options.includes(requestedService) ? requestedService : firstPillar;

  const [selected, setSelected] = useState<string>(initial);
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
        <PillarSection key={pillar.title} pillar={pillar} color={colorKey} />
      ))}
    </>
  );
}

export function SubsidiaryContent({ view, colorKey }: SubsidiaryContentProps) {
  return (
    <Suspense fallback={null}>
      <SubsidiaryContentInner view={view} colorKey={colorKey} />
    </Suspense>
  );
}
