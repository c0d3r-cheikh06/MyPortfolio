/**
 * Custom GLSL shaders for sci-fi architectural energy elements:
 *  1. Hologram Pedestal Projection Rings (precision concentric calibration)
 *  2. Volumetric 3D Cylindrical Laser Construction Beams (white-hot core + mint glow + data pulses)
 *  3. Volumetric Pedestal Projection Light Column (soft rising hologram cone)
 *  4. Abstract Interactive Gaming Screen Shader (Gaming Pod)
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
    float a = r > 0.001 ? atan(p.y, p.x) : 0.0;

    // Precision calibrated reticle rings
    float ring1 = smoothstep(0.016, 0.0, abs(r - 0.92));
    float ring2 = smoothstep(0.011, 0.0, abs(r - 0.72)) * step(0.1, sin(a * 6.0 + uTime * 0.7));
    float ring3 = smoothstep(0.009, 0.0, abs(r - 0.50)) * step(-0.2, cos(a * 12.0 - uTime * 1.1));
    float ticks = smoothstep(0.014, 0.0, abs(r - 0.82)) * smoothstep(0.85, 0.95, sin(a * 48.0 + uTime * 0.3));
    float pulse = exp(-abs(r - fract(uTime * 0.28)) * 18.0) * 0.42 * (1.0 - r);
    float centerGlow = exp(-r * r * 4.8) * 0.26;

    float alpha = (ring1 * 0.75 + ring2 * 0.65 + ring3 * 0.55 + ticks * 0.6 + pulse + centerGlow) * uIntensity;
    vec3 col = max(mix(uColor, vec3(0.92, 0.98, 1.0), ring1 * 0.45 + pulse * 0.4), vec3(0.0));
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.92));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const laserBeamVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const laserBeamFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform vec3 uColor;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    // Cylindrical beam radial glow: bright white-hot axis fading softly to edges
    float ndotv = clamp(abs(dot(normalize(vNormalW), normalize(vViewDir))), 0.0001, 1.0);
    float halo = pow(ndotv, 1.65);
    float hotCore = pow(ndotv, 6.0);
    float endFade = smoothstep(0.0, 0.06, vUv.y) * smoothstep(1.0, 0.93, vUv.y);
    float pulse = 0.76 + 0.24 * sin(vUv.y * 32.0 - uTime * 18.0);
    float dataStreak = smoothstep(0.75, 1.0, sin(vUv.y * 14.0 - uTime * 10.0)) * 0.35;

    vec3 col = max(mix(uColor * 1.15, vec3(0.98, 1.0, 0.99), hotCore * 0.85 + dataStreak * 0.4), vec3(0.0));
    float alpha = (halo * 0.58 + hotCore * 0.62 + dataStreak * 0.2) * endFade * pulse * uOpacity;
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 1.0));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const projectionConeVertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const projectionConeFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    // Soft center-lit volumetric cone fading smoothly to zero at cylinder sides & top
    float ndotv = clamp(abs(dot(normalize(vNormalW), normalize(vViewDir))), 0.0001, 1.0);
    float sideFade = pow(ndotv, 1.85);
    float vFade = smoothstep(0.0, 0.14, vUv.y) * pow(max(1.0 - vUv.y, 0.0001), 1.55);

    // Delicate rising vertical hologram energy curtains
    float ang = vUv.x * 6.2831853 * 6.0;
    float curtain = 0.65 + 0.35 * sin(ang + uTime * 0.6) * cos(ang * 0.5 - uTime * 0.4);
    float scanUp = 0.82 + 0.18 * sin(vUv.y * 45.0 - uTime * 3.8);

    float alpha = sideFade * vFade * curtain * scanUp * 0.16 * uIntensity;
    vec3 col = max(mix(uColor, vec3(0.88, 1.0, 0.96), vFade * 0.35), vec3(0.0));
    gl_FragColor = vec4(col, clamp(alpha, 0.0, 0.45));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
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
    gl_FragColor = vec4(max(bg * scan, vec3(0.0)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
