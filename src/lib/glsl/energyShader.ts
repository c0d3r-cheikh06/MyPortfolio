/**
 * Custom GLSL shaders for sci-fi architectural energy elements:
 *  1. Hologram Pedestal Projection Rings (precision concentric calibration)
 *  2. Volumetric Laser Construction Beams
 *  3. Abstract Interactive Gaming Screen Shader (Gaming Pod)
 */

export const holoRingVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const holoRingFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;
    float a = atan(p.y, p.x);

    // Precision rings
    float ring1 = smoothstep(0.018, 0.0, abs(r - 0.92));
    float ring2 = smoothstep(0.012, 0.0, abs(r - 0.72)) * step(0.1, sin(a * 6.0 + uTime * 0.7));
    float ring3 = smoothstep(0.010, 0.0, abs(r - 0.50)) * step(-0.2, cos(a * 12.0 - uTime * 1.1));
    float ticks = smoothstep(0.015, 0.0, abs(r - 0.82)) * smoothstep(0.85, 0.95, sin(a * 48.0 + uTime * 0.3));
    float pulse = exp(-abs(r - fract(uTime * 0.28)) * 18.0) * 0.45 * (1.0 - r);
    float centerGlow = exp(-r * r * 4.5) * 0.28;

    float alpha = (ring1 * 0.75 + ring2 * 0.65 + ring3 * 0.55 + ticks * 0.6 + pulse + centerGlow) * uIntensity;
    vec3 col = mix(uColor, vec3(0.92, 0.98, 1.0), ring1 * 0.45 + pulse * 0.4);
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.95));
  }
`;

export const laserBeamVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const laserBeamFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;
  varying vec2 vUv;

  void main() {
    // Radial soft core across cylinder circumference / quad width
    float core = pow(sin(vUv.x * 3.14159265), 1.8);
    float edgeFade = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.92, vUv.y);
    float pulse = 0.72 + 0.28 * sin(vUv.y * 28.0 - uTime * 16.0);
    vec3 col = mix(uColor, vec3(1.0), core * 0.65);
    gl_FragColor = vec4(col, core * edgeFade * pulse * uOpacity);
  }
`;

export const gamingScreenVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const gamingScreenFragmentShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec3 bg = vec3(0.025, 0.038, 0.065);

    // Perspective synth-horizon cyber track
    float horizon = 0.44;
    if (uv.y < horizon) {
      float z = 0.16 / max(horizon - uv.y, 0.008);
      float x = (uv.x - 0.5) * z;
      float gx = smoothstep(0.92, 0.99, abs(sin(x * 3.14159)));
      float gz = smoothstep(0.92, 0.99, abs(sin((z - uTime * 4.5) * 2.2)));
      float grid = max(gx, gz) * smoothstep(horizon, 0.02, uv.y);
      bg += vec3(0.18, 0.78, 0.98) * grid * 0.55;
      bg += vec3(0.30, 0.95, 0.72) * smoothstep(0.05, 0.0, abs(x)) * 0.45;
    } else {
      // Upper radar / audio-reactive HUD waveform
      float wave = 0.68 + 0.08 * sin(uv.x * 16.0 + uTime * 3.8) * cos(uv.x * 5.0 - uTime * 1.4);
      float line = exp(-abs(uv.y - wave) * 65.0);
      float wave2 = 0.68 + 0.05 * cos(uv.x * 22.0 - uTime * 4.6);
      float line2 = exp(-abs(uv.y - wave2) * 70.0);
      bg += vec3(0.306, 0.949, 0.722) * line * 1.1 + vec3(0.22, 0.74, 0.98) * line2 * 0.85;
    }

    // Horizon glow & corner HUD brackets
    bg += vec3(0.24, 0.84, 0.78) * exp(-abs(uv.y - horizon) * 42.0) * 0.75;
    float scan = 0.92 + 0.08 * sin(uv.y * 220.0);
    gl_FragColor = vec4(bg * scan, 1.0);
  }
`;
