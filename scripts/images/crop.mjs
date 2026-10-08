import { Jimp } from "jimp";

async function cropIcons() {
  const image = await Jimp.read("d:/obs-store/assets/Icono/logos.png");
  const w = image.bitmap.width;
  const h = image.bitmap.height;

  // Estimate grid sizes based on the image layout
  const iconSize = Math.floor(w / 4.5); 
  const yOffsetRow1 = Math.floor(h * 0.05);
  const yOffsetRow2 = Math.floor(h * 0.33);

  console.log(`Image size: ${w}x${h}. Cropping icons...`);

  // Crop top-left square icon
  const icon1 = image.clone().crop({ x: Math.floor(w * 0.03), y: yOffsetRow1, w: iconSize, h: iconSize });
  await icon1.write("d:/obs-store/assets/Icono/icon_square_1.png");

  // Crop top dark square icon (3rd)
  const icon3 = image.clone().crop({ x: Math.floor(w * 0.41), y: yOffsetRow1, w: iconSize, h: iconSize });
  await icon3.write("d:/obs-store/assets/Icono/icon_square_dark.png");

  // Crop circular icon (1st)
  const iconCirc1 = image.clone().crop({ x: Math.floor(w * 0.04), y: yOffsetRow2, w: iconSize, h: iconSize });
  await iconCirc1.write("d:/obs-store/assets/Icono/icon_circ_1.png");
  
  // Crop circular icon (3rd - dark)
  const iconCirc3 = image.clone().crop({ x: Math.floor(w * 0.36), y: yOffsetRow2, w: Math.floor(iconSize*1.1), h: Math.floor(iconSize*1.1) });
  await iconCirc3.write("d:/obs-store/assets/Icono/icon_circ_dark.png");

  console.log("Cropping done.");
}

cropIcons().catch(console.error);
