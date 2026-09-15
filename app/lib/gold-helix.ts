// Gold particle geometry and shaders ported from the approved homepage design.
const TAU = Math.PI * 2;
export const TURN_MS = 14000;

export const vertexSource = `
      attribute vec3 aPosition;
      attribute vec3 aParticle;
      attribute vec3 aColor;
      uniform vec2 uSpin;
      uniform vec2 uLean;
      uniform vec2 uViewport;
      uniform vec2 uCenter;
      uniform float uScale;
      uniform float uPixelRatio;
      uniform float uGlow;
      varying vec3 vColor;
      varying vec2 vGrain;
      varying float vGlow;
      vec3 axialRotation(vec3 v) {
        return vec3(v.x, uSpin.x*v.y-uSpin.y*v.z, uSpin.y*v.y+uSpin.x*v.z);
      }
      void main() {
        vec3 p = axialRotation(aPosition);
        vec2 projected = vec2(p.x + .38*p.z, p.y + .12*p.z);
        projected = mat2(uLean.x,uLean.y,-uLean.y,uLean.x)*projected*uScale + uCenter;
        gl_Position = vec4(projected.x*2.0/uViewport.x, -projected.y*2.0/uViewport.y, -p.z/700.0, 1.0);
        float depth=clamp((p.z+240.0)/480.0,0.0,1.0);
        gl_PointSize=clamp(aParticle.x*uScale*1.5*(.90+.20*depth)*mix(1.0,4.5,uGlow),2.6,mix(12.0,54.0,uGlow))*uPixelRatio;
        vColor = aColor;
        vGlow = uGlow;
        vGrain=vec2(aParticle.y*(.65+.35*depth),aParticle.z);
      }
    `;
export const fragmentSource = `
      precision mediump float;
      varying vec3 vColor;
      varying vec2 vGrain;
      varying float vGlow;
      void main() {
        // Each point is a separate softly edged, slightly irregular grain.
        vec2 p=(gl_PointCoord-.5)*2.0;
        p.x*=.86+.28*fract(vGrain.y*7.21);
        p.y+=p.x*(fract(vGrain.y*13.7)-.5)*.28;
        float radius=dot(p,p);
        if (radius>1.0) discard;
        float core=1.0-smoothstep(.08,.40,radius);
        float halo=(1.0-radius)*.30;
        float alpha=(core+halo)*vGrain.x;
        float shade=.70+.30*sqrt(max(1.0-radius,0.0));
        vec3 color=mix(vColor,vec3(1.0,.95,.78),core*.35)*shade;
        if (vGlow>.5) {
          // Bloom pass: wide, faint, warm falloff that pools where grains cluster.
          float bloom=(1.0-radius)*(1.0-radius)*.055*vGrain.x;
          gl_FragColor=vec4(vec3(1.0,.72,.22)*bloom,bloom);
          return;
        }
        gl_FragColor=vec4(color*alpha,alpha);
      }
    `;

    export function createHelixParticles() {
      const vertices: number[] = [];
      const add = (a: number[], b: number[]) => a.map((value,i) => value+b[i]);
      const scale = (a: number[], n: number) => a.map(value => value*n);
      const normalize = (a: number[]) => scale(a,1/Math.hypot(...a));
      const cross = (a: number[], b: number[]) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
      const k = TAU/830;
      // Fixed seed: point positions stay attached to the DNA throughout a turn.
      let seed=0x46584c31;
      const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      const center = (x: number, strand: number) => {
        const angle = (x+850)*k+.38+strand*Math.PI;
        return [x,170*Math.cos(angle),170*Math.sin(angle)];
      };
      const particle = (p: number[], loose=false) => {
        const size=2.6+Math.pow(random(),1.30)*3.9;
        const opacity=(.45+.55*random())*(loose?.46:1);
        const variation=.88+.12*random();
        vertices.push(...p,size,opacity,random(),1.0*variation,.80*variation,.32*variation);
      };
      // Sample a loose volume, not the skin of a cylinder. The outer 14% form
      // a faint irregular fringe rather than a hard tube boundary.
      for (let strand=0;strand<2;strand++) {
        for (let i=0;i<3000;i++) {
          const x=-1040+2080*random();
          const angle = (x+850)*k+.38+strand*Math.PI;
          const radial = [0,Math.cos(angle),Math.sin(angle)];
          const tangent = normalize([1,-170*k*Math.sin(angle),170*k*Math.cos(angle)]);
          const binormal = cross(tangent,radial);
          const loose=random()<.14;
          const radius=loose?40+random()*34:35*Math.sqrt(random());
          const a=random()*TAU;
          const offset=add(scale(radial,Math.cos(a)*radius),scale(binormal,Math.sin(a)*radius));
          const jitter=scale(tangent,(random()-.5)*(loose?22:9));
          particle(add(add(center(x,strand),offset),jitter),loose);
          }
      }
      // Crossbars are also loose grains; nothing solid connects the strands.
      for (let x=-990;x<=1000;x+=63) {
        const a=center(x,0),b=center(x,1);
        const axis=normalize(b.map((value,i)=>value-a[i]));
        const radial=[1,0,0],binormal=cross(axis,radial);
        for(let i=0;i<54;i++) {
          const t=.035+.93*random();
          const point=a.map((value,j)=>value+(b[j]-value)*t);
          const loose=random()<.12;
          const radius=loose?16+random()*12:11.8*Math.sqrt(random());
          const angle=random()*TAU;
          const offset=add(scale(radial,Math.cos(angle)*radius),scale(binormal,Math.sin(angle)*radius));
          particle(add(point,offset),loose);
        }
      }
      return { vertices:new Float32Array(vertices),count:vertices.length/9 };
    }

