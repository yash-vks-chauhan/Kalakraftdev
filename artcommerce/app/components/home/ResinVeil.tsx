'use client'

import { useEffect, useRef } from 'react'

// "Living resin" background, built for the Kalakraft hero.
//
// A slow, autonomous pour rendered as a lit material rather than a glow:
// the fold field yields a surface normal, a fixed studio key light shades
// ridge and valley, and a Kajiya-Kay term stretches a satin highlight along
// the fold direction — the draped-silk signature. Copper pigment pools wide
// and thins to hairlines, dragged into streaks along the flow, shifting
// between deep amber and pale gold. A dimmer vein layer swims beneath the
// surface (offset by the normal, like refraction through clear resin) and a
// broad soft-box reflection drifts across the gloss. No cursor interaction —
// the pour simply keeps settling.
//
// Raw WebGL on a fullscreen triangle — no dependencies. Pauses when
// offscreen or the tab is hidden; renders a single static frame under
// prefers-reduced-motion.

interface ResinVeilProps {
  speed?: number
  resolutionScale?: number
  className?: string
}

const VERTEX = `
attribute vec2 position;
void main(){gl_Position=vec4(position,0.0,1.0);}
`

const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2  uResolution;
uniform float uTime;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}

float noise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.0,0.0)),u.x),
             mix(hash(i+vec2(0.0,1.0)),hash(i+vec2(1.0,1.0)),u.x),u.y);
}

// Four smooth octaves: enough structure to marble, too few to turn to smoke.
float fbm(vec2 p){
  float v=0.0;
  float a=0.55;
  mat2 rot=mat2(0.8,0.6,-0.6,0.8);
  for(int i=0;i<4;i++){
    v+=a*noise(p);
    p=rot*p*1.9;
    a*=0.5;
  }
  return v;
}

void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-uResolution)/min(uResolution.x,uResolution.y);
  float t=uTime*0.045;

  // The whole field settles with a barely perceptible viscous rotation.
  float an=0.05*sin(t*0.35);
  mat2 R=mat2(cos(an),-sin(an),sin(an),cos(an));
  vec2 p=R*vec2(uv.x*0.74,uv.y*0.98)*0.85;

  // Laminar two-stage warp: q bends the domain, r bends q — the smooth,
  // heavy folding of pigment through a viscous pour.
  vec2 q=vec2(fbm(p+0.09*t),fbm(p+vec2(5.2,1.3)-0.07*t));
  vec2 r=vec2(fbm(p+3.2*q+vec2(1.7,9.2)+0.11*t),
              fbm(p+3.2*q+vec2(8.3,2.8)-0.09*t));
  float f=fbm(p+2.6*r);

  // Macro rivers: the pour rests in quiet black between a few slow currents
  // where the pigment gathers. Never fully zero, so the whole surface
  // breathes faintly.
  float field=0.18+0.82*smoothstep(0.30,0.74,fbm(p*0.45+vec2(3.7,7.1)+0.04*t));

  // ---- Lighting: treat the fold field as a height map ----
  // Screen-space derivatives, normalised to uv units so fold depth is
  // resolution-independent. Without the extension the surface falls back
  // to flat shading (constant diff) and simply loses the relief.
  float px=2.0/min(uResolution.x,uResolution.y);
#ifdef HAS_DERIVS
  vec2 grad=clamp(vec2(dFdx(f),dFdy(f))/px,-6.0,6.0);
#else
  vec2 grad=vec2(0.0);
