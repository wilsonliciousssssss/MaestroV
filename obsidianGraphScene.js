function ob_scenePalette() { return VisualState.palette(); }
function ob_perfScale() { return VisualState.perfMode().densityScale; }
function ob_drawGlowPoint(ctx, x, y, radius, color, alpha = 0.8) {
  const glow = (VisualState.controls.glow || 0) * VisualState.perfMode().glowScale;
  ctx.save();
  if (glow > 12) { ctx.shadowBlur = Math.min(22, glow * 0.22); ctx.shadowColor = color; }
  ctx.fillStyle = rgba(color, alpha);
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function ob_drawLine(ctx, x1, y1, x2, y2, color, alpha = 0.35, width = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
}
function ob_drawBox(ctx, x, y, w, h, color, alpha = 0.2, lw = 1) {
  ctx.save(); ctx.strokeStyle = rgba(color, alpha); ctx.lineWidth = lw; ctx.strokeRect(x, y, w, h); ctx.restore();
}
function ob_scenePulse(audio) { return 1 + audio.beat * 0.35 + audio.bass * 0.18; }

const ObsidianGraphScene = {
  nodes: [],
  ensure(width,height){const count=Math.floor((VisualState.controls.graphNodes||100)*ob_perfScale()); if(Math.abs(this.nodes.length-count)<8)return; this.nodes=Array.from({length:count},(_,i)=>({x:Math.random()*width,y:Math.random()*height,z:Math.random(),phase:i*.47}));},
  draw(ctx,width,height,time,audio){this.ensure(width,height); const p=ob_scenePalette(); const link=(VisualState.controls.graphLinks||44)/100; const depth=(VisualState.controls.graphDepth||55)/100;
    this.nodes.forEach((n)=>{n.x=(n.x+Math.sin(time*.38+n.phase)*depth*.6+width)%width; n.y=(n.y+Math.cos(time*.33+n.phase)*depth*.6+height)%height;});
    const hubs=this.nodes.filter((_,i)=>i%17===0);
    hubs.forEach(h=>{ob_drawBox(ctx,h.x-26,h.y-16,52,32,p.c,0.08+audio.beat*.12,1);});
    this.nodes.forEach((n,i)=>{for(let j=i+1;j<Math.min(this.nodes.length,i+Math.floor(5+link*22));j++){const m=this.nodes[j], d=Math.hypot(n.x-m.x,n.y-m.y); if(d<190+audio.mid*80)ob_drawLine(ctx,n.x,n.y,m.x,m.y,(i+j)%2?p.a:p.b,(1-d/280)*0.24,pixelSafe(VisualState.controls.lineWeight)*(0.7+n.z*.5));}
      hubs.slice(0,4).forEach(h=>{const d=Math.hypot(n.x-h.x,n.y-h.y); if(d<230) ob_drawLine(ctx,n.x,n.y,h.x,h.y,p.c,(1-d/230)*0.07,0.5);});
      ob_drawGlowPoint(ctx,n.x,n.y,(2+n.z*3.5)*(1+audio.high*.75),i%2?p.b:p.c,.62+n.z*.16);
      if(i%11===0){ctx.fillStyle=rgba(p.a,0.32); ctx.font='9px Courier New'; ctx.fillText(`NODE_${i}`,n.x+6,n.y-6);}
    });
  }
};
function pixelSafe(v){return Math.max(.3,v||1)}
