/**
 * Custom GLSL shaders for the living 3D astronomical sky:
 *  1. Atmospheric Sky Dome (continuous smooth Day <-> Dusk <-> Deep Space Night interpolation)
 *  2. Multi-layer Volumetric Space Nebula Dome (fades out cleanly in daytime)
 *  3. Scintillating Starfield Point Shader (smooth circular falloff + spectral color temperature)
 */

export const skyDomeVertexShader = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const skyDomeFragmentShader = /* glsl */ `
  uniform float uDayFactor;
  uniform float uTime;
  uniform vec3 uSunDir;
  uniform vec3 uMoonDir;

  varying vec3 vDir;

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
          mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
          mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.04 + vec3(13.1, 7.7, 5.3);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = clamp(d.y, -0.35, 1.0);
    float up = clamp(d.y, 0.0, 1.0);

    // Night deep space gradient (rich obsidian zenith -> deep midnight sapphire/teal horizon)
    vec3 nightZenith = vec3(0.008, 0.014, 0.028);
    vec3 nightMid = vec3(0.018, 0.036, 0.068);
    vec3 nightHorizon = vec3(0.038, 0.088, 0.125);
    vec3 nightSky = mix(nightHorizon, nightMid, smoothstep(0.0, 0.28, up));
    nightSky = mix(nightSky, nightZenith, smoothstep(0.25, 0.85, up));

    // Subtle cosmic Milky Way / mint-indigo nebula band in night sky
    float band = exp(-abs(d.y * 0.72 + d.x * 0.42 - 0.18) * 3.8);
    float neb = fbm(d * 3.4 + vec3(uTime * 0.003, 0.0, -uTime * 0.002));
    float neb2 = fbm(d * 6.8 - vec3(0.0, uTime * 0.004, 0.0));
    vec3 nebulaCol = mix(vec3(0.05, 0.14, 0.28), vec3(0.08, 0.34, 0.29), neb2);
    nightSky += nebulaCol * band * smoothstep(0.38, 0.82, neb) * 0.55;

    // Lunar atmospheric halo
    float moonDot = max(dot(d, normalize(uMoonDir)), 0.0);
    nightSky += vec3(0.32, 0.46, 0.62) * pow(moonDot, 16.0) * 0.24;
    nightSky += vec3(0.75, 0.88, 1.0) * pow(moonDot, 140.0) * 0.35;

    // Golden-hour / twilight transition curve (peaks around uDayFactor = 0.5)
    float twilight = sin(uDayFactor * 3.14159265);
    vec3 duskHorizon = vec3(0.78, 0.38, 0.24);
    vec3 duskMid = vec3(0.22, 0.24, 0.42);
    vec3 duskSky = mix(duskHorizon, duskMid, smoothstep(0.0, 0.45, up));

    // Crisp luminous Day sky (Rayleigh azure zenith + soft luminous horizon)
    vec3 dayZenith = vec3(0.11, 0.36, 0.76);
    vec3 dayMid = vec3(0.32, 0.62, 0.90);
    vec3 dayHorizon = vec3(0.76, 0.89, 0.97);
    vec3 daySky = mix(dayHorizon, dayMid, smoothstep(0.0, 0.32, up));
    daySky = mix(daySky, dayZenith, smoothstep(0.30, 0.88, up));

    // Solar Mie scattering & warm aureole
    float sunDot = max(dot(d, normalize(uSunDir)), 0.0);
    daySky += vec3(1.0, 0.93, 0.78) * pow(sunDot, 12.0) * 0.32;
    daySky += vec3(1.0, 0.98, 0.90) * pow(sunDot, 180.0) * 0.85;

    // Blend Night -> Twilight -> Day seamlessly
    vec3 col = mix(nightSky, daySky, smoothstep(0.0, 1.0, uDayFactor));
    col = mix(col, duskSky + vec3(1.0, 0.55, 0.28) * pow(sunDot, 6.0) * 0.5, twilight * 0.48);

    // Below horizon atmospheric mist (subtle sea of clouds glow)
    float below = smoothstep(0.02, -0.25, h);
    vec3 lowerNight = vec3(0.012, 0.024, 0.036);
    vec3 lowerDay = vec3(0.64, 0.78, 0.88);
    col = mix(col, mix(lowerNight, lowerDay, uDayFactor), below * 0.85);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export const starfieldVertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;

  uniform float uTime;
  uniform float uOpacity;
  uniform float uPixelRatio;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = aColor;
    float twinkle = 0.68 + 0.32 * sin(uTime * (1.2 + fract(aPhase) * 2.4) + aPhase * 6.2831);
    vAlpha = twinkle * uOpacity;

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = clamp(aSize * uPixelRatio * (260.0 / max(-mvPos.z, 1.0)), 1.2, 7.5);
  }
`;

export const starfieldFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float core = exp(-r * r * 26.0);
    float halo = exp(-r * 6.5) * 0.55;
    float a = (core + halo) * vAlpha;
    gl_FragColor = vec4(vColor * (1.0 + core * 0.8), a);
  }
`;
