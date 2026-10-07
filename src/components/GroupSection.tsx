import { Fragment } from "react";
import {
  ChevronRightIcon,
  ChevronDownIcon,
  GridIcon,
  UsersIcon,
  TrendIcon,
  LayersIcon,
  InfoIcon,
} from "./icons";
import { SUBSIDIARY_COLORS } from "./colors";
import { KPI_CALCULATIONS } from "./kpi-calculations";
import type { GroupView } from "@/lib/orchestration/view-models";

const SCORE_ICONS = [GridIcon, UsersIcon, TrendIcon, LayersIcon];

export function GroupSection({ group }: { group: GroupView }) {
  return (
    <>
      <span className="sectiontitle serif">Snapshot — each subsidiary individually</span>
      <div className="tilegrid3">
        {group.snapshot.map((s) => (
          <div className="card" key={s.name}>
            <div className="snaphead">
              <span
                className="dot"
                style={{
                  background: SUBSIDIARY_COLORS[s.color].hex,
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                }}
              />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0F1F35" }}>{s.name}</span>
            </div>
            <div className="snapgrid">
              <div className="snapcol">
                <div className="tilelabelgroup">
                  <span className="tilelabel">Headline AUM</span>
                  <span className="infobtn" tabIndex={0}>
                    <InfoIcon />
                    <span className="infotip">{s.headlineAumCalc}</span>
                  </span>
                </div>
                <span className="tilevalue serif" style={{ fontSize: 22 }}>
                  {s.headlineAum}
                </span>
              </div>
              <div className="snapcol">
                <div className="tilelabelgroup">
                  <span className="tilelabel">Active Clients</span>
                  <span className="infobtn" tabIndex={0}>
                    <InfoIcon />
                    <span className="infotip">{s.activeClientsCalc}</span>
                  </span>
                </div>
                <span className="tilevalue serif" style={{ fontSize: 22 }}>
                  {s.activeClients}
                </span>
              </div>
            </div>
            <span className="deltaUp">{s.deltaLabel}</span>
          </div>
        ))}
      </div>

      <span className="sectiontitle serif">Connection — how the three subsidiaries interact</span>
      <div className="flowrow">
        {group.flow.map((f, i) => (
          <Fragment key={f.name}>
            <div className="flowcard">
              <div className="snaphead">
                <span
                  className="dot"
                  style={{
                    background: SUBSIDIARY_COLORS[f.color].hex,
                    width: 9,
                    height: 9,
                    borderRadius: "50%",
                  }}
                />
                <span style={{ fontSize: 15, fontWeight: 700, color: "#0F1F35" }}>{f.name}</span>
              </div>
              <div className="flowstat">
                <span className="flowstatlabel">{f.statLabel}</span>
                <span className="flowstatvalue serif">{f.statValue}</span>
              </div>
              <span className="flowdesc">{f.description}</span>
            </div>
            {i < group.flow.length - 1 ? (
              <div className="flowconnector">
                <ChevronRightIcon className="chevright" />
                <ChevronDownIcon className="chevdown" />
              </div>
            ) : null}
          </Fragment>
        ))}
      </div>

      <span className="sectiontitle serif">Combined — Group Scorecard</span>
      <div className="tilegrid">
        {group.scorecard.map((tile, i) => {
          const Icon = SCORE_ICONS[i];
          return (
            <div className="scorecard" key={tile.label}>
              <div className="scorehead">
                <div className="scorelabelgroup">
                  <span className="scorelabel">{tile.label}</span>
                  <span className="infobtn" tabIndex={0}>
                    <InfoIcon />
                    <span className="infotip">{KPI_CALCULATIONS[tile.label] ?? ""}</span>
                  </span>
                </div>
                <div className="scoreicon">
                  <Icon />
                </div>
              </div>
              <span className="scorevalue serif">{tile.value}</span>
              <span className="scorenote">{tile.note}</span>
            </div>
          );
        })}
      </div>
    </>
  );
}
