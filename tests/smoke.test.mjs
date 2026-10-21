import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../dist/js/hero-smoke.js',import.meta.url),'utf8');
const {setupHeroSmoke}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
function fixture(options={}){
 const listeners=new WeakMap();
 const target=()=>{const t={addEventListener(name,fn){const m=listeners.get(t);m.set(name,[...(m.get(name)||[]),fn]);},removeEventListener(name,fn){const m=listeners.get(t);m.set(name,(m.get(name)||[]).filter(x=>x!==fn));},emit(name,event={}){for(const fn of listeners.get(t).get(name)||[])fn(event);}};listeners.set(t,new Map());return t;};
 const classes=new Set();const host={dataset:{},children:[],classList:{add:n=>classes.add(n),remove:n=>classes.delete(n),contains:n=>classes.has(n),toggle(n,on){on?classes.add(n):classes.delete(n);}},append(c){this.children.push(c);},getBoundingClientRect:()=>({width:390,height:525})};
 const canvas=Object.assign(target(),{hidden:false,setAttribute(){},remove(){host.children=host.children.filter(x=>x!==canvas);}});
 const motion=Object.assign(target(),{matches:!!options.reduce});
 const queue=new Map();let frameId=0,reads=0,draws=0;
 const gl={};let id=1;
 for(const key of ['VERTEX_SHADER','FRAGMENT_SHADER','HIGH_FLOAT','COMPILE_STATUS','LINK_STATUS','ARRAY_BUFFER','STATIC_DRAW','FLOAT','TRIANGLES','TEXTURE_2D','TEXTURE_MIN_FILTER','TEXTURE_MAG_FILTER','TEXTURE_WRAP_S','TEXTURE_WRAP_T','NEAREST','CLAMP_TO_EDGE','RGBA','UNSIGNED_BYTE','FRAMEBUFFER','COLOR_ATTACHMENT0','FRAMEBUFFER_COMPLETE'])gl[key]=id++;
 gl.NO_ERROR=0;const sources=[];
 for(const name of ['shaderSource','compileShader','deleteShader','attachShader','linkProgram','useProgram','deleteProgram','deleteBuffer','bindBuffer','bufferData','enableVertexAttribArray','vertexAttribPointer','viewport','uniform1f','bindTexture','texParameteri','texImage2D','bindFramebuffer','framebufferTexture2D','deleteTexture','deleteFramebuffer'])gl[name]=()=>{};
 gl.shaderSource=(s,code)=>sources.push(code);
 for(const name of ['createShader','createProgram','createBuffer','createTexture','createFramebuffer','getUniformLocation'])gl[name]=()=>({});
 gl.getShaderPrecisionFormat=()=>({precision:options.precision??23});
 gl.getShaderParameter=()=>!options.compileFail;
 gl.getProgramParameter=()=>!options.linkFail;
 gl.getAttribLocation=()=>0;
 gl.checkFramebufferStatus=()=>options.incomplete?0:gl.FRAMEBUFFER_COMPLETE;
 gl.getError=()=>options.glError?1282:0;gl.isContextLost=()=>false;
 gl.drawArrays=()=>draws++;
 gl.readPixels=(x,y,w,h,f,t,pixels)=>{reads++;assert.equal(classes.has('has-canvas'),false,'fallback remains until pixel validation');if(!options.blank)for(let i=0;i<pixels.length;i+=40){pixels[i]=22;pixels[i+1]=22;pixels[i+2]=23;pixels[i+3]=32;}};
 const originalRead=gl.readPixels;
 gl.readPixels=(...args)=>{originalRead(...args);if(options.opaque)args[6].fill(173);};
 canvas.getContext=()=>{if(options.throwContext)throw Error('blocked');return options.noGL?null:gl;};
 const doc=Object.assign(target(),{hidden:false,querySelector:()=>host,createElement:()=>canvas});
 const win=Object.assign(target(),{matchMedia:q=>q.includes('any-pointer') ? {matches:!!options.touch} : motion});
 globalThis.document=doc;globalThis.window=win;
 globalThis.requestAnimationFrame=fn=>{queue.set(++frameId,fn);return frameId;};globalThis.cancelAnimationFrame=id=>queue.delete(id);
 return {host,canvas,motion,doc,win,queue,sources,get reads(){return reads;},get draws(){return draws;}};
}
for(const [label,options,reason] of [
 ['WebGL assente',{noGL:true},'webgl-unavailable'],
 ['contesto bloccato',{throwContext:true},'blocked'],
 ['precisione insufficiente',{precision:10},'insufficient-precision'],
 ['compilazione fallita',{compileFail:true},'shader-compile'],
 ['link fallito',{linkFail:true},'program-link'],
 ['framebuffer incompleto',{incomplete:true},'pixel-test-failed'],
 ['pixel trasparenti',{blank:true},'pixel-test-failed'],
 ['rettangolo opaco',{opaque:true},'pixel-test-failed'],
 ['errore GPU',{glError:true},'pixel-test-failed']]){
 test(label+' conserva il fallback',()=>{const f=fixture(options);const controller=setupHeroSmoke();assert.equal(controller.renderer,'css');assert.equal(controller.reason,reason);assert.equal(f.host.classList.contains('has-canvas'),false);assert.equal(f.queue.size,0);controller.destroy();});
}
test('WebGL viene mostrato solo dopo il controllo dei pixel',()=>{const f=fixture();const c=setupHeroSmoke();assert.equal(f.reads,1);assert.equal(c.renderer,'webgl');assert.equal(f.canvas.hidden,false);assert.equal(f.queue.size,1);assert.ok(f.sources[1].includes('precision highp float'));assert.ok(f.sources[1].includes('dx*dx'));assert.ok(!f.sources[1].includes('pow('));c.destroy();assert.equal(f.queue.size,0);});
test('perdita contesto ripristina fallback e interrompe rendering',()=>{const f=fixture();const c=setupHeroSmoke();let prevented=false;f.canvas.emit('webglcontextlost',{preventDefault(){prevented=true;}});assert.ok(prevented);assert.equal(c.reason,'context-lost');assert.equal(c.renderer,'css');assert.ok(f.canvas.hidden);assert.equal(f.queue.size,0);c.destroy();});
test('riduzione movimento usa texture statica e reagisce ai cambi di preferenza',()=>{const f=fixture({reduce:true});const c=setupHeroSmoke();assert.equal(c.reason,'reduced-motion');assert.equal(f.queue.size,0);f.motion.matches=false;f.motion.emit('change');assert.equal(c.renderer,'webgl');f.motion.matches=true;f.motion.emit('change');assert.equal(c.renderer,'css');assert.equal(f.queue.size,0);c.destroy();});
test('scheda nascosta e ritorno non duplicano i loop',()=>{const f=fixture();const c=setupHeroSmoke();f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.queue.size,0);assert.equal(c.renderer,'css');f.doc.hidden=false;f.doc.emit('visibilitychange');f.win.emit('resize');assert.equal(c.renderer,'webgl');assert.equal(f.queue.size,1);c.destroy();});
test('modalità CSS forzata per test sul telefono',()=>{const f=fixture();const c=setupHeroSmoke({mode:'css'});assert.equal(c.reason,'forced-css');assert.equal(f.reads,0);assert.equal(f.queue.size,0);c.destroy();});
test('modifiche CSS limitate al fumo e texture locale presente',async()=>{const css=await readFile(new URL('../dist/css/style.css',import.meta.url),'utf8');assert.ok(css.includes('.hero .smoke canvas[hidden] { display: none; }'));assert.ok(css.includes('smoke-texture-drift-a'));const png=Buffer.from(css.match(/data:image\/png;base64,([^']+)/)[1],'base64');assert.equal(png.subarray(1,4).toString(),'PNG');});

test('touch devices never initialize WebGL',()=>{const f=fixture({touch:true});const c=setupHeroSmoke();assert.equal(c.reason,'touch-device');assert.equal(c.renderer,'css');assert.equal(f.reads,0);assert.equal(f.sources.length,0);c.destroy();});
