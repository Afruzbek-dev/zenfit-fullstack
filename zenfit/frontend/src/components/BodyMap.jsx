/**
 * Front/back body diagram for the target-muscle picker.
 *
 * Stylised rather than anatomical: the job is "which region did I tap", not
 * teaching myology, and a simplified figure stays legible at the ~150px width
 * a phone actually gives it. Regions are built from primitives instead of one
 * traced path so each one can be hit-tested and recoloured on its own.
 *
 * Every region is a real button. Tapping the figure and tapping the pill list
 * beside it do the same thing, because a diagram that highlights but cannot be
 * touched reads as broken on a touchscreen.
 */

const BASE = "var(--c-surfaceHi)";
const BASE_LINE = "var(--c-border)";
const ON = "var(--c-neon)";

/** Mirrored pair — every muscle except the midline ones comes in twos. */
function Pair({ children }) {
  return (
    <>
      {children}
      <g transform="translate(200,0) scale(-1,1)">{children}</g>
    </>
  );
}

function Region({ id, label, active, onToggle, children }) {
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={active}
      onClick={() => onToggle(id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle(id);
        }
      }}
      style={{ cursor: "pointer", outline: "none" }}
      fill={active ? ON : BASE}
      stroke={active ? ON : BASE_LINE}
      strokeWidth={active ? 0 : 1}
      className="transition-[fill] duration-200"
    >
      {children}
    </g>
  );
}

/* Shared scaffolding: head, forearms, hands, feet. Never selectable. */
function Frame({ back }) {
  return (
    <g fill={BASE} stroke={BASE_LINE} strokeWidth={1}>
      <ellipse cx={100} cy={30} rx={19} ry={22} />
      <rect x={92} y={49} width={16} height={12} rx={5} />
      {/* forearms + hands */}
      <Pair>
        <path d="M44 152 q-7 26 -4 46 q1 7 8 7 q7 0 8 -7 q3 -22 -2 -46 z" />
        <ellipse cx={51} cy={214} rx={7} ry={10} />
      </Pair>
      {/* feet */}
      <Pair>
        <path d="M74 372 q-2 12 2 14 q7 3 12 -1 q3 -3 1 -13 z" />
      </Pair>
      {back && <ellipse cx={100} cy={30} rx={19} ry={22} fill={BASE} stroke={BASE_LINE} />}
    </g>
  );
}

function FrontBody({ picked, onToggle, label }) {
  const on = (id) => picked.includes(id);
  return (
    <>
      <Frame />

      <Region id="neck" label={label("neck")} active={on("neck")} onToggle={onToggle}>
        <Pair>
          <path d="M92 58 q-18 4 -28 14 q10 4 22 3 q8 -1 9 -8 z" />
        </Pair>
      </Region>

      <Region id="shoulders" label={label("shoulders")} active={on("shoulders")} onToggle={onToggle}>
        <Pair>
          <path d="M64 74 q-16 5 -20 22 q-2 10 2 18 q12 -6 20 -18 q5 -9 4 -18 z" />
        </Pair>
      </Region>

      <Region id="chest" label={label("chest")} active={on("chest")} onToggle={onToggle}>
        <Pair>
          <path d="M98 72 q-20 2 -30 10 q-7 6 -6 18 q1 11 10 15 q14 5 24 -4 q4 -4 4 -12 z" />
        </Pair>
      </Region>

      <Region id="biceps" label={label("biceps")} active={on("biceps")} onToggle={onToggle}>
        <Pair>
          <path d="M48 112 q-8 18 -6 38 q1 6 7 6 q7 0 9 -7 q4 -20 0 -37 z" />
        </Pair>
      </Region>

      <Region id="abs" label={label("abs")} active={on("abs")} onToggle={onToggle}>
        <path d="M82 120 q-2 40 4 64 q14 6 28 0 q6 -24 4 -64 q-18 5 -36 0 z" />
      </Region>

      <Region id="quads" label={label("quads")} active={on("quads")} onToggle={onToggle}>
        <Pair>
          <path d="M82 200 q-12 40 -8 82 q1 12 11 12 q11 0 13 -13 q4 -42 -2 -81 q-7 3 -14 0 z" />
        </Pair>
      </Region>

      {/* Shins are drawn so the legs do not stop mid-air; not a target group. */}
      <g fill={BASE} stroke={BASE_LINE} strokeWidth={1}>
        <Pair>
          <path d="M80 300 q-6 38 -4 68 q1 6 8 6 q7 0 8 -7 q3 -32 2 -67 q-7 2 -14 0 z" />
        </Pair>
      </g>
    </>
  );
}

function BackBody({ picked, onToggle, label }) {
  const on = (id) => picked.includes(id);
  return (
    <>
      <Frame back />

      <Region id="neck" label={label("neck")} active={on("neck")} onToggle={onToggle}>
        <path d="M100 56 q-24 4 -34 18 q16 6 34 6 q18 0 34 -6 q-10 -14 -34 -18 z" />
      </Region>

      <Region id="shoulders" label={label("shoulders")} active={on("shoulders")} onToggle={onToggle}>
        <Pair>
          <path d="M64 76 q-16 5 -20 22 q-2 10 2 18 q12 -6 20 -18 q5 -9 4 -18 z" />
        </Pair>
      </Region>

      <Region id="back" label={label("back")} active={on("back")} onToggle={onToggle}>
        <Pair>
          <path d="M99 84 q-22 3 -30 16 q-6 28 6 50 q12 6 24 2 q4 -32 4 -68 z" />
        </Pair>
      </Region>

      <Region id="triceps" label={label("triceps")} active={on("triceps")} onToggle={onToggle}>
        <Pair>
          <path d="M48 112 q-8 18 -6 38 q1 6 7 6 q7 0 9 -7 q4 -20 0 -37 z" />
        </Pair>
      </Region>

      <Region id="glutes" label={label("glutes")} active={on("glutes")} onToggle={onToggle}>
        <Pair>
          <path d="M84 186 q-14 8 -14 26 q0 16 14 20 q14 3 20 -10 q3 -22 -2 -36 q-9 3 -18 0 z" />
          <path d="M82 240 q-10 32 -7 62 q1 11 11 11 q10 0 12 -12 q3 -32 -2 -61 q-7 3 -14 0 z" />
        </Pair>
      </Region>

      <Region id="calves" label={label("calves")} active={on("calves")} onToggle={onToggle}>
        <Pair>
          <path d="M80 312 q-7 30 -4 56 q1 6 8 6 q7 0 8 -7 q3 -28 2 -55 q-7 2 -14 0 z" />
        </Pair>
      </Region>
    </>
  );
}

export default function BodyMap({ side = "front", picked = [], onToggle, label, className = "" }) {
  const Body = side === "back" ? BackBody : FrontBody;
  return (
    <svg
      viewBox="0 0 200 400"
      className={`h-full w-full ${className}`}
      role="group"
      aria-label={label("figure")}
    >
      <Body picked={picked} onToggle={onToggle} label={label} />
    </svg>
  );
}
