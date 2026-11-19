import * as THREE from "three";

export interface HologramUniforms {
  [uniform: string]: THREE.IUniform<unknown>;
  uTime: THREE.IUniform<number>;
  uRevealY: THREE.IUniform<number>;
  uPartAlpha: THREE.IUniform<number>;
  uSolidMix: THREE.IUniform<number>;
  uScanY: THREE.IUniform<number>;
  uScanStrength: THREE.IUniform<number>;
  uHover: THREE.IUniform<number>;
  uDayFactor: THREE.IUniform<number>;
  uGlitch: THREE.IUniform<number>;
  uPartId: THREE.IUniform<number>;
}

export const hologramVertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uRevealY;
  uniform float uGlitch;
  uniform float uHover;

  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec4 vVertColor;
  varying vec2 vDetailCurv;

  float hash11(float p) {
    p = fract(p * 0.1031);
    p *= p + 33.33;
    p *= p + p;
    return fract(p);
  }

  void main() {
    vLocalPos = position;
    vVertColor = color;
    vDetailCurv = uv;

    vec3 pos = position;

    // Subtle organic breathing on torso/shoulders (below neck y < -0.15)
    float chestMask = smoothstep(-0.14, -0.38, pos.y);
    float breath = sin(uTime * 1.45) * 0.0022 * chestMask;
    pos.z += breath;
    pos.y += breath * 0.35;

    // Subtle controlled holographic horizontal scanline jitter
    float band = floor(pos.y * 42.0 + uTime * 3.5);
    float burst = step(0.988, hash11(band + floor(uTime * 6.0) * 17.0));
    float glitchAmt = (0.0038 * burst + 0.006 * uGlitch) * (1.0 - 0.5 * uHover);
    pos.x += (hash11(band * 1.37 + uTime) - 0.5) * 2.0 * glitchAmt;

    // Micro expansion right at the active laser fabrication front
    float frontDist = abs(pos.y - uRevealY);
    float frontPulse = exp(-frontDist * 75.0) * step(uRevealY, 0.24);
    pos += normal * frontPulse * 0.0028;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPos = worldPos.xyz;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vViewDir = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const hologramFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uRevealY;
  uniform float uPartAlpha;
  uniform float uSolidMix;
  uniform float uScanY;
  uniform float uScanStrength;
  uniform float uHover;
  uniform float uDayFactor;
  uniform float uPartId; // 0=skin, 1=eyes, 2=hair, 3=tshirt, 4=jacket, 5=zipper

  varying vec3 vLocalPos;
  varying vec3 vWorldPos;
  varying vec3 vNormalW;
  varying vec3 vViewDir;
  varying vec4 vVertColor;
  varying vec2 vDetailCurv;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  void main() {
    // Progressive vertical laser fabrication clip with razor-sharp ionized edge
    float cutDist = uRevealY - vLocalPos.y;
    if (cutDist < -0.015 || uPartAlpha <= 0.001) discard;

    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 2.35);
    float softRim = pow(1.0 - ndotv, 1.35);

    // Three-point studio lighting to preserve facial sculpture & dark-skin tonal fidelity
    vec3 keyDir = normalize(vec3(0.45, 0.65, 0.95));
    vec3 fillDir = normalize(vec3(-0.75, 0.25, 0.55));
    vec3 rimDir = normalize(vec3(0.0, 0.45, -0.9));

    float keyDiff = clamp(dot(N, keyDir), 0.0, 1.0);
    float fillDiff = clamp(dot(N, fillDir), 0.0, 1.0);
    float rimDiff = pow(clamp(dot(N, rimDir), 0.0, 1.0), 2.0);
    vec3 halfVec = normalize(keyDir + V);
    float specPower = uPartId == 1.0 ? 96.0 : (uPartId == 5.0 ? 64.0 : (uPartId == 0.0 ? 22.0 : 12.0));
    float spec = pow(clamp(dot(N, halfVec), 0.0, 1.0), specPower);

    // Baked linear albedo & SDF ambient occlusion
    vec3 albedo = vVertColor.rgb;
    float ao = clamp(vVertColor.a, 0.18, 1.0);
    float detail = vDetailCurv.x; // eyebrows & lip emphasis
    float curv = abs(vDetailCurv.y - 0.5) * 2.0; // anatomical ridges

    // Lifelike shaded base (preserves dark brown skin, coily black hair, light grey tee, black jacket)
    vec3 litBase = albedo * (0.28 + keyDiff * 0.98 + fillDiff * 0.36) * ao;
    // Skin subtle warm specular, eye wet glint, metal zipper glint
    float specWeight = uPartId == 1.0 ? 0.65 : (uPartId == 5.0 ? 0.55 : (uPartId == 0.0 ? 0.16 : 0.07));
    litBase += vec3(0.88, 0.97, 0.94) * spec * specWeight;

    // Holographic color palette (mint primary + cool white core + deep teal shadow)
    vec3 mint = vec3(0.306, 0.949, 0.722);     // #4EF2B8
    vec3 coolWhite = vec3(0.91, 0.97, 0.99);
    vec3 deepCyan = vec3(0.11, 0.45, 0.40);

    // Fine horizontal holographic scanlines + subtle vertical micro-grid
    float scanFine = 0.5 + 0.5 * sin(vLocalPos.y * 340.0 - uTime * 7.0);
    float scanWide = 0.5 + 0.5 * sin(vLocalPos.y * 62.0 + uTime * 2.1);
    float microGrid = smoothstep(0.93, 1.0, abs(sin(vLocalPos.x * 160.0)) * abs(sin(vLocalPos.y * 160.0)));

    // Active vertical laser scanner sweep band
    float scanLine = exp(-abs(vLocalPos.y - uScanY) * 68.0) * uScanStrength;
    // Leading laser build edge
    float buildEdge = exp(-abs(cutDist) * 105.0) * smoothstep(0.28, 0.18, uRevealY);

    // Pure holographic wireframe/projection look (early build phase)
    float luma = dot(litBase, vec3(0.299, 0.587, 0.114));
    vec3 holoGhost = mix(deepCyan, mint, clamp(luma * 2.4 + fresnel * 0.9, 0.0, 1.0));
    holoGhost += coolWhite * (curv * 0.32 + detail * 0.25 + microGrid * 0.28);

    // Final cinema-grade hybrid hologram: clearly recognizable Cheikh + unmistakable volumetric hologram
    vec3 finalHolo = mix(holoGhost, litBase * 1.18 + deepCyan * 0.08, uSolidMix * 0.80);

    // Fresnel holographic rim + anatomical curvature glow (boosted on hover)
    float rimBoost = 0.68 + uHover * 0.65;
    finalHolo += mint * (fresnel * 0.85 * rimBoost + softRim * 0.14);
    finalHolo += coolWhite * (pow(fresnel, 3.2) * (0.45 + uHover * 0.55) + rimDiff * 0.22);
    finalHolo += mint * (curv * (0.14 + uHover * 0.30) + microGrid * 0.10);

    // Subtle scanline modulation (lighter on eyes/face so portrait remains ultra-legible)
    float faceClarity = (uPartId == 0.0 || uPartId == 1.0) ? 0.08 : 0.15;
    finalHolo *= (1.0 - faceClarity + faceClarity * (0.65 + 0.35 * scanFine) * (0.85 + 0.15 * scanWide));

    // Laser intersection glow (scanner & active fabrication plane)
    finalHolo += mix(mint, coolWhite, 0.6) * (scanLine * 1.45 + buildEdge * 2.4);

    // Keep visibility crisp in bright Day mode too
    finalHolo *= mix(1.0, 1.12, uDayFactor);

    // Opacity: smooth reveal edge, slightly translucent hologram shell that solidifies smoothly
    float edgeFade = smoothstep(-0.015, 0.025, cutDist);
    float baseAlpha = mix(0.32 + fresnel * 0.55, 0.93, uSolidMix);
    if (uPartId == 1.0) baseAlpha = mix(0.45, 0.99, uSolidMix); // crisp eyes
    float flicker = 0.97 + 0.03 * sin(uTime * 29.0 + hash21(vec2(floor(uTime * 12.0), 1.0)) * 6.28);
    float alpha = clamp((baseAlpha + scanLine * 0.35 + buildEdge * 0.5) * edgeFade * uPartAlpha * flicker, 0.0, 1.0);

    gl_FragColor = vec4(finalHolo, alpha);
  }
`;

export function createHologramMaterial(partId: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: hologramVertexShader,
    fragmentShader: hologramFragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: true,
    side: THREE.FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uRevealY: { value: -0.68 },
      uPartAlpha: { value: 0 },
      uSolidMix: { value: 0 },
      uScanY: { value: -0.68 },
      uScanStrength: { value: 0 },
      uHover: { value: 0 },
      uDayFactor: { value: 0 },
      uGlitch: { value: 0 },
      uPartId: { value: partId },
    },
  });
}
