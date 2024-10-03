import fs from "node:fs";

const spriteSizePx = {
  w: 24,
  h: 38,
};

const spriteSheetSizePx = {
  w: spriteSizePx.w * 7,
  h: spriteSizePx.h * 4,
};

const rows = [
  {
    offset: 1,
    prefix: "idle",
    count: 4,
  },
  {
    offset: 2,
    prefix: "walk",
    count: 4,
  },
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
      filename: `${row.prefix}_${pad2(i)}.png`,
      frame: {
        x: i * spriteSizePx.w,
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

const animations = {};
rows.forEach((row) => {
  const anim = [];
  for (let i = 0; i < row.count; i++) {
    anim.push(`${row.prefix}_${pad2(i)}.png`);
  }
  animations[row.prefix] = anim;
});

const atlas = {
  meta,
  frames,
  animations,
};

fs.writeFileSync(
  "public/assets/sprites/default_atlas.json",
  JSON.stringify(atlas, undefined, 2),
);
