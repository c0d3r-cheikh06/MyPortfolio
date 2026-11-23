import * as THREE from "three";

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

    // Subtle lifelike chest breathing below collarbones (y < -0.16)
    float chestMask = smoothstep(-0.14, -0.36, pos.y);
    float breath = sin(uTime * 1.35) * 0.002 * chestMask;
    pos.z += breath;
    pos.y += breath * 0.25;

    // Very restrained holographic phase glitch (never distorts face readability)
    float band = floor(pos.y * 46.0 + uTime * 3.0);
    float burst = step(0.994, hash11(band + floor(uTime * 5.0) * 19.0));
    float glitchAmt = (0.0018 * burst + 0.0035 * uGlitch) * (1.0 - 0.7 * uHover);
    pos.x += (hash11(band * 1.37 + uTime) - 0.5) * 2.0 * glitchAmt;

    // Subtle energy ripple right along the active laser fabrication front
    float frontDist = abs(pos.y - uRevealY);
    float frontPulse = exp(-frontDist * 95.0) * step(uRevealY, 0.17);
    pos += normal * frontPulse * 0.0018;

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

  void main() {
    // Progressive vertical laser fabrication plane (from bust bottom -0.54 up to crown +0.18)
    float cutDist = uRevealY - vLocalPos.y;
    if (cutDist < -0.012 || uPartAlpha <= 0.001) discard;

    vec3 N = normalize(vNormalW);
    vec3 V = normalize(vViewDir);
    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    float fresnel = pow(1.0 - ndotv, 2.55);
    float rimSoft = pow(1.0 - ndotv, 1.45);

    // Cinematic studio 3-point portrait lighting (preserves authentic dark brown skin depth & facial planes)
    vec3 keyDir = normalize(vec3(0.42, 0.58, 0.92));
    vec3 fillDir = normalize(vec3(-0.78, 0.22, 0.56));
    vec3 rimDir = normalize(vec3(-0.15, 0.52, -0.88));

    float keyDiff = clamp(dot(N, keyDir), 0.0, 1.0);
    float fillDiff = clamp(dot(N, fillDir), 0.0, 1.0);
    float rimDiff = pow(clamp(dot(N, rimDir), 0.0, 1.0), 2.2);

    vec3 H = normalize(keyDir + V);
    float specExp = uPartId == 1.0 ? 110.0 : (uPartId == 5.0 ? 72.0 : (uPartId == 0.0 ? 28.0 : 14.0));
    float spec = pow(clamp(dot(N, H), 0.0, 1.0), specExp);

    // Baked linear albedo + mesh AO + surface curvature
    vec3 albedo = vVertColor.rgb;
    float ao = clamp(vVertColor.a, 0.24, 1.0);
    float curv = abs(vDetailCurv.y - 0.5) * 2.0;

    // Realistic portrait shading
    vec3 keyLight = vec3(1.0, 0.96, 0.92) * keyDiff * 1.12;
    vec3 fillLight = vec3(0.62, 0.78, 0.94) * fillDiff * 0.42;
    vec3 ambLight = vec3(0.24, 0.27, 0.30);
    vec3 litPortrait = albedo * (ambLight + keyLight + fillLight) * ao;

    // Subtle specular sheen: natural skin radiance, glossy dark eyes, brushed metal zipper
    float specWeight = uPartId == 1.0 ? 0.75 : (uPartId == 5.0 ? 0.65 : (uPartId == 0.0 ? 0.14 : 0.06));
    litPortrait += vec3(0.92, 0.98, 0.96) * spec * specWeight;

    // Signature CHEIKH.EXE mint-green + cool-white holographic spectrum
    vec3 mint = vec3(0.306, 0.949, 0.722);     // #4EF2B8
    vec3 iceWhite = vec3(0.91, 0.98, 0.99);
    vec3 deepTeal = vec3(0.06, 0.24, 0.22);

    // Crisp horizontal micro-scanlines & subtle holographic energy lattice
    float scanFine = 0.5 + 0.5 * sin(vLocalPos.y * 360.0 - uTime * 5.2);
    float scanBand = exp(-abs(vLocalPos.y - uScanY) * 75.0) * uScanStrength;
    float buildEdge = exp(-abs(cutDist) * 115.0) * smoothstep(0.21, 0.14, uRevealY);

    // Early-phase translucent blue-mint volumetric projection shell
    float luma = dot(litPortrait, vec3(0.299, 0.587, 0.114));
    vec3 holoShell = mix(deepTeal, mint, clamp(luma * 2.2 + fresnel * 0.95, 0.0, 1.0));
    holoShell += iceWhite * (curv * 0.25 + pow(fresnel, 3.0) * 0.45);

    // Final stabilized studio hologram: unmistakable realistic Cheikh portrait + refined mint Fresnel rim & micro-scanlines
    vec3 color = mix(holoShell, litPortrait * 1.15, uSolidMix * 0.88);

    // Controlled Fresnel rim lighting & subtle holographic contour accent (boosted smoothly on hover)
    float rimIntensity = 0.52 + uHover * 0.58;
    color += mint * (fresnel * 0.68 * rimIntensity + rimSoft * 0.07);
    color += iceWhite * (pow(fresnel, 3.8) * (0.34 + uHover * 0.48) + rimDiff * 0.18);
    color += mint * curv * (0.06 + uHover * 0.24);

    // Very fine scanline texture (subtler on eyes & skin so human likeness shines crystal clear)
    float scanDepth = (uPartId == 0.0 || uPartId == 1.0) ? 0.055 : 0.11;
    color *= (1.0 - scanDepth + scanDepth * (0.68 + 0.32 * scanFine));

    // Focused laser intersection glow right where the scanning lasers touch the surface
    color += mix(mint, iceWhite, 0.65) * (scanBand * 1.35 + buildEdge * 1.9);

    // Keep clarity crisp in Day mode too
    color *= mix(1.0, 1.08, uDayFactor);

    // Alpha: razor-clean reveal transition, crisp solid presence when stabilized
    float edgeFade = smoothstep(-0.012, 0.018, cutDist);
    float baseAlpha = mix(0.28 + fresnel * 0.58, 0.96, uSolidMix);
    if (uPartId == 1.0) baseAlpha = mix(0.45, 1.0, uSolidMix);
    float alpha = clamp((baseAlpha + scanBand * 0.35 + buildEdge * 0.5) * edgeFade * uPartAlpha, 0.0, 1.0);

    gl_FragColor = vec4(color, alpha);
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
      uRevealY: { value: -0.56 },
      uPartAlpha: { value: 0 },
      uSolidMix: { value: 0 },
      uScanY: { value: -0.56 },
      uScanStrength: { value: 0 },
      uHover: { value: 0 },
      uDayFactor: { value: 0 },
      uGlitch: { value: 0 },
      uPartId: { value: partId },
    },
  });
}
