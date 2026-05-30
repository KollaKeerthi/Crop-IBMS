"use client";
import React, { useState } from "react";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   COLORS
   ═══════════════════════════════════════════════════════════════ */
const C = {
  bed: "#FFC107",
  ghBed: "#4CAF50",
  cyan: "#00BCD4",
  green: "#8BC34A",
  red: "#FF0000",
  road: "#BDBDBD",
  bg: "#C0C0C0",
  future: "#8D6E63",
  util: "#8BC34A",
  store: "#FFD54F",
  mainB: "#A1887F",
  border: "#000000",
};

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type BType = "field" | "greenhouse" | "future" | "utility" | "storage" | "mainbldg";

interface FBlock {
  id: string;
  type: BType;
  leftLabel?: string;
  rightLabel?: string;
  leftBotLabel?: string;
  rightBotLabel?: string;
  leftCols?: number;
  rightCols?: number;
  upperRows?: number;
  lowerRows?: number;
  doorLeft?: boolean;
  doorRight?: boolean;
  label?: string;
  innerLabel?: string;
  leftUpperNums?: (string | number)[];
  rightUpperNums?: (string | number)[];
  leftLowerNums?: (string | number)[];
  rightLowerNums?: (string | number)[];
}

/* ═══════════════════════════════════════════════════════════════
   FACTORIES
   ═══════════════════════════════════════════════════════════════ */
function mkField(
  id: string,
  ll: string,
  rl: string,
  lbl: string,
  rbl: string,
  doorLeft = true,
  doorRight = true,
  ur = 8,
  lr = 8
): FBlock {
  return {
    id,
    type: "field",
    leftLabel: ll,
    rightLabel: rl,
    leftBotLabel: lbl,
    rightBotLabel: rbl,
    leftCols: 4,
    rightCols: 4,
    upperRows: ur,
    lowerRows: lr,
    doorLeft,
    doorRight,
  };
}

function mkGH(
  id: string,
  ll: string,
  rl: string,
  lbl: string,
  rbl: string,
  doorLeft = true,
  doorRight = false,
  ur = 8,
  lr = 8
): FBlock {
  return {
    id,
    type: "greenhouse",
    leftLabel: ll,
    rightLabel: rl,
    leftBotLabel: lbl,
    rightBotLabel: rbl,
    leftCols: 4,
    rightCols: 4,
    upperRows: ur,
    lowerRows: lr,
    doorLeft,
    doorRight,
  };
}

