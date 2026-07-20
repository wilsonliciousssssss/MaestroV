function og_scenePalette() { return VisualState.palette(); }
function og_perfScale() { return VisualState.perfMode().densityScale; }
function og_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 12) { ctx.shadowBlur = Math.min(22, glow * 0.22); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function og_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function og_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); ctx.restore();
}
function og_scenePulse(audio) { return 1 + audio.beat * 0.35 + audio.bass * 0.18; }

const OrbitGeometryScene = {
  draw(ctx, width, height, time, audio) {
    const p = og_scenePalette(); const cx=width/2, cy=height/2;
    const rings = VisualState.controls.orbitRings || 8; const scale=(VisualState.controls.orbitScale||100)/100;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate((time*(VisualState.controls.orbitSpeed||1))*0.16);
    for(let r=0;r<rings;r++){
      const rad=(52+r*31)*scale*(1+audio.bass*0.18); const ecc=0.38+0.035*r+audio.mid*0.08;
      ctx.strokeStyle=rgba(r%2?p.b:p.a,0.13+audio.mid*0.16); ctx.lineWidth=Math.max(0.35,(VisualState.controls.lineWeight||1)*0.5*(1+r/rings*.2));
      ctx.beginPath(); ctx.ellipse(0,0,rad,rad*ecc,time*0.18+r*.3,0,Math.PI*2); ctx.stroke();
      // polygon frame
      const sides=5+(r%5); ctx.beginPath();
      for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2+time*.22+r; const x=Math.cos(a)*rad; const y=Math.sin(a)*rad*ecc; i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);} ctx.lineWidth=Math.max(0.3,(VisualState.controls.lineWeight||1)*0.4); ctx.strokeStyle=rgba(p.c,0.05+audio.high*.07); ctx.stroke();
      for(let i=0;i<10;i++){ const ang=time*(0.45+r*.055)+i*Math.PI*2/10+r; const x=Math.cos(ang)*rad, y=Math.sin(ang)*rad*ecc; og_drawGlowPoint(ctx,x,y,(VisualState.controls.pointSize||2)*0.72*(1+audio.beat*.5),i%2?p.c:p.a,0.6); if(i%3===0) og_drawLine(ctx,0,0,x,y,p.b,0.03+audio.bass*.05,0.4); }
    }
    ctx.restore();
  }
};
