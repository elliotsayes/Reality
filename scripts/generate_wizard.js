import fs from "node:fs";

const spriteSizePx = {
  w: 50,
  h: 50,
};

const spriteSheetSizePx = {
  w: spriteSizePx.w * 4,
  h: spriteSizePx.h * 4,
};

function getCount(aniName) {
  const prefix = aniName.split("_")[0];
  switch (prefix) {
    case "idle":
      return 1;
    default:
      return 4;
  }
}

function getFps(aniName) {
  const prefix = aniName.split("_")[0];
  switch (prefix) {
    case "emote":
      return 16;
    case "run":
      return 16;
    default:
      return undefined;
  }
}

const rows = [
  ...["idle", "idle_down", "emote", "walk", "walk_down", "run", "run_down"].map(
    (prefix) => ({
      prefix,
      offset: 0,
      count: getCount(prefix),
      fps: getFps(prefix),
    }),
  ),
  ...["idle_up", "walk_up", "run_up"].map((prefix) => ({
    prefix,
    offset: 2,
    count: getCount(prefix),
    fps: getFps(prefix),
  })),
  ...[
    "idle_right",
    "walk_right",
    "walk_up_right",
    "walk_down_right",
    "run_right",
    "run_up_right",
    "run_down_right",
  ].map((prefix) => ({
    prefix,
    offset: 3,
    count: getCount(prefix),
    fps: getFps(prefix),
  })),
  ...[
    "idle_left",
    "walk_left",
    "walk_up_left",
    "walk_down_left",
    "run_left",
    "run_up_left",
    "run_down_left",
  ].map((prefix) => ({
    prefix,
    offset: 1,
    count: getCount(prefix),
    fps: getFps(prefix),
  })),
];

const meta = {
  // image: "Primary.png",
  size: spriteSheetSizePx,
  frameSize: spriteSizePx,
  // scale: "1",
  animations: rows
    .map((row) => ({
      [row.prefix]: {
        ...(row.fps && { fps: row.fps }),
      },
    }))
    .reduce((acc, val) => ({ ...acc, ...val }), {}),
};

function pad2(num) {
  return num.toString().padStart(2, "0");
}

const frames = [];
rows.forEach((row) => {
  for (let i = 0; i < row.count; i++) {
    const frame = {
      filename: `${row.prefix}_${pad2(i)}`,
      frame: {
        x: i * (row.mod || 1) * spriteSizePx.w,
        y: row.offset * spriteSizePx.h,
        w: spriteSizePx.w,
        h: spriteSizePx.h,
      },
      rotated: false,
      trimmed: false,
      spriteSourceSize: {
        x: 0,
        y: 0,
        w: spriteSizePx.w,
        h: spriteSizePx.h,
      },
      sourceSize: {
        w: spriteSizePx.w,
        h: spriteSizePx.h,
      },
    };
    frames.push(frame);
  }
});

const atlas = {
  meta,
  frames,
};

fs.writeFileSync(
  "public/assets/sprites/wizard_atlas.json",
  JSON.stringify(atlas, undefined, 2),
);
