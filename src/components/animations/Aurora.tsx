import { memo, useRef, useEffect, type CSSProperties } from 'react';
import { useReducedMotion } from '../../lib/animations';
import { useVisualCapability } from '../../lib/visualCapability';

interface AuroraProps {
  colorStops?: string[];
  amplitude?: number;
  blend?: number;
  speed?: number;
  time?: number;
  className?: string;
  style?: CSSProperties;
}

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(
    dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)
  ), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \\
  int index = 0;                                              \\
  for (int i = 0; i < 2; i++) {                               \\
    ColorStop currentColor = colors[i];                        \\
    bool isBetween = currentColor.position <= factor;          \\
    index = isBetween ? i : index;                             \\
  }                                                           \\
  ColorStop currentColor = colors[index];                      \\
  ColorStop nextColor = colors[index + 1];                     \\
  float range = nextColor.position - currentColor.position;    \\
  float t = (factor - currentColor.position) / range;          \\
  t = clamp(t, 0.0, 1.0);                                     \\
  finalColor = mix(currentColor.color, nextColor.color, t);    \\
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midBlend = 0.2 * sin(uTime * 0.4) + 0.5;
  float AuroraNoise = snoise(vec2(uv.x * 1.0 + uTime * 0.15, uTime * 0.08));
  intensity += AuroraNoise * uBlend * midBlend;

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor, intensity * 0.8);
}`;

function hexToLinearRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.2);
  return [toLinear(r), toLinear(g), toLinear(b)];
}

function AuroraInner({
  colorStops = ['#2d5a27', '#8fbc8f', '#f5f0e0'],
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
  time: timeOffset = 0,
  className,
  style,
}: AuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reducedMotion = useReducedMotion();
  const capability = useVisualCapability();
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (reducedMotion || capability.mode !== 'desktop-3d') return;

    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const gl = canvas.getContext('webgl2', {
      alpha: true,
      premultipliedAlpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    });
    if (!gl) return;
    glRef.current = gl;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Geometry: full-screen triangle
    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Aurora shader error:', gl.getShaderInfoLog(s));
        gl.deleteShader(s);
        return null;
      }
      return s;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Aurora program error:', gl.getProgramInfoLog(program));
      return;
    }
    programRef.current = program;

    gl.useProgram(program);
    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'uTime');
    const uAmplitude = gl.getUniformLocation(program, 'uAmplitude');
    const uColorStops = gl.getUniformLocation(program, 'uColorStops');
    const uResolution = gl.getUniformLocation(program, 'uResolution');
    const uBlend = gl.getUniformLocation(program, 'uBlend');
    gl.uniform1f(uAmplitude, amplitude);
    gl.uniform1f(uBlend, blend);

    const rgb = colorStops.map(hexToLinearRgb);
    gl.uniform3fv(uColorStops, new Float32Array(rgb.flat()));

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    let start = performance.now();
    const render = () => {
      const elapsed = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, elapsed * speed + timeOffset);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    };
  }, [reducedMotion, capability.mode, colorStops, amplitude, blend, speed, timeOffset]);

  if (reducedMotion || capability.mode !== 'desktop-3d') {
    // Lightweight fallback: CSS gradient using the same color stops
    const fallback = `linear-gradient(135deg, ${colorStops[0]}44, ${colorStops[1]}66, ${colorStops[2]}44)`;
    return (
      <div
        className={className}
        style={{ ...style, background: fallback, position: 'absolute', inset: 0 }}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ ...style, position: 'absolute', inset: 0 }}
      aria-hidden="true"
    />
  );
}

export default memo(AuroraInner);
