/* Smoke compatibility fix. Original WebGL appearance, CSS texture fallback.
   The fallback is hidden only after an offscreen pixel test succeeds. */
export function setupHeroSmoke({ mode = 'auto' } = {}) {
 const host = document.querySelector('.hero .smoke');
 if (!host) return;
 const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
 // Touch devices use the portable texture, avoiding mobile GPU/compositor differences.
 const portable = mode === 'css' || (mode === 'auto' && window.matchMedia('(any-pointer: coarse)').matches);
 let gl, canvas, program, buffer, vertexShader, fragmentShader, timeUniform;
 let raf = 0, lastFrame = 0, elapsed = 0, visible = true, failed = false;
 let observer, destroyed = false;
 const removers = [];
 const listen = (target, event, fn) => {
  target.addEventListener(event, fn);
  removers.push(() => target.removeEventListener(event, fn));
 };
 function fallback(reason) {
  host.classList.remove('has-canvas');
  host.dataset.smokeRenderer = 'css';
  host.dataset.smokeReason = reason;
  if (canvas) canvas.hidden = true;
 }
 function stop() { cancelAnimationFrame(raf); raf = 0; lastFrame = 0; }
 function release() {
  if (!gl) return;
  if (buffer) gl.deleteBuffer(buffer);
  if (program) gl.deleteProgram(program);
  if (vertexShader) gl.deleteShader(vertexShader);
  if (fragmentShader) gl.deleteShader(fragmentShader);
  buffer = program = vertexShader = fragmentShader = null;
 }
 function fail(reason) { failed = true; stop(); fallback(reason); release(); }
 fallback('initializing');
 const vertex = `attribute vec2 position; varying highp vec2 uv;
 void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
 const fragment = `precision highp float;
 varying highp vec2 uv;uniform float time;uniform float aspect;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(1.6,-1.2,1.2,1.6)*p+3.7;a*=.5;}return v;}
 float plume(vec2 p,float center,float phase){
  float h=p.y;
  float bend=.035*sin(h*8.-time*.17+phase)+.025*sin(h*17.+time*.09);
  float width=.025+h*.12;
  float dx=(p.x-center-bend)/width;
  float envelope=exp(-(dx*dx))*smoothstep(.06,.22,h)*(1.-smoothstep(.72,1.,h));
  vec2 q=vec2((p.x-center)*aspect*4.,h*3.2-time*.12);
  vec2 warp=vec2(fbm(q+phase),fbm(q+vec2(4.7,1.3)+phase));
  float n=fbm(q+warp*2.8);
  float strand=max(0.,1.-abs(n-.51)*5.);
  float strands=strand*strand*strand*strand*strand;
  float detail=fbm(q*3.+warp*3.);
  return envelope*strands*(.25+detail*.75);
 }
 void main(){vec2 p=uv;float density=plume(p,.19,1.7)+plume(p,.81,8.2);
 float edge=smoothstep(0.,.07,p.x)*smoothstep(0.,.07,1.-p.x);
 float alpha=clamp(density*.65,0.,.52)*edge;
 gl_FragColor=vec4(vec3(.68,.68,.70)*alpha,alpha);}`;
 function compile(type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('shader-allocation');
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
   gl.deleteShader(shader); throw new Error('shader-compile');
  }
  return shader;
 }
 function draw() {
  gl.useProgram(program);
  gl.uniform1f(timeUniform, elapsed);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
 }
 // One small readback at startup. A successful compile alone cannot detect
 // a shader which produces only transparent (or invalid) pixels on a driver.
 function pixelsAreVisible() {
  const w = 96, h = 64;
  const texture = gl.createTexture(), framebuffer = gl.createFramebuffer();
  if (!texture || !framebuffer) {
   if (texture) gl.deleteTexture(texture);
   if (framebuffer) gl.deleteFramebuffer(framebuffer);
   return false;
  }
  try {
   gl.bindTexture(gl.TEXTURE_2D, texture);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
   gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
   gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
   gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
   if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return false;
   gl.viewport(0, 0, w, h); draw();
   const pixels = new Uint8Array(w*h*4);
   gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
   if (gl.getError() !== gl.NO_ERROR || gl.isContextLost()) return false;
   let visiblePixels = 0, transparentPixels = 0;
   for (let i=3; i<pixels.length; i+=4) {
    const alpha = pixels[i];
    const rgb = Math.max(pixels[i-1], pixels[i-2], pixels[i-3]);
    // Reject opaque surfaces and invalid premultiplied output, not just blank frames.
    if (alpha > 134 || rgb > alpha + 2) return false;
    if (alpha <= 2) transparentPixels++;
    if (alpha >= 6 && rgb >= 4) visiblePixels++;
   }
   return visiblePixels >= 12 && transparentPixels >= w*h*.3;
  } finally {
   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
   gl.bindTexture(gl.TEXTURE_2D, null);
   gl.deleteFramebuffer(framebuffer); gl.deleteTexture(texture);
   gl.viewport(0, 0, canvas.width, canvas.height);
  }
 }
 function resize() {
  if (!gl || !program || failed || destroyed) return;
  const r=host.getBoundingClientRect();
  const w=Math.max(1,r.width), h=Math.max(1,r.height);
  const scale=Math.min(.65,1000/w);
  canvas.width=Math.max(1,Math.round(w*scale));
  canvas.height=Math.max(1,Math.round(h*scale));
  gl.viewport(0,0,canvas.width,canvas.height);
  gl.useProgram(program);
  gl.uniform1f(gl.getUniformLocation(program,'aspect'),w/h);
 }
 function frame(now) {
  raf=0;
  if (destroyed || failed || !visible || document.hidden || motion.matches) return;
  if (!lastFrame || now-lastFrame>=1000/24) {
   if (lastFrame) elapsed+=Math.min((now-lastFrame)/1000,.1);
   lastFrame=now;
   draw();
  }
  raf=requestAnimationFrame(frame);
 }
 function sync() {
  stop();
  host.classList.toggle('smoke-paused',!visible || document.hidden);
  if (destroyed || failed) return;
  if (motion.matches) { fallback('reduced-motion'); return; }
  if (portable) { fallback(mode === 'css' ? 'forced-css' : 'touch-device'); return; }
  if (!gl || !program) return;
  if (!visible || document.hidden) { fallback('paused'); return; }
  draw(); // Redraw immediately on return; do not depend on a preserved buffer.
  canvas.hidden=false;
  host.classList.add('has-canvas');
  host.dataset.smokeRenderer='webgl';
  host.dataset.smokeReason='pixel-test-passed';
  raf=requestAnimationFrame(frame);
 }
 function initialize() {
  if (portable) { fallback(mode === 'css' ? 'forced-css' : 'touch-device'); return; }
  try {
   canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');canvas.hidden=true;
   gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:true,depth:false,preserveDrawingBuffer:false});
   if (!gl) { fail('webgl-unavailable'); return; }
   const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
   // The existing sin/fract hash needs a full float mantissa. Do not silently
   // retry this hash at mediump: retain the portable CSS texture instead.
   if (!precision || precision.precision<23) { fail('insufficient-precision'); return; }
   vertexShader=compile(gl.VERTEX_SHADER,vertex);fragmentShader=compile(gl.FRAGMENT_SHADER,fragment);
   program=gl.createProgram();if(!program)throw new Error('program-allocation');
   gl.attachShader(program,vertexShader);gl.attachShader(program,fragmentShader);gl.linkProgram(program);
   if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('program-link');
   gl.useProgram(program);buffer=gl.createBuffer();if(!buffer)throw new Error('buffer-allocation');
   gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
   gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
   const position=gl.getAttribLocation(program,'position');
   if(position<0)throw new Error('attribute-missing');
   gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
   timeUniform=gl.getUniformLocation(program,'time');resize();
   if(!pixelsAreVisible()){fail('pixel-test-failed');return;}
   listen(canvas,'webglcontextlost',event=>{event.preventDefault();fail('context-lost');});
   host.append(canvas);
  } catch(error) { fail(error.message || 'initialization-failed'); }
 }
 initialize();
 if('IntersectionObserver' in window){
  observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{rootMargin:'60px'});
  observer.observe(host);
 }
 listen(document,'visibilitychange',sync);
 listen(window,'resize',()=>{if(!failed){resize();sync();}});
 listen(window,'pagehide',stop);
 listen(window,'pageshow',sync);
 if(motion.addEventListener)listen(motion,'change',sync);
 else {motion.addListener(sync);removers.push(()=>motion.removeListener(sync));}
 sync();
 return {
  get renderer(){return host.dataset.smokeRenderer;},
  get reason(){return host.dataset.smokeReason;},
  destroy(){destroyed=true;stop();observer?.disconnect();removers.forEach(remove=>remove());release();canvas?.remove();host.classList.remove('smoke-paused');fallback('destroyed');}
 };
}
