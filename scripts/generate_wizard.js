import fs from "node:fs";

const spriteSizePx = {
  w: 50,
  h: 50,
};

const spriteSheetSizePx = {
  w: spriteSizePx.w * 4,
  h: spriteSizePx.h * 4,
};

const rows = [
  {
    offset: 0,
    prefix: "idle",
    count: 4,
  },
  {
    offset: 0,
    prefix: "walk",
    count: 4,
  },
  {
    offset: 0,
    prefix: "emote",
    count: 2,
    mod: 2,
  },
  {
    offset: 0,
    prefix: "idle_down",
    count: 4,
  },
  {
    offset: 0,
    prefix: "walk_down",
    count: 4,
  },
  {
    offset: 2,
    prefix: "idle_up",
    count: 4,
  },
  {
    offset: 2,
    prefix: "walk_up",
    count: 4,
  },
  ...["idle_right", "walk_right", "walk_up_right", "walk_down_right"].map(
    (prefix) => ({
      offset: 3,
      prefix,
      count: 4,
    }),
  ),
  ...["idle_left", "walk_left", "walk_up_left", "walk_down_left"].map(
    (prefix) => ({
      offset: 1,
      prefix,
      count: 4,
    }),
  ),
];

const meta = {
  // image: "Primary.png",
  size: spriteSheetSizePx,
  frameSize: spriteSizePx,
  // scale: "1",
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
