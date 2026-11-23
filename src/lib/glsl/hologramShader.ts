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

    // Subtle lifelike chest breathing below collarbones (y < -0.15)
    float chestMask = smoothstep(-0.14, -0.38, pos.y);
    float breath = sin(uTime * 1.35) * 0.0022 * chestMask;
    pos.z += breath;
    pos.y += breath * 0.25;

    // Restrained holographic phase glitch during early assembly only (zero distortion once stabilized)
    float band = floor(pos.y * 48.0 + uTime * 3.0);
    float burst = step(0.996, hash11(band + floor(uTime * 5.0) * 19.0));
    float glitchAmt = (0.0009 * burst + 0.0032 * uGlitch) * (1.0 - 0.8 * uHover);
    pos.x += (hash11(band * 1.37 + uTime) - 0.5) * 2.0 * glitchAmt;

    // Subtle holographic ripple right along the active laser fabrication plane
    float frontDist = abs(pos.y - uRevealY);
    float frontPulse = exp(-frontDist * 95.0) * step(uRevealY, 0.175);
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
  uniform float uMeshGridStrength;
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

  float hash31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float vnoise3(vec3 p) {
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

  vec3 perturbMicroNormal(vec3 N, vec3 p, float freq, float strength) {
    float eps = 0.0008;
    float n0 = vnoise3(p * freq);
    vec3 grad = vec3(
      vnoise3((p + vec3(eps, 0.0, 0.0)) * freq) - n0,
      vnoise3((p + vec3(0.0, eps, 0.0)) * freq) - n0,
      vnoise3((p + vec3(0.0, 0.0, eps)) * freq) - n0
    ) / eps;
    vec3 surfGrad = grad - N * dot(N, grad);
    return normalize(N - surfGrad * (strength / max(freq, 1.0)));
  }

  float holoMeshLattice(vec3 p) {
    // Cylindrical + vertical holographic wireframe micro-lattice (visible during assembly & rim)
    float ang = (abs(p.x) + abs(p.z) > 0.0001 ? atan(p.x, p.z) : 0.0) * 16.0;
    float yGrid = p.y * 92.0;
    float g1 = abs(fract(ang) - 0.5);
    float g2 = abs(fract(yGrid) - 0.5);
    float diag = abs(fract((ang + yGrid) * 0.5) - 0.5);
    float lines = 1.0 - smoothstep(0.02, 0.075, min(min(g1, g2), diag));
    return lines;
  }

  void main() {
    // Progressive vertical laser fabrication plane (from bust bottom -0.53 up to crown +0.18)
    float cutDist = uRevealY - vLocalPos.y;
    if (cutDist < -0.012 || uPartAlpha <= 0.001) discard;

    vec3 N = normalize(vNormalW);
    if (!gl_FrontFacing) N = -N;

    // 3D Procedural micro-relief normals (pores on skin, tight 4C curl grain on hair)
    if (uPartId == 0.0) {
      float matteMaskN = 1.0 - clamp(vDetailCurv.x, 0.0, 1.0) * 0.85;
      N = perturbMicroNormal(N, vLocalPos, 280.0, 0.045 * matteMaskN);
    } else if (uPartId == 2.0) {
      N = perturbMicroNormal(N, vLocalPos, 440.0, 0.18);
    }

    vec3 V = normalize(vViewDir);
    float ndotv = clamp(dot(N, V), 0.0, 1.0);
    float fresnelBase = max(1.0 - ndotv, 0.0001);
    float fresnelTight = pow(fresnelBase, 4.2);
    float fresnelMid = pow(fresnelBase, 2.0);

    // Camera-aligned 3-Point Photographic Studio Portrait Lighting (consistent 360°!)
    vec3 refUp = abs(V.y) > 0.96 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);
    vec3 rightV = normalize(cross(refUp, V));
    vec3 upV = cross(V, rightV);
    vec3 keyDir = normalize(V * 0.78 + rightV * 0.44 + upV * 0.44);
    vec3 fillDir = normalize(V * 0.60 - rightV * 0.76 + upV * 0.22);
    vec3 rimDir = normalize(-V * 0.80 - rightV * 0.18 + upV * 0.56);

    float keyDot = dot(N, keyDir);
    float fillDiff = clamp(dot(N, fillDir) * 0.5 + 0.5, 0.0, 1.0);
    float rimDiff = pow(clamp(dot(N, rimDir), 0.0001, 1.0), 2.8);

    vec3 albedo = vVertColor.rgb;
    float ao = clamp(vVertColor.a, 0.20, 1.0);
    float curv = abs(vDetailCurv.y - 0.5) * 2.0;

    vec3 litPortrait = vec3(0.0);

    if (uPartId == 0.0) {
      // SKIN: Wrap diffuse + warm dark-brown subsurface scattering + subtle natural matte sheen
      float wrap = 0.34;
      float keyWrap = clamp((keyDot + wrap) / (1.0 + wrap), 0.0, 1.0);
      float sssBand = smoothstep(-0.32, 0.14, keyDot) * (1.0 - smoothstep(0.08, 0.62, keyDot));
      vec3 sssTint = vec3(0.42, 0.13, 0.06) * sssBand * 0.22;

      vec3 keyL = vec3(1.04, 0.96, 0.89) * keyWrap * 1.15;
      vec3 fillL = vec3(0.55, 0.72, 0.92) * fillDiff * 0.40;
      vec3 ambL = vec3(0.18, 0.16, 0.17);
      litPortrait = albedo * (ambL + keyL + fillL) * ao + sssTint * ao;

      vec3 H = normalize(keyDir + V);
      float specBroad = pow(clamp(dot(N, H), 0.0001, 1.0), 20.0) * 0.045;
      float specTight = pow(clamp(dot(N, H), 0.0001, 1.0), 58.0) * 0.055;
      float matteMask = 1.0 - clamp(vDetailCurv.x, 0.0, 1.0) * 0.82;
      litPortrait += vec3(1.0, 0.94, 0.88) * (specBroad + specTight) * matteMask * ao;
    } else if (uPartId == 1.0) {
      // EYES: Grounded sclera + deep dark iris + crisp corneal catchlights restricted by iris mask
      float keyDiff = clamp(keyDot, 0.0, 1.0);
      litPortrait = albedo * (vec3(0.22, 0.24, 0.26) + vec3(1.0, 0.98, 0.95) * keyDiff * 0.88 + vec3(0.65, 0.8, 0.95) * fillDiff * 0.28);
      vec3 H1 = normalize(keyDir + V);
      vec3 H2 = normalize(fillDir + V);
      float irisMask = clamp(vDetailCurv.x, 0.0, 1.0);
      float catch1 = pow(clamp(dot(N, H1), 0.0001, 1.0), 240.0) * 1.35 * irisMask;
      float catch2 = pow(clamp(dot(N, H2), 0.0001, 1.0), 190.0) * 0.55 * irisMask;
      litPortrait += vec3(0.96, 0.99, 1.0) * (catch1 + catch2);
    } else if (uPartId == 2.0) {
      // HAIR: Rich deep black coily volume with dense curl micro-relief & valley AO
      float keyDiff = clamp(keyDot * 0.65 + 0.35, 0.0, 1.0);
      litPortrait = albedo * (vec3(0.16, 0.17, 0.19) + vec3(1.0, 0.97, 0.93) * keyDiff * 1.12 + vec3(0.55, 0.72, 0.88) * fillDiff * 0.32) * ao;
      vec3 H = normalize(keyDir + V);
      float curlSheen = pow(clamp(dot(N, H), 0.0001, 1.0), 24.0) * 0.068 * vDetailCurv.x * ao;
      litPortrait += vec3(0.88, 0.93, 0.96) * curlSheen;
    } else {
      // GARMENTS & ZIPPER: Tailored matte black jacket, deep heather tee, brushed metal zipper
      float keyDiff = clamp(keyDot * 0.7 + 0.3, 0.0, 1.0);
      litPortrait = albedo * (vec3(0.22, 0.24, 0.27) + vec3(1.0, 0.98, 0.95) * keyDiff * 1.06 + vec3(0.58, 0.75, 0.90) * fillDiff * 0.34) * ao;
      vec3 H = normalize(keyDir + V);
      float expP = uPartId == 5.0 ? 86.0 : (uPartId == 4.0 ? 18.0 : 10.0);
      float wP = uPartId == 5.0 ? 0.72 : (uPartId == 4.0 ? 0.10 : 0.04);
      litPortrait += vec3(0.94, 0.98, 1.0) * pow(clamp(dot(N, H), 0.0001, 1.0), expP) * wP;
    }

    // CHEIKH.EXE Signature Mint + Chromatic Cyan Optical Hologram Spectrum
    vec3 mint = vec3(0.231, 0.957, 0.722); // #3BF4B8
    vec3 cyan = vec3(0.220, 0.741, 0.973); // #38BDF8
    vec3 iceWhite = vec3(0.90, 0.98, 1.0);
    vec3 deepTeal = vec3(0.03, 0.16, 0.15);

    // Holographic wireframe lattice & micro-scanlines
    float lattice = holoMeshLattice(vLocalPos);
    float scanFine = 0.5 + 0.5 * sin(vLocalPos.y * 390.0 - uTime * 4.5);
    float scanBand = exp(-abs(vLocalPos.y - uScanY) * 80.0) * uScanStrength;
    float buildEdge = exp(-abs(cutDist) * 125.0) * smoothstep(0.21, 0.145, uRevealY);

    // Graceful periodic ~9s upward holographic refresh wave (silk optical sheen on jacket, ultra-subtle on face)
    float cyclePos = fract(uTime / 9.0) * 0.92 - 0.56;
    float refreshPulse = exp(-abs(vLocalPos.y - cyclePos) * 42.0) * smoothstep(0.4, 0.95, uSolidMix);
    float refreshWeight = (uPartId >= 3.0) ? 0.24 : 0.08;

    // Translucent early-assembly holographic shell
    float luma = dot(litPortrait, vec3(0.299, 0.587, 0.114));
    vec3 holoShell = mix(deepTeal, mint, clamp(luma * 2.1 + fresnelMid * 0.95, 0.0, 1.0));
    holoShell += mint * lattice * 0.48;
    holoShell += iceWhite * (curv * 0.24 + pow(fresnelMid, 2.8) * 0.45);

    // Final stabilized portrait keeps true human colors pure (0% muddy shell wash!)
    vec3 color = mix(holoShell, litPortrait * 1.06, uSolidMix);

    // Visible holographic lattice during assembly/stabilization; ZERO on face/hair/skin once locked!
    float latticeWeight = (uPartId == 0.0 || uPartId == 1.0 || uPartId == 2.0)
      ? uMeshGridStrength * (1.0 - uSolidMix)
      : uMeshGridStrength * (1.0 - uSolidMix * 0.98);
    color += mint * lattice * latticeWeight * (0.36 + fresnelMid * 0.45);
    color += mix(mint, cyan, 0.4) * (0.45 + 0.18 * lattice) * refreshPulse * refreshWeight;

    // Dual-spectrum chromatic edge Fresnel rim (mint + subtle cyan dispersion on outer silhouette)
    float centerSuppress = mix(0.14, 1.0, 1.0 - smoothstep(0.28, 0.75, ndotv));
    float partRimScale = (uPartId == 1.0) ? 0.12 : (uPartId == 2.0 ? 0.34 : (uPartId == 0.0 ? 0.48 : 0.56));
    float hoverBoost = 1.0 + uHover * 0.65;
    vec3 rimSpec = mix(mint, cyan, clamp(fresnelMid * 0.85, 0.0, 0.65));
    color += rimSpec * fresnelTight * 0.58 * centerSuppress * partRimScale * hoverBoost;
    color += iceWhite * (pow(fresnelTight, 2.0) * 0.26 + rimDiff * 0.05) * partRimScale * hoverBoost;

    // Subtle micro-scanlines (almost invisible on eyes/skin so facial detail reads cleanly)
    float scanDepth = (uPartId == 1.0) ? 0.012 : (uPartId == 0.0 ? 0.025 : 0.065);
    color *= (1.0 - scanDepth + scanDepth * (0.65 + 0.35 * scanFine));

    // Focused laser intersection glow on active scan plane
    color += mix(mint, iceWhite, 0.68) * (scanBand * 1.15 + buildEdge * 1.85);

    // Extended graceful bottom holographic projection fade (-0.525 -> -0.39) with rising light filaments
    float bottomFade = smoothstep(-0.525, -0.390, vLocalPos.y);
    float filament = pow(clamp(0.5 + 0.5 * sin(vLocalPos.x * 115.0 + vLocalPos.z * 82.0 + uTime * 3.4), 0.0001, 1.0), 3.0);
    float bottomRim = (1.0 - bottomFade) * step(-0.525, vLocalPos.y);
    color += mix(mint, cyan, 0.35) * bottomRim * (0.38 + 0.55 * filament);

    // Daylight readability lift
    color *= mix(1.0, 1.08, uDayFactor);

    // Alpha: crisp reveal, solid human presence when stabilized, graceful bottom dissolve
    float edgeFade = smoothstep(-0.012, 0.018, cutDist);
    float baseAlpha = mix(0.34 + fresnelMid * 0.54, 0.99, uSolidMix);
    if (uPartId == 1.0) baseAlpha = mix(0.55, 1.0, uSolidMix);
    float alpha = clamp((baseAlpha + scanBand * 0.3 + buildEdge * 0.45) * edgeFade * bottomFade * uPartAlpha, 0.0, 1.0);

    gl_FragColor = vec4(max(color, vec3(0.0)), alpha);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export function createHologramMaterial(partId: number): THREE.ShaderMaterial {
  const needsDoubleSide = partId === 3 || partId === 4;
  return new THREE.ShaderMaterial({
    vertexShader: hologramVertexShader,
    fragmentShader: hologramFragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: true,
    side: needsDoubleSide ? THREE.DoubleSide : THREE.FrontSide,
    uniforms: {
      uTime: { value: 0 },
      uRevealY: { value: -0.56 },
      uPartAlpha: { value: 0 },
      uSolidMix: { value: 0 },
      uMeshGridStrength: { value: 0 },
      uScanY: { value: -0.56 },
      uScanStrength: { value: 0 },
      uHover: { value: 0 },
      uDayFactor: { value: 0 },
      uGlitch: { value: 0 },
      uPartId: { value: partId },
    },
  });
}
