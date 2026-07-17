function dn_scenePalette() { return VisualState.palette(); }
function dn_perfScale() { return VisualState.perfMode().densityScale; }
function dn_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 12) { ctx.shadowBlur = Math.min(22, glow * 0.22); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function dn_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function dn_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); ctx.restore();
}
function dn_scenePulse(audio) { return 1 + audio.beat * 0.35 + audio.bass * 0.18; }

const DnaOscilloscopeScene = { draw(ctx,width,height,time,audio){const p=dn_scenePalette(); const strands=VisualState.controls.dnaStrands||3; const seg=Math.floor((VisualState.controls.dnaSegments||118)*dn_perfScale()); const amp=(VisualState.controls.dnaAmplitude||74)*(1+audio.bass*.95); const radius=(VisualState.controls.dnaRadius||46)*(1+audio.mid*.55); const cx=width*.5;
  // oscilloscope trace frame
  dn_drawBox(ctx,width*.34,height*.39,width*.32,height*.22,p.a,0.14+audio.beat*.1,1); dn_drawLine(ctx,width*.36,height*.5,width*.64,height*.5,p.b,0.08,1); dn_drawLine(ctx,cx,height*.41,cx,height*.59,p.b,0.08,1);
  for(let s=0;s<strands;s++){const yOff=height*.5+(s-(strands-1)/2)*height*.145; let prev1=null,prev2=null; for(let i=0;i<seg;i++){const t=i/(seg-1); const x=width*.07+t*width*.86; const phase=t*Math.PI*12+time*(1.15+audio.beat*.5)+s; const cy=yOff+Math.sin(t*Math.PI*4+time*.9+s)*amp*.26; const depth=Math.cos(phase); const y1=cy+Math.sin(phase)*radius; const y2=cy-Math.sin(phase)*radius; const scale=0.65+0.35*(depth+1)/2; if(prev1){dn_drawLine(ctx,prev1.x,prev1.y,x,y1,p.a,.18+audio.high*.12,1); dn_drawLine(ctx,prev2.x,prev2.y,x,y2,p.c,.18+audio.high*.12,1);} if(i%3===0) dn_drawLine(ctx,x,y1,x,y2,p.b,.18+audio.mid*.34,1+audio.beat*1.5); if(i%12===0){ctx.fillStyle=rgba(p.b,.42); ctx.font='9px Courier New'; ctx.fillText(['A','T','C','G'][(i+s)%4],x+5,cy-7);} dn_drawGlowPoint(ctx,x,y1,1.5+scale*1.5,p.a,.62); dn_drawGlowPoint(ctx,x,y2,1.5+scale*1.5,p.c,.62); prev1={x,y:y1}; prev2={x,y:y2}; }}
  // central overlay helix
  for(let i=0;i<Math.floor(seg*.55);i++){const t=i/(seg*.55-1); const x=width*.28+t*width*.44; const phase=t*Math.PI*9-time*1.4; const y=height*.5+Math.sin(phase)*radius*.55+Math.sin(t*Math.PI*5+time)*amp*.08; dn_drawGlowPoint(ctx,x,y,1.3,p.b,.55); if(i%4===0) dn_drawLine(ctx,x,y,x,height*.5-Math.sin(phase)*radius*.45,p.c,.1,0.8);}
}};
