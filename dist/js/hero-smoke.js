/* Original procedural smoke: no third-party video or remote assets.
   Two translucent, slowly rising plumes behind the photographs. */
export function setupHeroSmoke() {
 const host=document.querySelector('.hero .smoke');
 if(!host)return;
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
 const gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,depth:false,preserveDrawingBuffer:false});
 if(!gl)return; // The local SVG in CSS remains as a static fallback.
 const vertex='attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}';
 const fragment=`precision mediump float;
 varying vec2 uv;uniform float time;uniform float aspect;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(1.6,-1.2,1.2,1.6)*p+3.7;a*=.5;}return v;}
 float plume(vec2 p,float center,float phase){
  float h=p.y;
  float bend=.035*sin(h*8.-time*.17+phase)+.025*sin(h*17.+time*.09);
  float width=.025+h*.12;
  float envelope=exp(-pow((p.x-center-bend)/width,2.))*smoothstep(.06,.22,h)*(1.-smoothstep(.72,1.,h));
  vec2 q=vec2((p.x-center)*aspect*4.,h*3.2-time*.12);
  vec2 warp=vec2(fbm(q+phase),fbm(q+vec2(4.7,1.3)+phase));
  float n=fbm(q+warp*2.8);
  float strands=pow(max(0.,1.-abs(n-.51)*5.),5.);
  float detail=fbm(q*3.+warp*3.);
  return envelope*strands*(.25+detail*.75);
 }
 void main(){vec2 p=uv;float density=plume(p,.19,1.7)+plume(p,.81,8.2);
 float edge=smoothstep(0.,.07,p.x)*smoothstep(0.,.07,1.-p.x);
 gl_FragColor=vec4(vec3(.68,.68,.70),min(.52,density*.65)*edge);}`;
 const compile=(type,source)=>{const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){gl.deleteShader(shader);return null;}return shader;};
 const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;
 gl.useProgram(program);const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
 const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
 const time=gl.getUniformLocation(program,'time'),aspect=gl.getUniformLocation(program,'aspect');
 host.append(canvas);host.classList.add('has-canvas');
 let raf=0,visible=true,last=0,elapsed=0,previous=0,lost=false;
 function resize(){const r=host.getBoundingClientRect();canvas.width=Math.max(1,Math.min(1000,Math.round(r.width*.65)));canvas.height=Math.max(1,Math.round(r.height*.65));gl.viewport(0,0,canvas.width,canvas.height);gl.uniform1f(aspect,r.width/Math.max(1,r.height));draw();}
 function draw(){gl.uniform1f(time,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);}
 function frame(now){raf=0;if(!visible||document.hidden||motion.matches||lost){previous=0;return;}if(now-last>1000/24){if(previous)elapsed+=Math.min((now-previous)/1000,.1);previous=now;last=now;draw();}raf=requestAnimationFrame(frame);}
 function resume(){cancelAnimationFrame(raf);raf=0;previous=0;if(visible&&!document.hidden&&!motion.matches&&!lost)raf=requestAnimationFrame(frame);else draw();}
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();},{rootMargin:'60px'}).observe(host);
 document.addEventListener('visibilitychange',resume);motion.addEventListener('change',resume);window.addEventListener('resize',resize,{passive:true});
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;cancelAnimationFrame(raf);host.classList.remove('has-canvas');canvas.hidden=true;});
 resize();resume();
}