#endif
  vec3 n=normalize(vec3(-grad*0.38,1.0));
  vec3 L=normalize(vec3(-0.45,0.60,0.68));
  float diff=clamp(dot(n,L),0.0,1.0);
  float shade=0.42+0.58*diff;

  // Kajiya-Kay satin sheen: highlight stretched along the fold tangent,
  // present only where the surface actually folds.
  vec3 T=normalize(vec3(-grad.y,grad.x,0.0)+vec3(1e-4,0.0,0.0));
  vec3 H=normalize(L+vec3(0.0,0.0,1.0));
  float th=dot(T,H);
  float sheen=pow(max(1.0-th*th,0.0),24.0)*smoothstep(0.12,0.75,length(grad)*0.38);

  // Body: deep charcoal, folds catching the key light.
  vec3 col=mix(vec3(0.005,0.005,0.006),vec3(0.030,0.026,0.022),smoothstep(0.15,0.85,f));
  col*=0.72+0.55*diff;

  // A warm undertow where the flow gathers — the depth of the material.
  float pool=smoothstep(0.5,1.0,length(q));
  col=mix(col,vec3(0.085,0.052,0.030),pool*0.22*field);

  // Pigment: pools wide in places and thins to hairlines in others, dragged
  // into elongated streaks along the fold direction like metallic pigment
  // pulled through a pour.
  float wmod=fbm(p*0.7+vec2(9.1,4.7)+0.03*t);
  float w=mix(0.012,0.085,smoothstep(0.2,0.8,wmod));
  float d=abs(f-0.5);
  float vein=1.0-smoothstep(w*0.35,w,d);
  vec2 fdir=normalize(vec2(-grad.y,grad.x)+vec2(1e-4,0.0));
  vec2 sp2=vec2(dot(p,fdir),dot(p,vec2(-fdir.y,fdir.x)));
  float streak=fbm(sp2*vec2(0.9,3.6)+vec2(0.0,0.05*t));
  vein*=0.45+0.55*smoothstep(0.25,0.75,streak);
  vein*=vein;
  float core=1.0-smoothstep(0.0,w*0.4,d);

  // Copper shifts between deep amber and pale gold along its length —
  // metallic pigment is never one colour.
  float hueN=fbm(p*0.55+q*1.4+vec2(2.3,6.9));
  vec3 copper=mix(vec3(0.55,0.30,0.13),vec3(0.96,0.78,0.55),smoothstep(0.2,0.8,hueN));

  col+=copper*vein*field*(0.20+0.80*shade)*0.72;
  col+=vec3(1.00,0.85,0.62)*core*core*vein*field*shade*0.50;
  col+=vec3(0.92,0.74,0.55)*sheen*field*0.36;

  // A second ribbon layer deeper in the resin: its coordinates are offset
  // by the surface normal, so it swims slightly against the surface layer —
  // refraction through the clear pour.
  float f2=fbm(p*1.3+2.2*r.yx+n.xy*0.12+vec2(4.0,2.0)+0.05*t);
  float vein2=smoothstep(0.44,0.50,f2)*smoothstep(0.56,0.50,f2);
  col+=vec3(0.42,0.24,0.12)*vein2*vein2*field*(0.5+0.5*shade)*0.22;

  // One broad soft-box reflection drifting across the gloss — only flat,
  // glossy stretches of the surface catch it.
  float s=dot(uv,normalize(vec2(0.80,0.60)));
  float refl=exp(-pow((s+0.35-0.55*sin(t*0.22))*2.2,2.0));
  col+=vec3(0.85,0.80,0.72)*refl*pow(max(n.z,0.0),3.0)*0.030;

  // Ease the light away from the text block; settle the edges.
  col*=1.0-0.30*exp(-dot(uv,uv)*1.15);
  col*=smoothstep(2.9,0.55,length(uv));

  // Fine grain so the gradients never band.
  col+=(hash(gl_FragCoord.xy+fract(uTime)*61.0)-0.5)*0.012;

  gl_FragColor=vec4(clamp(col,0.0,1.0),1.0);
}
`

export default function ResinVeil({
  speed = 1,
  resolutionScale = 0.6,
  className = '',
}: ResinVeilProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl', { antialias: false, depth: false, stencil: false })
    if (!gl) return

    // Screen-space derivatives power the lighting; near-universal on WebGL1.
    const derivExt = gl.getExtension('OES_standard_derivatives')
    const fragmentSource = derivExt
      ? '#extension GL_OES_standard_derivatives : enable\n#define HAS_DERIVS 1\n' + FRAGMENT
      : FRAGMENT

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('ResinVeil shader error:', gl.getShaderInfoLog(shader))
      }
      return shader
    }

    const program = gl.createProgram()!
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
    gl.linkProgram(program)
    gl.useProgram(program)

    // Fullscreen triangle
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(program, 'position')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = {
      resolution: gl.getUniformLocation(program, 'uResolution'),
      time: gl.getUniformLocation(program, 'uTime'),
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    let running = false
    let visible = true
    const start = performance.now()

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      const w = Math.max(1, Math.round(parent.clientWidth * resolutionScale * dpr))
      const h = Math.max(1, Math.round(parent.clientHeight * resolutionScale * dpr))
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
      gl.uniform2f(u.resolution, w, h)
    }

    const render = () => {
      const elapsed = ((performance.now() - start) / 1000) * speed
      gl.uniform1f(u.time, reduced ? 40 : elapsed % 3600)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }

    const loop = () => {
      if (!running) return
      render()
      raf = requestAnimationFrame(loop)
    }

    const startLoop = () => {
      if (running || reduced || !visible || document.hidden) return
      running = true
      raf = requestAnimationFrame(loop)
    }

    const stopLoop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    resize()
    render()

    const ro = new ResizeObserver(() => {
      resize()
      if (!running) render()
    })
    if (canvas.parentElement) ro.observe(canvas.parentElement)

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) startLoop()
      else stopLoop()
    })
    io.observe(canvas)

    const onVisibility = () => {
      if (document.hidden) stopLoop()
      else startLoop()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stopLoop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    }
  }, [speed, resolutionScale])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
