import sharp from 'sharp';
import path from 'path';

export async function generateThumbnail(
  framePath: string,
  outputPath: string,
  captionText?: string
): Promise<void> {
  try {
    let image = sharp(framePath).resize(1280, 720, {
      fit: 'cover',
      position: 'center'
    });

    if (captionText) {
      // Add text overlay using SVG
      const svgText = `
        <svg width="1280" height="720">
          <defs>
            <style>
              .title {
                fill: white;
                font-size: 64px;
                font-weight: bold;
                font-family: Arial, sans-serif;
                text-shadow: 3px 3px 6px rgba(0,0,0,0.8);
              }
            </style>
          </defs>
          <rect width="1280" height="200" y="520" fill="rgba(0,0,0,0.6)"/>
          <text x="640" y="620" text-anchor="middle" class="title">${escapeXml(captionText.toUpperCase().slice(0, 50))}</text>
        </svg>
      `;

      const svgBuffer = Buffer.from(svgText);

      image = image.composite([{
        input: svgBuffer,
        top: 0,
        left: 0
      }]);
    }

    await image.jpeg({ quality: 90 }).toFile(outputPath);
  } catch (error) {
    console.error('Thumbnail generation error:', error);
    throw error;
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function createBrandedThumbnail(
  framePath: string,
  outputPath: string,
  title: string,
  subtitle?: string
): Promise<void> {
  const svgOverlay = `
    <svg width="1280" height="720">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
          <stop offset="100%" style="stop-color:rgba(0,0,0,0.8);stop-opacity:1" />
        </linearGradient>
        <style>
          .main-title {
            fill: white;
            font-size: 72px;
            font-weight: bold;
            font-family: Arial, sans-serif;
          }
          .subtitle {
            fill: #FFD700;
            font-size: 36px;
            font-weight: bold;
            font-family: Arial, sans-serif;
          }
        </style>
      </defs>
      <rect width="1280" height="720" fill="url(#grad)"/>
      <text x="640" y="580" text-anchor="middle" class="main-title">${escapeXml(title.toUpperCase().slice(0, 40))}</text>
      ${subtitle ? `<text x="640" y="640" text-anchor="middle" class="subtitle">${escapeXml(subtitle.slice(0, 50))}</text>` : ''}
    </svg>
  `;

  await sharp(framePath)
    .resize(1280, 720, { fit: 'cover', position: 'center' })
    .composite([{
      input: Buffer.from(svgOverlay),
      top: 0,
      left: 0
    }])
    .jpeg({ quality: 95 })
    .toFile(outputPath);
}
