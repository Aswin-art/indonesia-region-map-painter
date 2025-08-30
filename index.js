const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SRC = "base_map.png";
const W = 8192,
  H = 5460,
  TILE = 256,
  ZMAX = 5;

(async () => {
  const img = sharp(SRC);
  for (let z = 0; z <= ZMAX; z++) {
    const scale = 1 / Math.pow(2, ZMAX - z); // skala ke level z
    const zw = Math.max(1, Math.round(W * scale));
    const zh = Math.max(1, Math.round(H * scale));
    const cols = Math.ceil(zw / TILE);
    const rows = Math.ceil(zh / TILE);
    const dir = path.join("tiles", String(z));
    fs.mkdirSync(dir, { recursive: true });

    const resized = await img.resize(zw, zh, { fit: "fill" }).png().toBuffer();

    for (let x = 0; x < cols; x++) {
      const xdir = path.join(dir, String(x));
      fs.mkdirSync(xdir, { recursive: true });
      for (let y = 0; y < rows; y++) {
        const left = x * TILE,
          top = y * TILE;
        const w = Math.min(TILE, zw - left);
        const h = Math.min(TILE, zh - top);
        const tileBuf = await sharp(resized)
          .extract({ left, top, width: w, height: h })
          .extend({
            top: 0,
            bottom: TILE - h,
            left: 0,
            right: TILE - w,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();
        fs.writeFileSync(path.join(xdir, `${y}.png`), tileBuf);
      }
    }
    console.log(`z=${z} done (${cols}×${rows} tiles)`);
  }
})();
