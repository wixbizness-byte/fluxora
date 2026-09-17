"use client";

import { useEffect, useRef } from "react";
import styles from "./start-guide.module.css";

export type StartFxScene = "intro" | "quiz" | "analyzing" | "results";

declare global {
  interface Window {
    FluxFX?: {
      go: (scene: StartFxScene, step?: number) => void;
      nudge: (strength?: number) => void;
    };
  }
}

type NavigatorWithConnection = Navigator & {
  connection?: { saveData?: boolean };
};

type Pose = {
  offX: number;
  offY: number;
  speed: number;
  dim: number;
  stepV: number;
};

export default function StartSilkBackdrop() {
  const fxRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fx = fxRef.current;
    const canvas = canvasRef.current;
    if (!fx || !canvas) return;

    const api = {
      go: (_scene: StartFxScene, _step = 1) => {},
      nudge: (_strength = 0.35) => {},
    };
    window.FluxFX = api;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as NavigatorWithConnection).connection?.saveData === true;
    const still = reduce || saveData;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      powerPreference: "low-power",
    });

    const fail = () => {
      fx.dataset.renderer = "none";
    };
    if (!gl) {
      fail();
      return;
    }

    const SIZE = 256;
    const PERIOD = 16;
    const grid = Array.from({ length: PERIOD * PERIOD }, Math.random);
    const pixels = new Uint8Array(SIZE * SIZE);
    const sm = (t: number) => t * t * (3 - 2 * t);

    for (let y = 0; y < SIZE; y += 1) {
      const gy = (y / SIZE) * PERIOD;
      const iy = Math.floor(gy);
      const fy = sm(gy - iy);
      const y0 = iy % PERIOD;
      const y1 = (iy + 1) % PERIOD;
      for (let x = 0; x < SIZE; x += 1) {
        const gx = (x / SIZE) * PERIOD;
        const ix = Math.floor(gx);
        const fxv = sm(gx - ix);
        const x0 = ix % PERIOD;
        const x1 = (ix + 1) % PERIOD;
        const a = grid[y0 * PERIOD + x0];
        const b = grid[y0 * PERIOD + x1];
        const c = grid[y1 * PERIOD + x0];
        const d = grid[y1 * PERIOD + x1];
        pixels[y * SIZE + x] = Math.round(
          ((a + (b - a) * fxv) * (1 - fy) + (c + (d - c) * fxv) * fy) * 255,
        );
      }
    }

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      SIZE,
      SIZE,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      pixels,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);

    const VERT = "attribute vec2 aPos; void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }";
    const fragment = (octaves: number) => `
      precision mediump float;
      #define OCTAVES ${octaves}
      #define NORM ${(1 / (1 - Math.pow(0.5, octaves))).toFixed(4)}
      uniform sampler2D uNoise;
      uniform vec2 uRes, uOff;
      uniform float uTime, uPulse, uStep, uDim;
      float noise(vec2 p){ return texture2D(uNoise, p / ${PERIOD}.0).r; }
      float fbm(vec2 p){
        float v = 0.0, a = 0.5;
        for (int i = 0; i < OCTAVES; i++){
          v += a * noise(p);
          p = p * 2.03 + vec2(1.7, 9.2);
          a *= 0.5;
        }
        return v * NORM;
      }
      void main(){
        vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
        float t = uTime * 0.05;
        vec2 p = uv * vec2(1.0, 1.7) + uOff;
        vec2 q = vec2(fbm(p + vec2(t, 0.0)), fbm(p + vec2(5.2, 1.3) - t));
        vec2 r = vec2(
          fbm(p + 2.0 * q + vec2(1.7, 9.2) + t * 1.3),
          fbm(p + 2.0 * q + vec2(8.3, 2.8) - t * 0.9)
        );
        float f = fbm(p + 2.4 * r);
        float band = pow(0.5 + 0.5 * sin(f * 20.0 - uTime * 0.25 + uStep * 0.9), 12.0);
        float sheen = smoothstep(0.35, 0.9, f);
        vec3 gold = vec3(1.0, 0.80, 0.42);
        vec3 amber = vec3(0.60, 0.34, 0.09);
        vec3 col = mix(amber, gold, band) * (band * (0.75 + uPulse * 0.9) + sheen * 0.045);
        col *= (1.0 - smoothstep(-0.55, 0.55, uv.y)) * 0.9 * uDim;
        gl_FragColor = vec4(vec3(0.035, 0.047, 0.07) + col, 1.0);
      }`;

    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Unable to create shader.");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader) || "Shader compile failed.");
      }
      return shader;
    };

    const buildProgram = (octaves: number) => {
      const program = gl.createProgram();
      if (!program) throw new Error("Unable to create WebGL program.");
      gl.attachShader(program, compile(gl.VERTEX_SHADER, VERT));
      gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment(octaves)));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) || "Program link failed.");
      }

      const uniforms = Object.fromEntries(
        ["uNoise", "uRes", "uOff", "uTime", "uPulse", "uStep", "uDim"].map((name) => [
          name,
          gl.getUniformLocation(program, name),
        ]),
      );

      return {
        program,
        uniforms,
        location: gl.getAttribLocation(program, "aPos"),
      };
    };

    let programs: Record<number, ReturnType<typeof buildProgram>>;
    try {
      programs = { 4: buildProgram(4), 3: buildProgram(3) };
    } catch (error) {
      console.warn("Fluxora Start silk disabled", error);
      fail();
      return;
    }

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );

    const levels = [
      { scale: 0.5, octaves: 4 },
      { scale: 0.4, octaves: 4 },
      { scale: 0.33, octaves: 3 },
      { scale: 0.25, octaves: 3 },
    ];

    let width = 0;
    let height = 0;
    let mobile = false;
    let level = 0;
    let scene: StartFxScene = "intro";
    const pose = (nextScene: StartFxScene, step = 1): Pose => {
      if (nextScene === "quiz") {
        return {
          offX: Math.sin(step * 2.3) * 0.9,
          offY: step * 0.45,
          speed: 1 + step * 0.06,
          dim: 0.8,
          stepV: step,
        };
      }
      if (nextScene === "analyzing") {
        return { offX: 0.2, offY: 3.6, speed: 3.2, dim: 1.05, stepV: 7 };
      }
      if (nextScene === "results") {
        return { offX: -0.6, offY: 4.4, speed: 0.5, dim: 0.65, stepV: 8 };
      }
      return { offX: 0, offY: 0, speed: 1, dim: 1, stepV: 0 };
    };

    let current = pose("intro", 0);
    let target = { ...current };
    let clock = 0;
    let simTime = 8;
    let changeAt = -99;
    let pulseAmount = 0;
    const pulse = () => pulseAmount * Math.exp(-(clock - changeAt) * 1.1);

    const draw = () => {
      const selected = programs[levels[level].octaves];
      gl.useProgram(selected.program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(selected.location);
      gl.vertexAttribPointer(selected.location, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(selected.uniforms.uNoise, 0);
      gl.uniform2f(selected.uniforms.uRes, canvas.width, canvas.height);
      gl.uniform2f(selected.uniforms.uOff, current.offX, current.offY);
      gl.uniform1f(selected.uniforms.uTime, simTime);
      gl.uniform1f(selected.uniforms.uPulse, still ? 0 : pulse());
      gl.uniform1f(selected.uniforms.uStep, current.stepV);
      gl.uniform1f(selected.uniforms.uDim, current.dim);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const resize = () => {
      width = fx.clientWidth;
      height = fx.clientHeight;
      const nextMobile = width <= 700;
      if (nextMobile !== mobile || !canvas.width) {
        level = Math.max(level, nextMobile ? 2 : 0);
      }
      mobile = nextMobile;
      const scale =
        levels[level].scale * Math.min(window.devicePixelRatio || 1, 1.25);
      canvas.width = Math.max(1, Math.round(width * scale));
      canvas.height = Math.max(1, Math.round(height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (still) draw();
    };

    api.go = (nextScene, step = 1) => {
      scene = nextScene || "intro";
      target = pose(scene, step);
      changeAt = clock;
      pulseAmount = 1;
      fx.style.opacity = "1";
      if (still) {
        current = { ...target };
        draw();
      }
    };

    api.nudge = (strength = 0.35) => {
      if (still) return;
      if (strength > pulse()) {
        pulseAmount = strength;
        changeAt = clock;
      }
    };

    const FRAME = 1000 / 30;
    let raf = 0;
    let lastTick = 0;
    let lastDraw = 0;
    let samples: number[] = [];
    let lastDowngrade = 0;

    const paused = () =>
      document.hidden ||
      (scene === "results" && window.scrollY > window.innerHeight * 1.2);

    const tick = (now: number) => {
      raf = window.requestAnimationFrame(tick);
      const dt = lastTick ? Math.min((now - lastTick) / 1000, 0.1) : 0;
      lastTick = now;
      if (paused()) return;

      if (dt > 0) {
        samples.push(dt);
        if (samples.length > 45) samples.shift();
        if (
          samples.length === 45 &&
          level < levels.length - 1 &&
          now - lastDowngrade > 3000
        ) {
          const average = samples.reduce((sum, value) => sum + value, 0) / samples.length;
          if (average > 0.028) {
            level += 1;
            lastDowngrade = now;
            samples = [];
            resize();
          }
        }
      }

      clock += dt;
      const amount = 1 - Math.exp(-dt * 1.4);
      (Object.keys(target) as Array<keyof Pose>).forEach((key) => {
        current[key] += (target[key] - current[key]) * amount;
      });
      simTime += dt * current.speed * (1 + pulse() * 2.5);

      if (now - lastDraw < FRAME - 2) return;
      lastDraw = now;
      fx.style.opacity =
        scene === "results"
          ? String(1 - Math.min(window.scrollY / 700, 1) * 0.45)
          : "1";
      draw();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(fx);
    resize();

    const onVisibility = () => {
      lastTick = 0;
      samples = [];
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      window.cancelAnimationFrame(raf);
      fail();
    };

    if (still) draw();
    else {
      raf = window.requestAnimationFrame(tick);
      document.addEventListener("visibilitychange", onVisibility);
    }

    canvas.addEventListener("webglcontextlost", onContextLost);
    fx.dataset.renderer = "webgl";

    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.cancelAnimationFrame(raf);
      if (window.FluxFX === api) delete window.FluxFX;
    };
  }, []);

  return (
    <div ref={fxRef} className={styles.fx} data-renderer="none" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  );
}
