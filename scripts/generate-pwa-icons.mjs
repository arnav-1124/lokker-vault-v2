import fs from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const outputDir = path.resolve("public/icons");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const svgContent = fs.readFileSync("src/app/icon.svg", "utf-8");

async function generateIcons() {
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // 1. Generate 192x192 icon
  await page.setViewport({ width: 192, height: 192, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 192px;
            height: 192px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #090d16;
            border-radius: 40px;
          }
          svg {
            width: 128px;
            height: 128px;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `);
  await page.screenshot({
    path: path.join(outputDir, "icon-192x192.png"),
    omitBackground: false,
  });

  // 2. Generate 512x512 icon
  await page.setViewport({ width: 512, height: 512, deviceScaleFactor: 1 });
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 512px;
            height: 512px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #090d16;
            border-radius: 110px;
          }
          svg {
            width: 340px;
            height: 340px;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `);
  await page.screenshot({
    path: path.join(outputDir, "icon-512x512.png"),
    omitBackground: false,
  });

  // 3. Generate 512x512 maskable icon (full bleed background, centered within safe area)
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            width: 512px;
            height: 512px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #090d16;
          }
          svg {
            width: 300px;
            height: 300px;
          }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `);
  await page.screenshot({
    path: path.join(outputDir, "icon-maskable-512x512.png"),
    omitBackground: false,
  });

  // 4. Generate extension icons (16x16, 48x48, 128x128)
  const extIcons = [
    { size: 16, svgSize: 14, file: "icon16.png" },
    { size: 48, svgSize: 42, file: "icon48.png" },
    { size: 128, svgSize: 110, file: "icon128.png" },
  ];

  for (const icon of extIcons) {
    await page.setViewport({ width: icon.size, height: icon.size, deviceScaleFactor: 1 });
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              width: ${icon.size}px;
              height: ${icon.size}px;
              display: flex;
              align-items: center;
              justify-content: center;
              background: transparent;
            }
            svg {
              width: ${icon.svgSize}px;
              height: ${icon.svgSize}px;
            }
          </style>
        </head>
        <body>
          ${svgContent}
        </body>
      </html>
    `);
    await page.screenshot({
      path: path.resolve(`public/extension/icons/${icon.file}`),
      omitBackground: true,
    });
  }

  await browser.close();
  console.log("PWA and extension icons generated successfully in public/icons and public/extension/icons!");
}

generateIcons().catch((err) => {
  console.error("Failed to generate icons:", err);
  process.exit(1);
});
