/**
 * Photographic Living Astronomical Sky, Volumetric Perlin-Worley Cloud & Celestial Shaders:
 *  1. Sky Dome + True 3D Spherical-Shell Volumetric Ray-Marched Cumulus Clouds + Cloud Sea
 *     - Curved Earth-atmosphere spherical cloud layer (zero horizon stretching!)
 *     - Fast 3D Perlin-Worley billow noise with macro weather map (sculpted clouds + clear azure sky)
 *     - Beer-Lambert transmittance + powder effect + 3-step directional light march + Henyey-Greenstein silver lining
 *     - Deep cosmic night sky with Milky Way rift, subtle nebulae & moonlit cloud wisps
 *     - Smooth Golden-Hour Twilight transitions
 *  2. Realistic Lunar Phase Surface Shader (crater bump relief + shadow terminator + earthshine)
 *  3. Solar Photosphere & Radial Mie Corona Shader (smooth edge fade, zero hard spheres)
 *  4. 3D Parallax Volumetric Cloud Cluster Shader (ambient spatial depth while orbiting)
 *  5. Scintillating Spectral Starfield Point Shader
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
  uniform int uCloudSteps;

  varying vec3 vDir;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
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
    float a = hash12(i);
    float b = hash12(i + vec2(1.0, 0.0));
    float c = hash12(i + vec2(0.0, 1.0));
    float d = hash12(i + vec2(1.0, 1.0));
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

  // Fast 3D Worley inverted-distance cellular puff noise (1x1x1 local neighborhood)
  float worley3(vec3 p) {
    vec3 id = floor(p);
    vec3 fd = fract(p);
    float minD = 1.5;
    for (int z = -1; z <= 1; z++) {
      for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
          vec3 n = vec3(float(x), float(y), float(z));
          vec3 jitter = vec3(
            hash31(id + n),
            hash31(id + n + vec3(17.1, 31.7, 11.3)),
            hash31(id + n + vec3(53.9, 7.3, 41.1))
          );
          vec3 diff = n + jitter - fd;
          minD = min(minD, dot(diff, diff));
        }
      }
    }
    return clamp(1.0 - sqrt(minD), 0.0, 1.0);
  }

  const mat2 rot2 = mat2(0.80, -0.60, 0.60, 0.80);

  float cloudFbm2(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise2(p);
      p = rot2 * p * 2.03 + vec2(3.7, 8.1);
      a *= 0.5;
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

  // True 3D Perlin-Worley cumulus density field
  float sampleCloud3D(vec3 p, float hFrac, float baseCov) {
    vec3 wind = vec3(uTime * 0.14, 0.0, uTime * 0.06);
    vec3 q = p * 0.21 + wind;

    // Macro weather patchiness -> sculpted cloud banks separated by clear blue sky!
    float weather = smoothstep(0.28, 0.74, cloudFbm2(q.xz * 0.28 + vec2(3.1, -1.7)));
    float localCov = clamp(baseCov * (0.25 + 1.15 * weather), 0.0, 1.0);

    // Base Perlin shape + cauliflower Worley billow lobes
    float perlin = noise3(q * 1.1) * 0.65 + noise3(q * 2.3) * 0.35;
    float wBase = worley3(q * 1.65) * 0.68 + worley3(q * 3.55) * 0.32;
    float shape = mix(perlin, wBase, 0.54);

    // Vertical cumulus shaping: flat condensation base, rounded billowy cauliflower top
    float hProfile = smoothstep(0.0, 0.18, hFrac) * smoothstep(1.0, 0.36, hFrac);
    float dens = smoothstep(1.0 - localCov, 1.0 - localCov + 0.24, shape) * hProfile;
    if (dens <= 0.0) return 0.0;

    // High-frequency wisp erosion on outer fringes
    float erode = worley3(q * 4.8 + vec3(1.9, 4.3, 0.7));
    return clamp(dens * 1.35 - (1.0 - erode) * 0.14 * (1.0 - dens), 0.0, 1.0);
  }

  float intersectSkySphere(vec3 d, float R_earth, float R_shell) {
    float b = R_earth * d.y;
    float c = R_shell * R_shell - R_earth * R_earth;
    return -b + sqrt(max(b * b + c, 0.0001));
  }

  float hgPhase(float cosTheta, float g) {
    float g2 = g * g;
    float denom = max(1.0 + g2 - 2.0 * g * cosTheta, 0.001);
    return (1.0 - g2) / (4.0 * 3.14159265 * pow(denom, 1.5));
  }

  void main() {
    vec3 d = normalize(vDir);
    vec3 sunDir = normalize(uSunDir);
    vec3 moonDir = normalize(uMoonDir);
    float up = clamp(d.y, 0.0, 1.0);
    float sunDot = clamp(dot(d, sunDir), 0.0001, 1.0);
    float moonDot = clamp(dot(d, moonDir), 0.0001, 1.0);

    // ══════════ 1. DEEP SPACE NIGHT SKY + MILKY WAY + NEBULAE ══════════
    vec3 nightZenith = vec3(0.005, 0.010, 0.024);
    vec3 nightMid = vec3(0.012, 0.026, 0.056);
    vec3 nightHorizon = vec3(0.024, 0.052, 0.095);
    vec3 nightSky = mix(nightHorizon, nightMid, smoothstep(0.0, 0.28, up));
    nightSky = mix(nightSky, nightZenith, smoothstep(0.24, 0.85, up));

    // Nuanced Milky Way dust lane & deep-space sapphire/indigo/teal nebula
    float band = exp(-abs(d.y * 0.62 + d.x * 0.50 - 0.18) * 4.5);
    float neb1 = spaceFbm(d * 3.4 + vec3(uTime * 0.0015, 0.0, 0.0));
    float neb2 = spaceFbm(d * 7.2 - vec3(0.0, uTime * 0.002, 0.0));
    vec3 nebColor = mix(vec3(0.04, 0.11, 0.28), vec3(0.05, 0.24, 0.26), neb2);
    nightSky += nebColor * band * smoothstep(0.40, 0.84, neb1) * 0.56;

    // Subtle atmospheric lunar Mie glow
    nightSky += vec3(0.22, 0.36, 0.56) * pow(moonDot, 14.0) * 0.22;
    nightSky += vec3(0.70, 0.84, 1.0) * pow(moonDot, 120.0) * 0.26;

    // ══════════ 2. RICH MEDITERRANEAN AZURE DAY SKY (RAYLEIGH + MIE) ══════════
    vec3 dayZenith = vec3(0.035, 0.20, 0.62);
    vec3 dayMid = vec3(0.14, 0.45, 0.86);
    vec3 dayHorizon = vec3(0.52, 0.76, 0.94);
    vec3 daySky = mix(dayHorizon, dayMid, smoothstep(0.0, 0.26, up));
    daySky = mix(daySky, dayZenith, smoothstep(0.24, 0.86, up));

    // Warm golden solar aureole glow
    daySky += vec3(1.0, 0.88, 0.66) * pow(sunDot, 10.0) * 0.26;
    daySky += vec3(1.0, 0.96, 0.85) * pow(sunDot, 140.0) * 0.75;

    // Smooth Golden-Hour Twilight blend around uDayFactor = 0.5
    float twilight = sin(uDayFactor * 3.14159265);
    vec3 duskHorizon = vec3(0.86, 0.42, 0.22);
    vec3 duskMid = vec3(0.16, 0.22, 0.46);
    vec3 duskSky = mix(duskHorizon, duskMid, smoothstep(0.0, 0.42, up));

    vec3 skyCol = mix(nightSky, daySky, smoothstep(0.0, 1.0, uDayFactor));
    skyCol = mix(skyCol, duskSky + vec3(1.0, 0.55, 0.26) * pow(sunDot, 6.0) * 0.42, twilight * 0.52);

    // ══════════ 3. TRUE 3D VOLUMETRIC PERLIN-WORLEY RAY-MARCHED CLOUDS ══════════
    if (d.y > 0.008) {
      float R_E = 56.0;
      float R_1 = R_E + 2.6;
      float R_2 = R_E + 5.6;

      float t0 = intersectSkySphere(d, R_E, R_1);
      float t1 = intersectSkySphere(d, R_E, R_2);
      float marchLen = max(0.1, t1 - t0);
      int steps = max(4, uCloudSteps);
      float stepSize = marchLen / float(steps);

      // Per-pixel jitter eliminates slicing/layer banding completely!
      float jitter = hash12(gl_FragCoord.xy + fract(uTime) * 37.0);
      float baseCov = mix(0.36, 0.58, uDayFactor);

      vec3 lightDir = normalize(mix(moonDir, sunDir, smoothstep(0.25, 0.75, uDayFactor)));
      float cosTheta = dot(d, lightDir);
      float phase = mix(hgPhase(cosTheta, 0.65), hgPhase(cosTheta, -0.25), 0.28) * 3.8 + 0.35;

      vec3 nightLit = vec3(0.24, 0.38, 0.55);
      vec3 nightAmb = vec3(0.025, 0.05, 0.095);
      vec3 dayLit = vec3(0.92, 0.90, 0.87);
      vec3 dayAmb = vec3(0.32, 0.45, 0.65);
      vec3 duskLit = vec3(0.96, 0.64, 0.40);

      vec3 cLit = mix(nightLit, dayLit, uDayFactor);
      cLit = mix(cLit, duskLit, twilight * 0.62);
      vec3 cAmb = mix(nightAmb, dayAmb, uDayFactor);
      cAmb = mix(cAmb, vec3(0.34, 0.24, 0.36), twilight * 0.45);

      float transmittance = 1.0;
      vec3 accumLight = vec3(0.0);

      for (int i = 0; i < 20; i++) {
        if (i >= steps) break;
        float tCur = t0 + (float(i) + jitter) * stepSize;
        vec3 pos = vec3(0.0, R_E, 0.0) + d * tCur;
        float hFrac = clamp((length(pos) - R_1) / (R_2 - R_1), 0.0, 1.0);

        float dens = sampleCloud3D(pos, hFrac, baseCov);
        if (dens > 0.01) {
          // 3-step directional light optical-depth march toward Sun/Moon for real 3D self-shadowing!
          float lightOD = 0.0;
          for (int j = 1; j <= 3; j++) {
            vec3 lPos = pos + lightDir * (float(j) * 0.52);
            float lh = clamp((length(lPos) - R_1) / (R_2 - R_1), 0.0, 1.0);
            lightOD += sampleCloud3D(lPos, lh, baseCov) * 0.52;
          }
          float beer = exp(-lightOD * 3.1);
          float powder = 1.0 - exp(-dens * 4.2);
          float lightEnergy = beer * (0.55 + 0.85 * powder) * phase;

          vec3 stepCol = cAmb * (0.55 + 0.45 * hFrac) + cLit * lightEnergy * 0.85;
          float stepExt = dens * stepSize * 0.86;
          float stepT = exp(-stepExt);
          accumLight += transmittance * stepCol * (1.0 - stepT);
          transmittance *= stepT;
          if (transmittance < 0.03) break;
        }
      }

      // Soft aerial perspective blend at distant horizon (clamped below 0.96 bloom threshold!)
      float horizonFade = smoothstep(0.012, 0.10, d.y);
      float cloudAlpha = (1.0 - transmittance) * horizonFade * mix(0.65, 0.96, uDayFactor);
      vec3 cloudCol = min(accumLight / max(1.0 - transmittance, 0.001), vec3(0.93));
      skyCol = mix(skyCol, cloudCol, cloudAlpha);
    }

    // ══════════ 4. INFINITE VOLUMETRIC SEA OF CLOUDS BELOW THE LAB ══════════
    if (d.y < 0.025) {
      float downMask = smoothstep(0.025, -0.14, d.y);
      vec2 seaUv = (d.xz / max(-d.y + 0.16, 0.16)) * 0.65 + vec2(uTime * 0.012, -uTime * 0.005);
      float s1 = cloudFbm2(seaUv);
      float s2 = cloudFbm2(seaUv * 2.3 + vec2(3.1, 1.4));
      float billow = smoothstep(0.18, 0.82, s1 * 0.72 + s2 * 0.32);

      // Directional crest highlight across sea-of-clouds
      float crest = clamp(s1 - cloudFbm2(seaUv + uSunDir.xz * 0.08), -0.3, 0.3) * 1.5 + 0.5;

      vec3 seaNightDeep = vec3(0.012, 0.024, 0.044);
      vec3 seaNightCrest = vec3(0.075, 0.145, 0.22);
      vec3 seaDayDeep = vec3(0.42, 0.58, 0.78);
      vec3 seaDayCrest = vec3(0.95, 0.97, 1.0);

      vec3 seaCol = mix(
        mix(seaNightDeep, seaNightCrest, billow * (0.65 + 0.35 * crest)),
        mix(seaDayDeep, seaDayCrest, billow * (0.65 + 0.35 * crest)),
        uDayFactor
      );
      seaCol = mix(seaCol, vec3(0.76, 0.46, 0.34), twilight * 0.35 * billow);
      skyCol = mix(skyCol, seaCol, downMask * 0.94);
    }

    gl_FragColor = vec4(max(skyCol, vec3(0.0)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const moonVertexShader = /* glsl */ `
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

export const moonFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform sampler2D uBumpMap;
  uniform vec3 uSunLightDir;
  uniform float uDayFactor;

  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vViewDir;

  void main() {
    vec3 albedo = texture2D(uMap, vUv).rgb;
    float hC = texture2D(uBumpMap, vUv).r;
    float hR = texture2D(uBumpMap, vUv + vec2(0.002, 0.0)).r;
    float hU = texture2D(uBumpMap, vUv + vec2(0.0, 0.004)).r;

    vec3 N = normalize(vNormalW);
    vec3 tangentApprox = normalize(cross(vec3(0.0, 1.0, 0.0), N));
    vec3 bitanApprox = cross(N, tangentApprox);
    N = normalize(N + tangentApprox * (hC - hR) * 1.25 + bitanApprox * (hC - hU) * 1.25);

    vec3 L = normalize(uSunLightDir);
    vec3 V = normalize(vViewDir);
    float diff = smoothstep(-0.08, 0.35, dot(N, L)) * (0.28 + 0.72 * max(dot(N, L), 0.0));
    float fresnel = pow(max(1.0 - max(dot(N, V), 0.0), 0.0001), 3.0);

    // Crisp sunlit lunar surface + subtle cool earthshine on the shadow side
    vec3 lit = albedo * (vec3(0.95, 0.98, 1.05) * diff * 1.35 + vec3(0.04, 0.08, 0.14));
    lit += vec3(0.45, 0.65, 0.88) * fresnel * 0.14 * diff;

    float alpha = clamp(1.0 - smoothstep(0.75, 0.96, uDayFactor), 0.0, 1.0);
    gl_FragColor = vec4(max(lit, vec3(0.0)), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const sunCoronaVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const sunCoronaFragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    float r = length(p);
    if (r > 1.0) discard;

    float disc = smoothstep(0.18, 0.12, r);
    float innerGlow = exp(-r * 7.2) * 0.85;
    float outerCorona = exp(-r * 3.1) * 0.34 * smoothstep(1.0, 0.45, r);
    float energy = disc * 1.8 + innerGlow + outerCorona;

    vec3 col = mix(vec3(1.0, 0.76, 0.38), vec3(1.0, 0.97, 0.88), clamp(disc + innerGlow * 0.5, 0.0, 1.0));
    float alpha = clamp(energy * smoothstep(1.0, 0.65, r) * uOpacity, 0.0, 1.0);

    gl_FragColor = vec4(max(col * (1.0 + disc * 0.8), vec3(0.0)), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export const parallaxCloudVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const parallaxCloudFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uDayFactor;
  uniform float uSeed;

  varying vec2 vUv;

  float hash12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash12(i), hash12(i + vec2(1.0, 0.0)), f.x),
      mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise2(p);
      p = p * 2.04 + vec2(4.3, 7.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 p = vUv * 2.0 - 1.0;
    // Asymmetric cumulus silhouette envelope (flatter base, taller rounded dome)
    vec2 q = vec2(p.x * 1.05, (p.y + 0.15) * (p.y < -0.15 ? 1.85 : 1.15));
    float radial = length(q);
    float mask = smoothstep(0.95, 0.25, radial);
    if (mask <= 0.005) discard;

    vec2 uvFlow = vUv * 4.2 + vec2(uSeed * 7.3 + uTime * 0.025, uSeed * 3.1);
    float n = fbm(uvFlow);
    float billow = 1.0 - abs(fbm(uvFlow * 1.85 + vec2(2.7, -1.9)) * 2.0 - 1.0);
    float puffField = mix(n, billow, 0.42);
    float dens = smoothstep(0.28, 0.72, puffField * mask + mask * 0.25) * mask;
    if (dens <= 0.01) discard;

    // Soft top-lit cloud shading matching sky lighting (strictly below 0.96 bloom threshold!)
    float topShade = smoothstep(-0.35, 0.65, p.y + (puffField - 0.5) * 0.35);
    float twilight = sin(uDayFactor * 3.14159265);

    vec3 nightBase = vec3(0.025, 0.05, 0.095);
    vec3 nightTop = vec3(0.18, 0.28, 0.42);
    vec3 dayBase = vec3(0.45, 0.58, 0.76);
    vec3 dayTop = vec3(0.91, 0.90, 0.88);

    vec3 lit = mix(mix(nightBase, nightTop, topShade), mix(dayBase, dayTop, topShade), uDayFactor);
    lit = mix(lit, vec3(0.92, 0.60, 0.40), twilight * 0.42 * topShade);

    float alpha = dens * mix(0.24, 0.62, uDayFactor);
    gl_FragColor = vec4(min(max(lit, vec3(0.0)), vec3(0.93)), clamp(alpha, 0.0, 0.80));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
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