function mkUtil(id: string, label: string): FBlock {
  return { id, type: "utility", label };
}
function mkStore(id: string, label: string): FBlock {
  return { id, type: "storage", label };
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK DATA - Sun rise Farm schematic
   ═══════════════════════════════════════════════════════════════ */
const ROW1: FBlock[] = [
  mkField("HG09", "", "", "", "", true, true),
  {
    ...mkField("HG11", "H11", "", "G11", "", true, true),
    leftUpperNums: ["9"],
    rightUpperNums: ["10"],
    leftLowerNums: ["0"],
    rightLowerNums: ["0"],
  },
  mkField("HG13", "", "", "", "", true, true),
  mkField("HG15", "", "", "", "", true, true),
  mkField("HG17", "", "", "", "", true, true),
  mkField("HG19", "", "", "", "", true, true),
];

const ROW2: FBlock[] = [
  {
    ...mkField("FE09", "F09", "F10", "E09", "E10", true, true),
    leftUpperNums: ["1458"],
    rightUpperNums: ["1458"],
    leftLowerNums: ["1458"],
    rightLowerNums: ["1458"],
  },
  {
    ...mkGH("FE11", "F11", "F12", "E11", "E12", true, true),
    leftUpperNums: ["1458"],
    rightUpperNums: ["1458"],
    leftLowerNums: ["1458"],
    rightLowerNums: ["1458"],
  },
  mkField("FE13", "F13", "F14", "E13", "E14", true, true),
  mkField("FE15", "F15", "F16", "E15", "E16", true, true),
  mkField("FE17", "F17", "F18", "E17", "E18", true, true),
  mkField("FE19", "F19", "F20", "E19", "E20", true, true),
];

const ROW3: FBlock[] = [
  mkField("DC09", "D09", "D10", "", "", true, true),
  mkGH("DC11", "D11", "D12", "", "", true, true),
  { id: "FUTURE", type: "future", innerLabel: "FUTURE MAINBUILDING" },
  mkField("DC17", "D17", "D18", "C17", "C18", true, true),
  mkField("DC19", "D19", "D20", "C19", "C20", true, true),
];

const U = {
  chgR1: mkUtil("chgR1", "Change\nRoom"),
  chgR2: mkUtil("chgR2", "Change\nRoom"),
  ctn1: mkUtil("ctn1", "Canteen"),
  ctn2: mkUtil("ctn2", "Canteen"),
  park: mkUtil("park", "Parking"),
  toilet: mkUtil("toilet", "Toilet"),
  cstr: mkStore("cstr", "Container\nStore"),
  mainB: { id: "mainB", type: "mainbldg" as BType, label: "Main\nBuilding" } as FBlock,
  subShop: mkStore("subShop", "Substrate\nShop"),
  comms: mkUtil("comms", "Comms"),
  c12: mkGH("C12GH", "C12", "", "", "", false, false, 3, 3),
};

/* ═══════════════════════════════════════════════════════════════
   CELL GRID
   ═══════════════════════════════════════════════════════════════ */
function CellGrid({
  rows,
  cols,
  color,
  label,
  nums,
  labelPosition = "top",
}: {
  rows: number;
  cols: number;
  color: string;
  label?: string;
  nums?: (string | number)[];
  labelPosition?: "top" | "bottom";
}) {
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, 10px)`,
          gap: 0,
          border: `1px solid ${C.border}`,
        }}
      >
        {Array.from({ length: rows * cols }).map((_, i) => (
          <div
            key={i}
            style={{
              background: color,
              borderRadius: 0,
              border: `0.5px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 10,
            }}
          >
            {nums && nums[i] !== undefined && (
              <span style={{ fontSize: 7, fontWeight: 700, color: "rgba(0,0,0,0.5)" }}>
                {nums[i]}
              </span>
            )}
          </div>
        ))}
      </div>
      {label && (
        <div
          style={{
            position: "absolute",
            ...(labelPosition === "bottom" ? { bottom: 1, left: 1 } : { top: 1, left: 1 }),
            background: "#FFFFFF",
            padding: "1px 4px",
            border: `1px solid ${C.border}`,
            fontSize: 8,
            fontWeight: 900,
            zIndex: 5,
            lineHeight: 1.2,
            borderRadius: 0,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   BLOCK RENDERER
   ═══════════════════════════════════════════════════════════════ */
function Block({
  b,
  sel,
  hov,
  onC,
  onH,
  onL,
}: {
  b: FBlock;
  sel: boolean;
  hov: boolean;
  onC: () => void;
  onH: () => void;
  onL: () => void;
}) {
  const shadow = sel ? `0 0 0 3px ${C.green}` : hov ? "0 0 8px rgba(0,0,0,0.3)" : "none";

  if (b.type === "future") {
    return (
      <div
        onClick={onC}
        onMouseEnter={onH}
        onMouseLeave={onL}
        style={{
          border: `2px solid ${C.border}`,
          borderRadius: 0,
          height: "100%",
          minHeight: 200,
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          boxShadow: shadow,
          position: "relative",
        }}
      >
        <div style={{ height: 4, background: C.green, flexShrink: 0 }} />
        <div
          style={{
            height: 30,
            background: "#BF360C",
            flexShrink: 0,
            borderTop: `1px solid ${C.border}`,
            borderBottom: `1px solid ${C.border}`,
          }}
        />
        <div
          style={{
            height: 35,
            background: "#BF360C",
            flexShrink: 0,
            borderBottom: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              background: "#FFF",
              padding: "3px 8px",
              fontSize: 11,
              fontWeight: "bold",
              color: "#000",
            }}
          >
            {b.innerLabel}
          </span>
        </div>
        <div
          style={{
            flex: 1,
            background: C.green,
            position: "relative",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: 1, position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: "35%",
                width: 38,
                background: "#F8CECC",
                borderRight: "1px solid #000",
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "4px 0",
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#000",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                Sub-
                <br />
                strate
                <br />
                steam-
                <br />
                ing
              </span>
            </div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 14,
              left: -2,
              width: "calc(50% + 2px)",
              height: 18,
              background: C.road,
              borderTop: "1px solid rgba(0,0,0,0.15)",
              borderBottom: "1px solid rgba(0,0,0,0.15)",
              borderLeft: "none",
              zIndex: 1,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -2,
              left: "calc(50% - 16px)",
              width: 32,
              height: 32,
              background: C.road,
              borderLeft: "1px solid rgba(0,0,0,0.15)",
              borderRight: "1px solid rgba(0,0,0,0.15)",
              borderBottom: "none",
              zIndex: 2,
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              paddingBottom: 2,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: "bold",
                color: "#000",
                textAlign: "center",
              }}
            >
              gate
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (b.type === "utility" || b.type === "storage" || b.type === "mainbldg") {
    const bg = b.type === "mainbldg" ? C.mainB : b.type === "storage" ? C.store : C.util;
    return (
      <div
        onClick={onC}
        onMouseEnter={onH}
        onMouseLeave={onL}
        style={{
          background: bg,
          border: `1px solid ${C.border}`,
          borderRadius: 0,
          minHeight: 38,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "4px 6px",
          boxShadow: shadow,
          transition: "box-shadow 0.2s",
        }}
      >
        <span
          style={{
            fontSize: 7,
            fontWeight: 800,
            color: "#333",
            textAlign: "center",
            whiteSpace: "pre-line",
            lineHeight: 1.3,
          }}
        >
          {b.label}
        </span>
      </div>
    );
  }

  const bedC = b.type === "greenhouse" ? C.ghBed : C.bed;
  const lc = b.leftCols ?? 2;
  const rc = b.rightCols ?? 2;
  const ur = b.upperRows ?? 5;
  const lr = b.lowerRows ?? 5;

  return (
    <div
      onClick={onC}
      onMouseEnter={onH}
      onMouseLeave={onL}
      style={{
        border: `2px solid ${C.border}`,
        borderRadius: 0,
        cursor: "pointer",
        boxShadow: shadow,
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        background: C.bg,
      }}
    >
      <div style={{ height: 4, background: C.green }} />
      <div
        style={{
          height: 18,
          background: C.cyan,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      />
      <div style={{ height: 4, background: C.green }} />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 12px 1fr",
          gridTemplateRows: "auto auto auto",
          background: C.green,
          padding: "3px 5px",
        }}
      >
        <CellGrid rows={ur} cols={lc} color={bedC} label={b.leftLabel} nums={b.leftUpperNums} />
        <div style={{ display: "flex", flexDirection: "column", background: C.green }}>
          <div style={{ flex: 1, background: C.green }} />
          <div style={{ height: 12, background: C.red }} />
        </div>
        <CellGrid rows={ur} cols={rc} color={bedC} label={b.rightLabel} nums={b.rightUpperNums} />

        <div style={{ height: 10, background: C.road, margin: "2px 0", alignSelf: "center" }} />
        <div style={{ background: C.road, margin: "2px 0" }} />
        <div style={{ height: 10, background: C.road, margin: "2px 0", alignSelf: "center" }} />

        <CellGrid
          rows={lr}
          cols={lc}
          color={bedC}
          label={b.leftBotLabel}
          nums={b.leftLowerNums}
          labelPosition="bottom"
        />
        <div style={{ display: "flex", flexDirection: "column", background: C.green }}>
          <div style={{ height: 12, background: C.red }} />
          <div style={{ flex: 1, background: C.green }} />
        </div>
        <CellGrid
          rows={lr}
          cols={rc}
          color={bedC}
          label={b.rightBotLabel}
          nums={b.rightLowerNums}
          labelPosition="bottom"
        />
      </div>

      <div style={{ height: 4, background: C.green }} />
      <div
        style={{
          height: 18,
          background: C.cyan,
          borderTop: `1px solid ${C.border}`,
          borderBottom: `1px solid ${C.border}`,
        }}
      />
      <div style={{ height: 4, background: C.green }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function FarmLayoutSchematic() {
  const [sel, setSel] = useState<string | null>(null);
  const [hov, setHov] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  const ALL: FBlock[] = [...ROW1, ...ROW2, ...ROW3, ...Object.values(U)];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const selB = ALL.find((b) => b.id === sel) ?? null;

  const bp = (b: FBlock) => ({
    b,
    sel: sel === b.id,
    hov: hov === b.id,
    onC: () => setSel(b.id),
    onH: () => setHov(b.id),
    onL: () => setHov(null),
  });

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 64px)",
        width: "100%",
        overflow: "hidden",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div style={{ flex: 1, position: "relative", overflow: "hidden", background: C.bg }}>
        <div
          style={{ position: "absolute", top: 10, right: 10, zIndex: 50, display: "flex", gap: 4 }}
        >
          {(
            [
              { i: <ZoomIn size={14} />, f: () => setZoom((z) => Math.min(z + 0.1, 2.5)) },
              { i: <ZoomOut size={14} />, f: () => setZoom((z) => Math.max(z - 0.1, 0.3)) },
              { i: <Maximize2 size={14} />, f: () => setZoom(1) },
            ] as { i: React.ReactNode; f: () => void }[]
          ).map((t, i) => (
            <button
              key={i}
              onClick={t.f}
              style={{
                width: 28,
                height: 28,
                background: "rgba(255,255,255,0.92)",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 6px rgba(0,0,0,0.16)",
              }}
            >
              {t.i}
            </button>
          ))}
        </div>

        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 50,
            background: "rgba(0,0,0,0.6)",
            color: "white",
            fontSize: 9,
            fontWeight: 800,
            padding: "3px 10px",
            borderRadius: 16,
          }}
        >
          {Math.round(zoom * 100)}%
        </div>

        <div style={{ width: "100%", height: "100%", overflow: "auto", padding: 20 }}>
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              transition: "transform 0.25s",
              width: "fit-content",
            }}
          >
            <div
              style={{
                position: "relative",
                width: 1800,
                minHeight: 1100,
                background: C.bg,
                border: "8px solid #767073ff",
                borderRadius: "16px",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                margin: "10px",
              }}
            >
              <div style={{ position: "absolute", left: 10, top: 10, right: 10 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "260px 260px 260px 260px 260px 260px",
                    gap: 20,
                    alignItems: "stretch",
                  }}
                >
                  {ROW1.map((b) => (
                    <Block key={b.id} {...bp(b)} />
                  ))}
                </div>
              </div>

              <div style={{ position: "absolute", left: 10, top: 290, right: 10 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "260px 260px 260px 260px 260px 260px",
                    gap: 20,
                    alignItems: "stretch",
                  }}
                >
                  {ROW2.map((b) => (
                    <Block key={b.id} {...bp(b)} />
                  ))}
                </div>
              </div>

              <div style={{ position: "absolute", left: 10, top: 580, width: 1680, height: 500 }}>
                <div style={{ position: "absolute", left: 0, top: 0, width: 260, height: 260 }}>
                  <Block {...bp(ROW3[0]!)} />
                </div>
                <div style={{ position: "absolute", left: 280, top: 0, width: 260, height: 260 }}>
                  <Block {...bp(ROW3[1]!)} />
                </div>
                <div style={{ position: "absolute", left: 560, top: 0, width: 520, height: 460 }}>
                  <Block {...bp(ROW3[2]!)} />
                </div>
                <div style={{ position: "absolute", left: 1100, top: 0, width: 260, height: 260 }}>
                  <Block {...bp(ROW3[3]!)} />
                </div>
                <div style={{ position: "absolute", left: 1380, top: 0, width: 260, height: 260 }}>
                  <Block {...bp(ROW3[4]!)} />
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 45,
                    top: 290,
                    width: 45,
                    height: 25,
                    border: `1px solid ${C.border}`,
                    background: C.util,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingLeft: 4,
                    fontSize: 9,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "#000",
                  }}
                  onClick={() => setSel("toilet")}
                >
                  Toilet
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 325,
                    width: 45,
                    height: 40,
                    border: `1px solid ${C.border}`,
                    borderRight: "none",
                    background: C.util,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    padding: 4,
                    fontSize: 7,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#000",
                  }}
                  onClick={() => setSel("chgR1")}
                >
                  Change
                  <br />
                  Room
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 45,
                    top: 325,
                    width: 45,
                    height: 40,
                    border: `1px solid ${C.border}`,
                    background: C.util,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    padding: 4,
                    fontSize: 7,
                    fontWeight: 700,
                    cursor: "pointer",
                    textAlign: "left",
                    color: "#000",
                  }}
                  onClick={() => setSel("chgR2")}
                >
                  Change
                  <br />
                  Room
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 375,
                    width: 45,
                    height: 40,
                    border: `1px solid ${C.border}`,
                    borderRight: "none",
                    background: C.util,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingLeft: 4,
                    fontSize: 7,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "#000",
                  }}
                  onClick={() => setSel("ctn1")}
                >
                  CANTEEN
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 45,
                    top: 375,
                    width: 45,
                    height: 40,
                    border: `1px solid ${C.border}`,
                    background: C.util,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    paddingLeft: 4,
                    fontSize: 7,
                    fontWeight: 700,
                    cursor: "pointer",
                    color: "#000",
                  }}
                  onClick={() => setSel("ctn2")}
                >
                  CANTEEN
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 100,
                    top: 325,
                    width: 45,
                    height: 90,
                    border: `1px solid ${C.border}`,
                    background: "#BDBDBD",
                    display: "flex",
                    flexDirection: "column",
                    paddingLeft: 4,
                    paddingTop: 6,
                    cursor: "pointer",
                    color: "#000",
                  }}
                  onClick={() => setSel("park")}
                >
                  <span style={{ fontSize: 9, fontWeight: 500 }}>park</span>
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 10, fontWeight: 600, marginBottom: 20 }}>Park</span>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 260,
                    top: 290,
                    width: 20,
                    height: 160,
                    background: C.util,
                    zIndex: 0,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 155,
                    top: 450,
                    width: 125,
                    height: 70,
                    background: C.util,
                    zIndex: 0,
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: 155,
                    top: 290,
                    width: 105,
                    height: 160,
                    cursor: "pointer",
                    zIndex: 1,
                  }}
                  onClick={() => setSel("cstr")}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: 40,
                      height: 110,
                      background: C.store,
                      border: `1px solid ${C.border}`,
                      borderBottom: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: 0,
                      top: 0,
                      width: 40,
                      height: 110,
                      background: C.store,
                      border: `1px solid ${C.border}`,
                      borderBottom: "none",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      bottom: 0,
                      width: 105,
                      height: 50,
                      background: C.store,
                      border: `1px solid ${C.border}`,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 2,
                      top: 60,
                      fontSize: 9,
                      fontWeight: 800,
                      color: "#000",
                      lineHeight: 1.2,
                    }}
                  >
                    CONTAINER
                    <br />
                    STORE
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    left: 280,
                    top: 290,
                    width: 130,
                    height: 115,
                    cursor: "pointer",
                    background: "#C85A17",
                    border: `1px solid ${C.border}`,
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gridTemplateRows: "repeat(11, 1fr)",
                  }}
                  onClick={() => setSel("mainB")}
                >
                  {Array.from({ length: 33 }).map((_, i) => {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const isBlueCircle = (row === 0 || row === 1) && (col === 0 || col === 1);

                    let content = null;
                    let bg = "transparent";

                    if (isBlueCircle) {
                      content = (
                        <div
                          style={{
                            width: "85%",
                            height: "85%",
                            borderRadius: "50%",
                            background: "#4472C4",
                            border: `1px solid ${C.border}`,
                          }}
                        />
                      );
                    } else if (row === 4 && col === 1) {
                      content = (
                        <span style={{ fontSize: 6, fontWeight: 700, color: "#000" }}>-</span>
                      );
                    } else if (row === 5 && col === 1) {
                      content = (
                        <span style={{ fontSize: 7, fontWeight: 900, color: "#000" }}>MAIN</span>
                      );
                    } else if (row === 6 && col === 1) {
                      content = (
                        <span style={{ fontSize: 7, fontWeight: 900, color: "#000" }}>
                          BUILDING
                        </span>
                      );
                    } else if (row === 10 && col === 1) {
                      bg = "#fff";
                      content = (
                        <span style={{ fontSize: 10, fontWeight: 900, color: "#000" }}>C12</span>
                      );
                    }

                    return (
                      <div
                        key={i}
                        style={{
                          borderRight: col < 2 ? `1px solid ${C.border}` : "none",
                          borderBottom: row < 10 ? `1px solid ${C.border}` : "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: bg,
                        }}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            color: "rgba(255,255,255,0.55)",
            fontSize: 9,
            fontWeight: 700,
            padding: "5px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>
            FIELDS: <b style={{ color: C.bed }}>16</b> • GH: <b style={{ color: C.ghBed }}>4</b> •{" "}
            UTILITY: <b style={{ color: C.util }}>7</b> • FUTURE:{" "}
            <b style={{ color: C.future }}>1</b>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#22c55e",
                display: "inline-block",
              }}
            />
            Interactive Schematic · H/G · F/E · D/C
          </span>
        </div>
      </div>
    </div>
  );
}