export type HelixCloud = ReturnType<typeof createHelixParticles>;
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));

type UniformName = 'uSpin' | 'uLean' | 'uViewport' | 'uCenter' | 'uScale' | 'uPixelRatio' | 'uGlow';
type Uniforms = Record<UniformName, WebGLUniformLocation | null>;

/** Start one renderer. The returned disposer owns every listener and GPU resource. */
export function mountGoldHelix(backdrop: HTMLDivElement, canvas: HTMLCanvasElement, page: HTMLElement, cloud: HelixCloud) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const listeners = new AbortController();
  const signal = listeners.signal;
  const target = { x: 0, y: 0, scroll: 0 };
  const current = { ...target };
  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let vertexBuffer: WebGLBuffer | null = null;
  let uniforms: Uniforms | null = null;
  let ready = false, lost = false, disposed = false, raf = 0, phase = 0;
  let lastFrame: number | null = null;
  let width = 1, height = 1, scrollRange = 1, artScale = 1, centerX = 0, centerY = 0;

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    lastFrame = null;
  }

  function queue() {
    if (ready && !disposed && !lost && !document.hidden && !reducedMotion.matches && !raf) {
      raf = requestAnimationFrame(frame);
    }
  }

  function draw() {
    if (!ready || disposed || lost || !gl || !uniforms) return;
    const lean = (-8 + current.scroll * 3 + current.x * .6) * Math.PI / 180;
    gl.uniform2f(uniforms.uSpin, Math.cos(phase), Math.sin(phase));
    gl.uniform2f(uniforms.uLean, Math.cos(lean), Math.sin(lean));
    gl.uniform2f(uniforms.uCenter, centerX - width / 2 + current.x * 8, centerY - height / 2 + current.y * 5 - current.scroll * 12);
    gl.clear(gl.COLOR_BUFFER_BIT);
    // Two passes of the same point cloud: soft gold bloom, then crisp grains.
    gl.uniform1f(uniforms.uGlow, 1);
    gl.drawArrays(gl.POINTS, 0, cloud.count);
    gl.uniform1f(uniforms.uGlow, 0);
    gl.drawArrays(gl.POINTS, 0, cloud.count);
  }

  function frame(timestamp: number) {
    raf = 0;
    if (!ready || disposed || lost || document.hidden || reducedMotion.matches) { stop(); return; }
    const dt = lastFrame === null ? 0 : clamp(timestamp - lastFrame, 0, 64);
    lastFrame = timestamp;
    phase = (phase + dt * TAU / TURN_MS) % TAU;
    const blend = 1 - Math.exp(-(dt || 16) / 80);
    for (const key of ['x', 'y', 'scroll'] as const) current[key] += (target[key] - current[key]) * blend;
    draw();
    queue();
  }

  function pageTop(element: HTMLElement) {
    let y = 0;
    for (let node: HTMLElement | null = element; node; node = node.offsetParent as HTMLElement | null) y += node.offsetTop;
    return y;
  }

  function dimOnScroll() {
    backdrop.style.opacity = String(1 - clamp(window.scrollY / 700, 0, 1) * .6);
  }

  function measure() {
    if (disposed) return;
    width = Math.max(backdrop.clientWidth, 1);
    height = Math.max(backdrop.clientHeight, 1);
    scrollRange = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const mobile = width <= 720;
    const artWidth = mobile ? Math.max(700, width * 1.75) : width <= 980 ? width * 1.42 : Math.min(width * 1.15, 2300);
    artScale = artWidth / 1700;
    centerX = mobile ? width * .5 : width <= 980 ? width * 1.35 - artWidth / 2 : width * 1.12 - artWidth / 2;
    if (mobile) {
      const actions = page.querySelector<HTMLElement>('[data-hero-actions]');
      const eyebrow = page.querySelector<HTMLElement>('[data-destinations] p');
      const textEnd = actions ? pageTop(actions) + actions.offsetHeight - 64 : height * .45;
      const nextStart = eyebrow ? pageTop(eyebrow) - 64 : textEnd + 220;
      centerY = (textEnd + nextStart) / 2;
      backdrop.style.setProperty('--dnaTextEnd', `${textEnd}px`);
      backdrop.style.setProperty('--dnaFallbackTop', `${centerY - artWidth * 3 / 17}px`);
    } else {
      centerY = (width <= 980 ? 5 : -36) + artWidth * 3 / 17;
    }
    target.scroll = clamp(window.scrollY / scrollRange, 0, 1);
    dimOnScroll();
    if (!ready || lost || !gl || !uniforms) return;
    const maxSize: number = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const ratio = Math.min(window.devicePixelRatio || 1, mobile ? 1.35 : 1.5, maxSize / width, maxSize / height);
    const pixelWidth = Math.max(1, Math.round(width * ratio));
    const pixelHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
    gl.viewport(0, 0, pixelWidth, pixelHeight);
    gl.uniform2f(uniforms.uViewport, width, height);
    gl.uniform1f(uniforms.uScale, artScale);
    gl.uniform1f(uniforms.uPixelRatio, ratio);
    draw();
    queue();
  }

  function releaseGpu() {
    ready = false;
    if (gl && !lost) {
      if (vertexBuffer) gl.deleteBuffer(vertexBuffer);
      if (program) gl.deleteProgram(program);
    }
    vertexBuffer = null;
    program = null;
    uniforms = null;
  }

  function initialize() {
    if (disposed) return;
    stop();
    releaseGpu();
    backdrop.dataset.renderer = 'fallback';
    const shaders: WebGLShader[] = [];
    try {
      const context = canvas.getContext('webgl', { alpha: true, antialias: true, depth: false, premultipliedAlpha: true, powerPreference: 'low-power' });
      gl = context;
      if (!context) { measure(); return; }
      lost = false;
      const compile = (type: number, source: string) => {
        const shader = context.createShader(type);
        if (!shader) throw new Error('DNA shader unavailable');
        shaders.push(shader);
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) throw new Error('DNA shader unavailable');
        return shader;
      };
      const vertex = compile(context.VERTEX_SHADER, vertexSource);
      const fragment = compile(context.FRAGMENT_SHADER, fragmentSource);
      program = context.createProgram();
      if (!program) throw new Error('DNA program unavailable');
      context.attachShader(program, vertex);
      context.attachShader(program, fragment);
      context.linkProgram(program);
      if (!context.getProgramParameter(program, context.LINK_STATUS)) throw new Error('DNA shader link unavailable');
      context.useProgram(program);
      vertexBuffer = context.createBuffer();
      if (!vertexBuffer) throw new Error('DNA buffer unavailable');
      context.bindBuffer(context.ARRAY_BUFFER, vertexBuffer);
      context.bufferData(context.ARRAY_BUFFER, cloud.vertices, context.STATIC_DRAW);
      ['aPosition', 'aParticle', 'aColor'].forEach((name, index) => {
        const attribute = context.getAttribLocation(program!, name);
        context.enableVertexAttribArray(attribute);
        context.vertexAttribPointer(attribute, 3, context.FLOAT, false, 36, index * 12);
      });
      const names: UniformName[] = ['uSpin', 'uLean', 'uViewport', 'uCenter', 'uScale', 'uPixelRatio', 'uGlow'];
      uniforms = Object.fromEntries(names.map(name => [name, context.getUniformLocation(program!, name)])) as Uniforms;
      context.disable(context.DEPTH_TEST);
      context.enable(context.BLEND);
      context.blendFunc(context.ONE, context.ONE);
      context.clearColor(0, 0, 0, 0);
      ready = true;
      measure();
      backdrop.dataset.renderer = 'webgl';
    } catch {
      stop();
      releaseGpu();
      backdrop.dataset.renderer = 'fallback';
      measure();
    } finally {
      if (gl) for (const shader of shaders) gl.deleteShader(shader);
    }
  }

  function resetPointer() { target.x = target.y = 0; }
  window.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || event.pointerType === 'touch') return;
    target.x = clamp(event.clientX / window.innerWidth * 2 - 1, -1, 1);
    target.y = clamp(event.clientY / window.innerHeight * 2 - 1, -1, 1);
  }, { passive: true, signal });
  document.documentElement.addEventListener('pointerleave', resetPointer, { passive: true, signal });
  window.addEventListener('blur', resetPointer, { signal });
  window.addEventListener('scroll', () => {
    target.scroll = clamp(window.scrollY / scrollRange, 0, 1);
    dimOnScroll();
  }, { passive: true, signal });
  window.addEventListener('resize', measure, { passive: true, signal });
  window.addEventListener('pagehide', stop, { signal });
  window.addEventListener('pageshow', measure, { passive: true, signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else measure(); }, { signal });
  reducedMotion.addEventListener('change', () => {
    stop();
    resetPointer();
    current.x = current.y = 0;
    current.scroll = target.scroll;
    draw();
    queue();
  }, { signal });
  finePointer.addEventListener('change', resetPointer, { signal });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    stop();
    backdrop.dataset.renderer = 'fallback';
  }, { signal });
  canvas.addEventListener('webglcontextrestored', initialize, { signal });
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
  resizeObserver?.observe(page);
  initialize();

  return () => {
    disposed = true;
    stop();
    listeners.abort();
    resizeObserver?.disconnect();
    releaseGpu();
    backdrop.dataset.renderer = 'fallback';
  };
}
