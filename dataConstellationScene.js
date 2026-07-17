
function dc_scenePalette() { return VisualState.palette(); }
function dc_perfScale() { return VisualState.perfMode().densityScale; }
function dc_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1, dash = null) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = width;
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}
function dc_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1, fillAlpha = 0) {
  ctx.save();
  if (fillAlpha > 0) {
    ctx.fillStyle = rgba(color, fillAlpha);
    ctx.fillRect(x, y, w, h);
  }
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}
function drawPlus(ctx, x, y, size, color, alpha = 0.55, lw = 1) {
  ctx.save();
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
  ctx.stroke();
  ctx.restore();
}
function drawStar(ctx, x, y, size, color, alpha = 0.55, lw = 1, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(-size, 0); ctx.lineTo(size, 0);
  ctx.moveTo(0, -size); ctx.lineTo(0, size);
  ctx.moveTo(-size * 0.7, -size * 0.7); ctx.lineTo(size * 0.7, size * 0.7);
  ctx.moveTo(-size * 0.7, size * 0.7); ctx.lineTo(size * 0.7, -size * 0.7);
  ctx.stroke();
  ctx.restore();
}
function drawDiamond(ctx, x, y, size, color, alpha = 0.5, lw = 1, fillAlpha = 0) {
  ctx.save();
  if (fillAlpha > 0) {
    ctx.fillStyle = rgba(color, fillAlpha);
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x + size, y);
    ctx.lineTo(x, y + size);
    ctx.lineTo(x - size, y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = rgba(color, alpha);
  ctx.lineWidth = lw;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
function drawDot(ctx, x, y, size, color, alpha = 0.5) {
  ctx.save();
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
function drawNodeBoxSymbol(ctx, x, y, size, color, alpha = 0.5, lw = 1) {
  dc_drawBox(ctx, x - size, y - size, size * 2, size * 2, color, alpha, lw, 0);
  drawPlus(ctx, x, y, size * 0.65, color, alpha * 0.85, lw * 0.9);
}
const DataConstellationScene = {
  nodes: [],
  packets: [],
  ensure(width, height) {
    const count = Math.floor((VisualState.controls.nodeCount || 160) * dc_perfScale());
    if (Math.abs(this.nodes.length - count) < 8) return;
    const symbolMix = (VisualState.controls.symbolMix || 56) / 100;
    const hubControl = (VisualState.controls.hubCount || 8);
    this.nodes = Array.from({ length: count }, (_, i) => {
      const r = Math.random();
      let type = 'dot';
      if (r < symbolMix) {
        const sr = Math.random();
        if (sr < 0.25) type = 'star';
        else if (sr < 0.5) type = 'plus';
        else if (sr < 0.75) type = 'diamond';
        else type = 'box';
      }
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        phase: i * 0.37,
        hub: i % Math.max(7, Math.round(26 - hubControl * 0.18)) === 0,
        type,
        wanderSpeed: 0.55 + Math.random() * 1.3,
        wanderAmp: 0.5 + Math.random() * 1.1,
        driftSeed: Math.random() * Math.PI * 2,
        sizeJitter: 0.8 + Math.random() * 0.7,
        clusterIndex: Math.floor(Math.random() * 6)
      };
    });
    this.packets = [];
  },
  getClusterCenters(width, height, time, audio, clusterCount) {
    const centers = [];
    const baseRadiusX = width * (0.14 + audio.mid * 0.04);
    const baseRadiusY = height * (0.12 + audio.bass * 0.05);
    for (let i = 0; i < clusterCount; i++) {
      const a = (i / clusterCount) * Math.PI * 2 + time * (0.08 + i * 0.006);
      const ring = 1 + (i % 2) * 0.34;
      const x = width * 0.5 + Math.cos(a) * baseRadiusX * ring + Math.sin(time * 0.17 + i) * width * 0.06;
      const y = height * 0.5 + Math.sin(a) * baseRadiusY * ring + Math.cos(time * 0.13 + i * 0.8) * height * 0.05;
      centers.push({ x, y });
    }
    return centers;
  },
  drawSymbol(ctx, node, dotSize, symbolSize, color, alpha, time, audio) {
    const spin = time * (0.18 + audio.high * 0.25) + node.phase;
    const lw = 1 + audio.high * 1.2 + (node.hub ? 0.5 : 0);
    if (node.type === 'dot') {
      drawDot(ctx, node.x, node.y, dotSize * (1 + audio.high * 0.12), color, alpha + 0.08);
      return;
    }
    if (node.type === 'star') {
      drawStar(ctx, node.x, node.y, symbolSize * (1 + audio.high * 0.18), color, alpha, lw, spin);
      return;
    }
    if (node.type === 'plus') {
      drawPlus(ctx, node.x, node.y, symbolSize * (0.95 + audio.mid * 0.18), color, alpha, lw);
      return;
    }
    if (node.type === 'diamond') {
      drawDiamond(ctx, node.x, node.y, symbolSize * (0.9 + audio.mid * 0.08), color, alpha, lw, 0.04 + audio.bass * 0.04);
      return;
    }
    drawNodeBoxSymbol(ctx, node.x, node.y, symbolSize, color, alpha, lw);
  },
  addPacket(x1, y1, x2, y2, color, time, style) {
    if (this.packets.length > 120 * dc_perfScale()) return;
    this.packets.push({ x1, y1, x2, y2, color, born: time, speed: 0.45 + Math.random() * 0.85, style: style || 'box' });
  },
  drawPacket(ctx, packet, time, audio) {
    const age = (time - packet.born) * packet.speed;
    const t = age % 1;
    const x = packet.x1 + (packet.x2 - packet.x1) * t;
    const y = packet.y1 + (packet.y2 - packet.y1) * t;
    const size = 1.8 + audio.high * 2.6;
    if (packet.style === 'diamond') {
      drawDiamond(ctx, x, y, size, packet.color, 0.5, 1 + audio.high * 0.8, 0.08);
    } else {
      dc_drawBox(ctx, x - size, y - size, size * 2, size * 2, packet.color, 0.5, 1 + audio.high * 0.9, 0.08 + audio.high * 0.05);
    }
  },
  draw(ctx, width, height, time, audio) {
    this.ensure(width, height);
    const p = dc_scenePalette();
    const baseReach = VisualState.controls.connectDistance || 132;
    const drift = (VisualState.controls.nodeDrift || 42) * 0.022;
    const density = VisualState.controls.density || 150;
    const linkPulse = (VisualState.controls.linkPulse || 58) / 100;
    const hubBoost = (VisualState.controls.hubCount || 8) / 100;
    const centerPullControl = (VisualState.controls.constellationCenterPull ?? 18) / 100;
    const dotSizeControl = (VisualState.controls.constellationDotSize || 1.8);
    const symbolSizeControl = (VisualState.controls.constellationSymbolSize || 3.2);
    const driftMode = Math.round(VisualState.controls.constellationDriftMode || 0); // 0 free, 1 center, 2 clusters
    const clusterCount = Math.max(2, Math.min(6, Math.round(VisualState.controls.constellationClusterCount || 3)));
    const bassPull = (0.004 + audio.bass * 0.055) * centerPullControl;
    const reach = baseReach * (0.62 + audio.mid * 0.95 + audio.beat * 0.18 + (driftMode === 2 ? 0.08 : 0));
    const centerX = width * 0.5 + Math.sin(time * 0.18) * width * (0.07 + audio.bass * 0.02);
    const centerY = height * 0.5 + Math.cos(time * 0.14) * height * (0.06 + audio.bass * 0.02);
    const orbitX = width * 0.5 + Math.cos(time * 0.27) * width * (0.23 + audio.bass * 0.03);
    const orbitY = height * 0.5 + Math.sin(time * 0.21) * height * (0.18 + audio.bass * 0.03);
    const clusterCenters = this.getClusterCenters(width, height, time, audio, clusterCount);

    // scanner rails
    for (let k = 0; k < 8; k++) {
      const x = (time * (24 + audio.high * 36) + k * width / 8) % width;
      dc_drawLine(ctx, x, 0, x + width * 0.12, height, k % 2 ? p.a : p.c, 0.016 + audio.high * 0.045, 1 + audio.high * 0.55);
      if ((k + Math.floor(time * 2)) % 2 === 0) dc_drawBox(ctx, x - 6, height * (0.12 + (k % 4) * 0.18), 12, 16, p.b, 0.06 + audio.high * 0.1, 0.8);
    }

    // drift mode guides / cluster boxes
    if (driftMode === 2) {
      clusterCenters.forEach((c, i) => {
        const w = 22 + audio.mid * 8;
        const h = 22 + audio.bass * 8;
        const color = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
        dc_drawBox(ctx, c.x - w * 0.5, c.y - h * 0.5, w, h, color, 0.09 + audio.mid * 0.05, 1);
        drawPlus(ctx, c.x, c.y, 5 + audio.high * 2, color, 0.08 + audio.high * 0.08, 1);
      });
    } else if (driftMode === 1) {
      dc_drawBox(ctx, centerX - 11, centerY - 11, 22, 22, p.a, 0.06 + audio.bass * 0.08, 1);
      dc_drawBox(ctx, orbitX - 9, orbitY - 9, 18, 18, p.c, 0.05 + audio.bass * 0.07, 1);
    }

    // structural panels react to mids
    const panelCols = 6;
    const panelRows = 4;
    for (let gy = 0; gy < panelRows; gy++) {
      for (let gx = 0; gx < panelCols; gx++) {
        if ((gx + gy) % 2 !== 0) continue;
        const px = width * 0.08 + gx * width * 0.14;
        const py = height * 0.12 + gy * height * 0.18;
        dc_drawBox(ctx, px, py, 28 + audio.mid * 8, 18 + audio.mid * 5, p.a, 0.025 + audio.mid * 0.03, 0.7);
        if (audio.mid > 0.2) dc_drawLine(ctx, px, py + 9, px + 28 + audio.mid * 8, py + 9, p.b, 0.03 + audio.mid * 0.04, 0.7);
      }
    }

    // motion system: always random wander, then optional center or cluster attraction.
    this.nodes.forEach((n) => {
      const driftForce = 0.012 * drift * (0.55 + n.wanderAmp);
      const wanderX = Math.sin(time * (0.55 + n.wanderSpeed * 0.45) + n.phase + n.driftSeed)
        + Math.cos(time * (1.12 + n.wanderSpeed * 0.22) + n.phase * 0.6);
      const wanderY = Math.cos(time * (0.46 + n.wanderSpeed * 0.4) + n.phase * 1.2 + n.driftSeed)
        + Math.sin(time * (0.98 + n.wanderSpeed * 0.28) + n.phase * 0.5);
      n.vx += wanderX * driftForce * 0.06;
      n.vy += wanderY * driftForce * 0.06;

      let targetX = n.x;
      let targetY = n.y;
      let localPull = 0;
      if (driftMode === 1) {
        targetX = n.hub ? orbitX : centerX;
        targetY = n.hub ? orbitY : centerY;
        localPull = n.hub ? centerPullControl * 1.15 : centerPullControl * 0.6;
      } else if (driftMode === 2) {
        const cc = clusterCenters[n.clusterIndex % clusterCount];
        targetX = n.hub ? (cc.x * 0.6 + orbitX * 0.4) : cc.x;
        targetY = n.hub ? (cc.y * 0.6 + orbitY * 0.4) : cc.y;
        localPull = n.hub ? centerPullControl * 0.95 : centerPullControl * 0.75;
      } else {
        // free drift mode keeps only a subtle hub orbit influence
        if (n.hub) {
          targetX = orbitX;
          targetY = orbitY;
          localPull = centerPullControl * 0.18;
        }
      }
      if (localPull > 0) {
        n.vx += (targetX - n.x) * (0.00075 * bassPull) * (0.7 + n.z) * localPull;
        n.vy += (targetY - n.y) * (0.00075 * bassPull) * (0.7 + n.z) * localPull;
      }

      n.vx *= 0.992;
      n.vy *= 0.992;
      const wobbleX = Math.sin(time * (1 + audio.mid * 0.2) + n.phase) * 0.12;
      const wobbleY = Math.cos(time * (0.8 + audio.mid * 0.16) + n.phase) * 0.12;
      n.x = (n.x + n.vx * (1 + n.z + audio.bass * 0.18) + wobbleX + width) % width;
      n.y = (n.y + n.vy * (1 + n.z + audio.bass * 0.18) + wobbleY + height) % height;
    });

    // network links
    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      for (let j = i + 1; j < Math.min(this.nodes.length, i + 24); j++) {
        const b = this.nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d >= reach) continue;
        const sameCluster = (a.clusterIndex % clusterCount) === (b.clusterIndex % clusterCount);
        if (driftMode === 2 && !sameCluster && d > reach * 0.52) continue;
        const t = 1 - d / reach;
        const color = (i + j) % 3 === 0 ? p.a : (i + j) % 3 === 1 ? p.b : p.c;
        const clusterBoost = driftMode === 2 && sameCluster ? 0.1 : 0;
        const alpha = t * (0.15 + audio.mid * 0.26 + (a.hub || b.hub ? 0.1 : 0) + clusterBoost);
        const lineW = Math.max(0.45, (VisualState.controls.lineWeight || 1) * (0.7 + a.z * 0.3 + audio.bass * 0.35));
        if (d < reach * 0.42) {
          dc_drawLine(ctx, a.x, a.y, b.x, b.y, color, alpha, lineW);
          const nx = dx / (d || 1), ny = dy / (d || 1);
          dc_drawLine(ctx, a.x - ny * 3, a.y + nx * 3, a.x + ny * 3, a.y - nx * 3, color, alpha * 0.8, 1);
          dc_drawLine(ctx, b.x - ny * 3, b.y + nx * 3, b.x + ny * 3, b.y - nx * 3, color, alpha * 0.8, 1);
        } else if (d < reach * 0.74) {
          dc_drawLine(ctx, a.x, a.y, b.x, b.y, color, alpha * 0.92, lineW, [5, 5]);
        } else {
          dc_drawLine(ctx, a.x, a.y, b.x, b.y, color, alpha * 0.65, Math.max(0.35, lineW * 0.8), [2, 7]);
          const mx = (a.x + b.x) * 0.5, my = (a.y + b.y) * 0.5;
          dc_drawBox(ctx, mx - 3, my - 3, 6, 6, color, alpha * 0.7, 0.9);
        }
        if (linkPulse > 0.15 && ((i + j) % 8 === 0 || a.hub || b.hub) && Math.random() < 0.016 + audio.high * 0.05 + audio.mid * 0.02) {
          this.addPacket(a.x, a.y, b.x, b.y, color, time, (i + j) % 2 ? 'box' : 'diamond');
        }
      }

      const color = i % 3 === 0 ? p.a : i % 3 === 1 ? p.b : p.c;
      const dotSize = dotSizeControl * a.sizeJitter * (0.78 + a.z * 0.45) * (1 + audio.high * 0.12 + audio.beat * 0.12);
      const symbolSize = symbolSizeControl * a.sizeJitter * (0.82 + a.z * 0.6) * (1 + audio.high * 0.2 + audio.beat * 0.16 + (a.hub ? hubBoost * 0.36 : 0));
      this.drawSymbol(ctx, a, dotSize, symbolSize, color, 0.42 + a.z * 0.22 + (a.hub ? 0.18 : 0), time, audio);
      if (a.hub) {
        dc_drawBox(ctx, a.x - 12 - audio.bass * 2, a.y - 12 - audio.bass * 2, 24 + audio.bass * 4, 24 + audio.bass * 4, p.a, 0.12 + audio.mid * 0.12, 0.9);
        drawPlus(ctx, a.x, a.y, 8 + audio.bass * 4, p.b, 0.12 + audio.high * 0.14, 0.9 + audio.high * 0.6);
      }
      if (i % 21 === 0) {
        dc_drawLine(ctx, a.x - 22, a.y, a.x + 22, a.y, p.b, 0.05 + audio.mid * 0.06, 0.75);
        dc_drawLine(ctx, a.x, a.y - 22, a.x, a.y + 22, p.b, 0.05 + audio.mid * 0.06, 0.75);
      }
    }

    this.packets = this.packets.filter((s) => time - s.born < 1.1);
    this.packets.forEach((packet) => this.drawPacket(ctx, packet, time, audio));
  }
};
