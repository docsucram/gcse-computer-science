// Procedural 80s Synthwave Sunset Art Generator
// Produces a crisp, high-resolution canvas artwork for image strip slicing

export function generateSynthwaveArt(width = 1200, height = 700) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const horizonY = height * 0.62;

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#0b001a');
  skyGrad.addColorStop(0.35, '#2e0854');
  skyGrad.addColorStop(0.65, '#86198f');
  skyGrad.addColorStop(0.85, '#f43f5e');
  skyGrad.addColorStop(1.0, '#fbbf24');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizonY);

  // 2. Stars in the upper sky
  const seedRandom = (s) => {
    let x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
  for (let i = 0; i < 90; i++) {
    const sx = seedRandom(i * 3 + 1) * width;
    const sy = seedRandom(i * 7 + 2) * (horizonY * 0.7);
    const radius = seedRandom(i * 11 + 5) * 1.6 + 0.5;
    const alpha = seedRandom(i * 13 + 7) * 0.7 + 0.3;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fill();
  }

  // 3. Glowing Synthwave Sun
  const sunRadius = Math.min(width, height) * 0.26;
  const sunCenterX = width * 0.5;
  const sunCenterY = horizonY - sunRadius * 0.28;

  // Sun glow
  const sunGlow = ctx.createRadialGradient(
    sunCenterX, sunCenterY, sunRadius * 0.2,
    sunCenterX, sunCenterY, sunRadius * 1.8
  );
  sunGlow.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
  sunGlow.addColorStop(0.5, 'rgba(244, 63, 94, 0.3)');
  sunGlow.addColorStop(1, 'rgba(244, 63, 94, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunCenterX, sunCenterY, sunRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Draw Sun with horizontal segmented blind cuts
  ctx.save();
  ctx.beginPath();
  ctx.arc(sunCenterX, sunCenterY, sunRadius, 0, Math.PI * 2);
  ctx.clip();

  // Sun base gradient
  const sunGrad = ctx.createLinearGradient(0, sunCenterY - sunRadius, 0, sunCenterY + sunRadius);
  sunGrad.addColorStop(0, '#fef08a');
  sunGrad.addColorStop(0.4, '#fb923c');
  sunGrad.addColorStop(0.75, '#f43f5e');
  sunGrad.addColorStop(1, '#a21caf');
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunCenterX - sunRadius, sunCenterY - sunRadius, sunRadius * 2, sunRadius * 2);

  // Horizontal blind cuts (getting thicker near the bottom)
  const cuts = 10;
  for (let c = 0; c < cuts; c++) {
    const cutRatio = c / cuts;
    const cutY = sunCenterY + (cutRatio - 0.1) * sunRadius;
    const cutHeight = 2.5 + cutRatio * 8;
    ctx.fillStyle = '#18002b';
    ctx.fillRect(sunCenterX - sunRadius - 10, cutY, (sunRadius + 10) * 2, cutHeight);
  }
  ctx.restore();

  // 4. Distant Mountain Silhouette
  ctx.fillStyle = '#140026';
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  ctx.lineTo(width * 0.12, horizonY - 45);
  ctx.lineTo(width * 0.25, horizonY - 20);
  ctx.lineTo(width * 0.38, horizonY - 70);
  ctx.lineTo(width * 0.5, horizonY - 35);
  ctx.lineTo(width * 0.62, horizonY - 80);
  ctx.lineTo(width * 0.75, horizonY - 30);
  ctx.lineTo(width * 0.88, horizonY - 60);
  ctx.lineTo(width, horizonY);
  ctx.closePath();
  ctx.fill();

  // Neon mountain edge highlight
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 5. Retro Perspective Grid Floor
  const floorGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  floorGrad.addColorStop(0, '#0a0017');
  floorGrad.addColorStop(0.4, '#1b0336');
  floorGrad.addColorStop(1, '#2c044d');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Horizontal grid lines (exponential perspective spacing)
  const hLines = 20;
  for (let i = 1; i <= hLines; i++) {
    const p = Math.pow(i / hLines, 2.2);
    const lineY = horizonY + p * (height - horizonY);
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(width, lineY);
    ctx.strokeStyle = `rgba(236, 72, 153, ${0.15 + (i / hLines) * 0.75})`;
    ctx.lineWidth = 1 + (i / hLines) * 2;
    ctx.stroke();
  }

  // Perspective vertical rays converging to center horizon
  const vLines = 26;
  for (let i = -vLines / 2; i <= vLines / 2; i++) {
    const bottomX = (width / 2) + (i / (vLines / 2)) * (width * 1.1);
    ctx.beginPath();
    ctx.moveTo(width / 2, horizonY);
    ctx.lineTo(bottomX, height);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 6. Horizon Neon Glow
  const horizonGlow = ctx.createLinearGradient(0, horizonY - 15, 0, horizonY + 15);
  horizonGlow.addColorStop(0, 'rgba(251, 191, 36, 0)');
  horizonGlow.addColorStop(0.5, 'rgba(251, 191, 36, 0.85)');
  horizonGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
  ctx.fillStyle = horizonGlow;
  ctx.fillRect(0, horizonY - 15, width, 30);

  // 7. Cool badge in bottom-right
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'right';
  ctx.fillText('GCSE CS • SORT VISUALIZER', width - 24, height - 20);

  return canvas.toDataURL('image/png');
}
