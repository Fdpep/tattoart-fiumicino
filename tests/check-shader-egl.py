"""Optional real GLES shader check through local EGL (no browser emulation).
Requires system libEGL + libGL; uses a surfaceless pbuffer where supported.
Does not represent a test on Redmi hardware.
"""
import ctypes as C, re
from pathlib import Path
E=C.CDLL('libEGL.so.1');G=C.CDLL('libGL.so.1')
def bind(lib,name,restype,args):
 f=getattr(lib,name);f.restype=restype;f.argtypes=args;return f
P=C.c_void_p;I=C.c_int;U=C.c_uint;F=C.c_float
getproc=bind(E,'eglGetProcAddress',P,[C.c_char_p]);ptr=getproc(b'eglGetPlatformDisplayEXT')
assert ptr,'surfaceless EGL unavailable'
getdisplay=C.CFUNCTYPE(P,U,P,C.POINTER(I))(ptr)
display=getdisplay(0x31DD,None,None)
init=bind(E,'eglInitialize',U,[P,C.POINTER(I),C.POINTER(I)]);major=I();minor=I();assert init(display,C.byref(major),C.byref(minor))
assert bind(E,'eglBindAPI',U,[U])(0x30A0)
attrs=(I*15)(0x3033,1,0x3040,4,0x3024,8,0x3023,8,0x3022,8,0x3021,8,0x3038,0,0)
config=P();count=I();assert bind(E,'eglChooseConfig',U,[P,C.POINTER(I),C.POINTER(P),I,C.POINTER(I)])(display,attrs,C.byref(config),1,C.byref(count)) and count.value
surf=bind(E,'eglCreatePbufferSurface',P,[P,P,C.POINTER(I)])(display,config,(I*5)(0x3057,96,0x3056,64,0x3038))
ctx=bind(E,'eglCreateContext',P,[P,P,P,C.POINTER(I)])(display,config,None,(I*3)(0x3098,2,0x3038))
assert ctx and surf and bind(E,'eglMakeCurrent',U,[P,P,P,P])(display,surf,surf,ctx)
getstr=bind(G,'glGetString',C.c_char_p,[U]);print('Renderer:',getstr(0x1F01).decode())
source=(Path(__file__).resolve().parents[1]/'dist/js/hero-smoke.js').read_text()
vertex=re.search(r'const vertex = `([\s\S]*?)`;',source).group(1);fragment=re.search(r'const fragment = `([\s\S]*?)`;',source).group(1)
create=bind(G,'glCreateShader',U,[U]);setsrc=bind(G,'glShaderSource',None,[U,I,C.POINTER(C.c_char_p),C.POINTER(I)]);compile_=bind(G,'glCompileShader',None,[U]);shaderiv=bind(G,'glGetShaderiv',None,[U,U,C.POINTER(I)]);log=bind(G,'glGetShaderInfoLog',None,[U,I,C.POINTER(I),P])
def shader(kind,src):
 s=create(kind);text=C.c_char_p(src.encode());setsrc(s,1,C.byref(text),None);compile_(s);ok=I();shaderiv(s,0x8B81,C.byref(ok));buf=C.create_string_buffer(8192);log(s,8192,None,buf);assert ok.value,buf.value.decode();return s
vs=shader(0x8B31,vertex);fs=shader(0x8B30,fragment)
program=bind(G,'glCreateProgram',U,[])();attach=bind(G,'glAttachShader',None,[U,U]);attach(program,vs);attach(program,fs);bind(G,'glLinkProgram',None,[U])(program)
ok=I();bind(G,'glGetProgramiv',None,[U,U,C.POINTER(I)])(program,0x8B82,C.byref(ok));assert ok.value,'program link failed'
bind(G,'glUseProgram',None,[U])(program);buf=U();bind(G,'glGenBuffers',None,[I,C.POINTER(U)])(1,C.byref(buf));bind(G,'glBindBuffer',None,[U,U])(0x8892,buf)
data=(F*12)(-1,-1,1,-1,-1,1,-1,1,1,-1,1,1);bind(G,'glBufferData',None,[U,C.c_ssize_t,P,U])(0x8892,C.sizeof(data),data,0x88E4)
position=bind(G,'glGetAttribLocation',I,[U,C.c_char_p])(program,b'position');bind(G,'glEnableVertexAttribArray',None,[U])(position);bind(G,'glVertexAttribPointer',None,[U,I,U,U,I,P])(position,2,0x1406,0,0,None)
loc=bind(G,'glGetUniformLocation',I,[U,C.c_char_p]);uniform=bind(G,'glUniform1f',None,[I,F]);viewport=bind(G,'glViewport',None,[I,I,I,I]);draw=bind(G,'glDrawArrays',None,[U,I,I]);read=bind(G,'glReadPixels',None,[I,I,I,I,U,U,P]);error=bind(G,'glGetError',U,[])
for width,height in [(360,525),(390,525),(430,525),(1440,630)]:
 uniform(loc(program,b'aspect'),width/height)
 for t in [0.,2.,20.]:
  uniform(loc(program,b'time'),t);viewport(0,0,96,64);draw(4,0,6)
  pixels=(C.c_ubyte*(96*64*4))();read(0,0,96,64,0x1908,0x1401,pixels)
  n=sum(pixels[i]>=6 and max(pixels[i-1],pixels[i-2],pixels[i-3])>=4 for i in range(3,len(pixels),4))
  assert error()==0,'GL error';assert n>=12,f'Invisible output at {width},t={t}: {n}'
  assert sum(pixels[i]<=2 for i in range(3,len(pixels),4))>=96*64*.3,'Missing transparent background'
  assert all(pixels[i]<=134 and max(pixels[i-1],pixels[i-2],pixels[i-3])<=pixels[i]+2 for i in range(3,len(pixels),4)),'Invalid alpha/premultiplication'
  print(f'{width}px t={t:g}s: {n} visible pixels — PASS')
bind(E,'eglMakeCurrent',U,[P,P,P,P])(display,None,None,None);bind(E,'eglDestroyContext',U,[P,P])(display,ctx);bind(E,'eglDestroySurface',U,[P,P])(display,surf);bind(E,'eglTerminate',U,[P])(display)
