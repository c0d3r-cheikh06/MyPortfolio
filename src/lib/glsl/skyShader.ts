/**
 * Photographic Living Astronomical Sky & Volumetric Cloud Shaders:
 *  1. Sky Dome + True 3D Volumetric Ray-Marched Cumulus Clouds & Horizon Cloud Sea
 *     - Physical Rayleigh + Mie atmosphere with smooth Night <-> Golden Twilight <-> Azure Day
 *     - Multi-step volumetric fBM cloud ray marching with solar Henyey-Greenstein scattering,
 *       soft self-shadowing (beer-powder dark cloud bellies + silver-white sunlit tops),
 *       and subtle moonlit cloud wisps in Night Mode.
 *     - Milky Way / deep-space nebula band fading smoothly at dawn.
 *  2. Scintillating Starfield Point Shader with airy-disk radial falloff & spectral temperatures.
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

  float hash21(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 34.345);
    return fract(p.x * p.y);
  }

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  float noise3(vec3 p) {
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

  const mat2 rot2 = mat2(0.80, -0.60, 0.60, 0.80);

  // Domain-warped 5-octave fBM for organic fluffy cloud billows
  float cloudFbm(vec2 p) {
    float v = 0.0;
    float a = 0.52;
    for (int i = 0; i < 5; i++) {
      v += a * noise2(p);
      p = rot2 * p * 2.04 + vec2(1.7, 9.2);
      a *= 0.50;
    }
    return v;
  }

  float spaceFbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3(p);
      p = p * 2.02 + vec3(11.3, 5.7, 8.9);
      a *= 0.5;
    }
    return v;
  }

  // Evaluate volumetric cloud density at a 2D sky-plane projection with height profile
  float sampleCloud(vec2 uv, float hFrac, float coverage) {
    vec2 wind = vec2(uTime * 0.014, uTime * 0.006);
    // Subtle domain warp for realistic billowing edges
    float warp = cloudFbm(uv * 0.65 + wind * 0.5);
    float base = cloudFbm(uv + wind + vec2(warp * 0.55, -warp * 0.35));
    float detail = cloudFbm(uv * 2.6 - wind * 1.4);
    float shape = base - (1.0 - detail) * 0.16;
    // Vertical cumulus shaping: flat cloud base, billowy rounded top
    float hProfile = smoothstep(0.0, 0.22, hFrac) * smoothstep(1.0, 0.32, hFrac);
    float d = smoothstep(coverage, coverage + 0.34, shape * hProfile * 1.35);
    return d;
  }

  void main() {
    vec3 d = normalize(vDir);
    vec3 sunDir = normalize(uSunDir);
    vec3 moonDir = normalize(uMoonDir);
    float up = clamp(d.y, 0.0, 1.0);
    float sunDot = max(dot(d, sunDir), 0.0);
    float moonDot = max(dot(d, moonDir), 0.0);

    // ══════════ 1. DEEP SPACE NIGHT SKY + NEBULA + LUNAR HALO ══════════
    vec3 nightZenith = vec3(0.006, 0.011, 0.022);
    vec3 nightMid = vec3(0.014, 0.028, 0.054);
    vec3 nightHorizon = vec3(0.026, 0.058, 0.088);
    vec3 nightSky = mix(nightHorizon, nightMid, smoothstep(0.0, 0.26, up));
    nightSky = mix(nightSky, nightZenith, smoothstep(0.22, 0.82, up));

    // Delicate deep-space Milky Way & teal-indigo nebula band
    float band = exp(-abs(d.y * 0.65 + d.x * 0.48 - 0.20) * 4.2);
    float neb1 = spaceFbm(d * 3.1 + vec3(uTime * 0.002, 0.0, 0.0));
    float neb2 = spaceFbm(d * 6.4 - vec3(0.0, uTime * 0.003, 0.0));
    vec3 nebColor = mix(vec3(0.05, 0.12, 0.26), vec3(0.06, 0.28, 0.26), neb2);
    nightSky += nebColor * band * smoothstep(0.42, 0.84, neb1) * 0.48;

    // Crisp Lunar atmospheric scatter
    nightSky += vec3(0.26, 0.40, 0.58) * pow(moonDot, 12.0) * 0.22;
    nightSky += vec3(0.75, 0.88, 1.0) * pow(moonDot, 120.0) * 0.34;

    // ══════════ 2. LUMINOUS DAYTIME ATMOSPHERE (RAYLEIGH + MIE) ══════════
    vec3 dayZenith = vec3(0.10, 0.33, 0.72);
    vec3 dayMid = vec3(0.30, 0.58, 0.88);
    vec3 dayHorizon = vec3(0.78, 0.89, 0.96);
    vec3 daySky = mix(dayHorizon, dayMid, smoothstep(0.0, 0.28, up));
    daySky = mix(daySky, dayZenith, smoothstep(0.26, 0.86, up));

    // Warm golden solar Mie glow
    daySky += vec3(1.0, 0.92, 0.76) * pow(sunDot, 8.0) * 0.28;
    daySky += vec3(1.0, 0.97, 0.88) * pow(sunDot, 140.0) * 0.85;

    // Cinematic Golden-Hour Twilight blend around uDayFactor = 0.5
    float twilight = sin(uDayFactor * 3.14159265);
    vec3 duskHorizon = vec3(0.84, 0.44, 0.26);
    vec3 duskMid = vec3(0.20, 0.24, 0.44);
    vec3 duskSky = mix(duskHorizon, duskMid, smoothstep(0.0, 0.44, up));

    vec3 skyCol = mix(nightSky, daySky, smoothstep(0.0, 1.0, uDayFactor));
    skyCol = mix(skyCol, duskSky + vec3(1.0, 0.58, 0.30) * pow(sunDot, 5.0) * 0.45, twilight * 0.50);

    // ══════════ 3. TRUE MULTI-LAYER VOLUMETRIC RAY-MARCHED SKY CLOUDS ══════════
    if (d.y > 0.015) {
      vec3 lightDir = normalize(mix(moonDir, sunDir, smoothstep(0.25, 0.75, uDayFactor)));
      float lightDot = max(dot(d, lightDir), 0.0);
      // Henyey-Greenstein forward scattering approximation (silver lining around Sun/Moon!)
      float silverLining = pow(lightDot, 6.0) * 0.65 + pow(lightDot, 24.0) * 0.55;

      // Cloud lighting palette smoothly linked to Day / Twilight / Night
      vec3 nightLit = vec3(0.22, 0.34, 0.46);
      vec3 nightShade = vec3(0.03, 0.06, 0.11);
      vec3 dayLit = vec3(1.00, 0.98, 0.95);
      vec3 dayShade = vec3(0.46, 0.58, 0.72);
      vec3 duskLit = vec3(1.00, 0.70, 0.48);

      vec3 cLit = mix(nightLit, dayLit, uDayFactor);
      cLit = mix(cLit, duskLit, twilight * 0.55);
      vec3 cShade = mix(nightShade, dayShade, uDayFactor);

      // 6 volumetric altitude slabs marched along viewing ray
      float transmittance = 1.0;
      vec3 accumLight = vec3(0.0);
      float coverage = mix(0.48, 0.36, uDayFactor); // sparser wisps at night, fuller cumulus by day

      for (int i = 0; i < 6; i++) {
        float fi = (float(i) + 0.5) / 6.0;
        float slabH = 1.8 + fi * 1.15;
        vec2 uv = (d.xz / max(d.y + 0.08, 0.09)) * slabH * 0.36;
        float dens = sampleCloud(uv, fi, coverage);

        if (dens > 0.005) {
          // One directional shadow offset sample toward the Sun/Moon for real 3D volumetric shading!
          vec2 shadowUv = uv + lightDir.xz * 0.18;
          float shadowDens = sampleCloud(shadowUv, min(1.0, fi + 0.22), coverage);
          float litAmount = clamp(exp(-shadowDens * 1.75) * (0.45 + 0.55 * fi), 0.0, 1.0);

          vec3 stepCol = mix(cShade, cLit, litAmount);
          stepCol += cLit * silverLining * (1.0 - shadowDens * 0.55) * mix(0.25, 0.65, uDayFactor);

          float stepAlpha = dens * (0.34 + 0.22 * uDayFactor);
          accumLight += transmittance * stepCol * stepAlpha;
          transmittance *= (1.0 - stepAlpha);
          if (transmittance < 0.04) break;
        }
      }

      // Soft atmospheric distance fade near horizon so clouds blend seamlessly into aerial perspective
      float horizonFade = smoothstep(0.015, 0.16, d.y);
      float cloudAlpha = (1.0 - transmittance) * horizonFade * mix(0.62, 0.96, uDayFactor);
      vec3 cloudColor = accumLight / max(1.0 - transmittance, 0.001);
      skyCol = mix(skyCol, cloudColor, cloudAlpha);
    }

    // ══════════ 4. INFINITE VOLUMETRIC SEA OF CLOUDS BELOW THE ORBITAL LAB ══════════
    if (d.y < 0.03) {
      float downMask = smoothstep(0.03, -0.14, d.y);
      vec2 seaUv = (d.xz / max(-d.y + 0.14, 0.14)) * 0.55 + vec2(uTime * 0.012, -uTime * 0.005);
      float sea1 = cloudFbm(seaUv);
      float sea2 = cloudFbm(seaUv * 2.1 + vec2(3.1, 1.4));
      float billow = smoothstep(0.22, 0.82, sea1 * 0.72 + sea2 * 0.32);

      vec3 seaNightDeep = vec3(0.014, 0.028, 0.046);
      vec3 seaNightCrest = vec3(0.06, 0.13, 0.19);
      vec3 seaDayDeep = vec3(0.50, 0.66, 0.80);
      vec3 seaDayCrest = vec3(0.92, 0.96, 0.99);

      vec3 seaCol = mix(
        mix(seaNightDeep, seaNightCrest, billow),
        mix(seaDayDeep, seaDayCrest, billow),
        uDayFactor
      );
      seaCol = mix(seaCol, vec3(0.75, 0.48, 0.38), twilight * 0.32 * billow);
      skyCol = mix(skyCol, seaCol, downMask * 0.94);
    }

    gl_FragColor = vec4(skyCol, 1.0);
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
    float twinkle = 0.72 + 0.28 * sin(uTime * (1.1 + fract(aPhase) * 2.2) + aPhase * 6.2831);
    vAlpha = twinkle * uOpacity;

    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = clamp(aSize * uPixelRatio * (240.0 / max(-mvPos.z, 1.0)), 1.0, 5.5);
  }
`;

export const starfieldFragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float r = length(uv);
    if (r > 0.5) discard;
    float core = exp(-r * r * 30.0);
    float halo = exp(-r * 7.5) * 0.45;
    float a = (core + halo) * vAlpha;
    gl_FragColor = vec4(vColor * (1.0 + core * 0.7), a);
  }
`;
