/**
 * Custom GLSL shaders for the Swimming Universe (Part 9):
 *  1. Rippling reflective water surface with procedural multi-wave normals,
 *     Fresnel reflections, chromatic depth tint, and specular glints.
 *  2. Animated underwater pool tiles with refractive Voronoi-like aquatic caustics.
 */

export const waterSurfaceVertexShader = /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 p = position;
    float w1 = sin(p.x * 4.2 + uTime * 1.9) * cos(p.z * 3.6 - uTime * 1.4) * 0.022;
    float w2 = sin((p.x + p.z) * 6.8 - uTime * 2.5) * 0.011;
    float w3 = cos(p.x * 11.0 - p.z * 9.5 + uTime * 3.1) * 0.005;
    p.y += w1 + w2 + w3;
    vWave = w1 + w2 + w3;

    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

export const waterSurfaceFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uDayFactor;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWave;

  float causticPattern(vec2 p, float t) {
    vec2 i = p;
    float c = 0.0;
    for (int n = 0; n < 3; n++) {
      float fn = float(n + 1);
      i = p + vec2(
        cos(t * 0.9 * fn - i.x * 1.4) + sin(t * 0.7 + i.y * 1.6),
        sin(t * 0.8 * fn - i.y * 1.5) + cos(t * 0.6 + i.x * 1.3)
      );
      c += 1.0 / max(length(vec2(p.x / (sin(i.x + t) * 0.35 + 0.9), p.y / (cos(i.y + t) * 0.35 + 0.9))), 0.15);
    }
    return clamp(pow(c * 0.14, 2.2), 0.0, 1.0);
  }

  void main() {
    // Analytic surface normal perturbation
    float nx = cos(vWorldPos.x * 4.2 + uTime * 1.9) * 0.14 + cos((vWorldPos.x + vWorldPos.z) * 6.8 - uTime * 2.5) * 0.09;
    float nz = -sin(vWorldPos.z * 3.6 - uTime * 1.4) * 0.14 + cos((vWorldPos.x + vWorldPos.z) * 6.8 - uTime * 2.5) * 0.09;
    vec3 N = normalize(vec3(-nx, 1.0, -nz));
    vec3 V = normalize(cameraPosition - vWorldPos);

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.2);
    vec3 lightDir = normalize(mix(vec3(0.3, 0.85, 0.4), vec3(0.6, 0.9, -0.3), uDayFactor));
    vec3 H = normalize(lightDir + V);
    float spec = pow(max(dot(N, H), 0.0), 92.0);

    vec3 deepWater = mix(vec3(0.02, 0.22, 0.36), vec3(0.04, 0.42, 0.62), uDayFactor);
    vec3 shallowGlow = mix(vec3(0.10, 0.68, 0.82), vec3(0.24, 0.82, 0.94), uDayFactor);
    vec3 skyReflect = mix(vec3(0.18, 0.46, 0.64), vec3(0.74, 0.89, 0.98), uDayFactor);

    float caust = causticPattern(vUv * 6.5, uTime * 0.75);
    vec3 col = mix(deepWater, shallowGlow, 0.35 + caust * 0.45);
    col = mix(col, skyReflect, fresnel * 0.65);
    col += vec3(0.85, 0.98, 1.0) * (spec * 1.15 + caust * 0.22);

    // Edge rim subtle shimmer
    vec2 edge = min(vUv, 1.0 - vUv);
    float edgeMask = 1.0 - smoothstep(0.0, 0.055, min(edge.x, edge.y));
    col += vec3(0.35, 0.88, 0.98) * edgeMask * 0.35;

    float alpha = mix(0.64, 0.86, fresnel);
    gl_FragColor = vec4(col, alpha);
  }
`;

export const poolFloorVertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const poolFloorFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uDayFactor;
  varying vec2 vUv;

  float hash21(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  float voronoiCaustics(vec2 uv, float t) {
    vec2 g = floor(uv);
    vec2 f = fract(uv);
    float minD = 1.0;
    float secondD = 1.0;
    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 lattice = vec2(float(x), float(y));
        float h = hash21(g + lattice);
        vec2 o = 0.5 + 0.42 * sin(t + 6.2831 * vec2(h, fract(h * 17.3)));
        float d = length(lattice + o - f);
        if (d < minD) {
          secondD = minD;
          minD = d;
        } else if (d < secondD) {
          secondD = d;
        }
      }
    }
    return smoothstep(0.14, 0.0, secondD - minD);
  }

  void main() {
    // Architectural mosaic tiles
    vec2 tiles = fract(vUv * vec2(24.0, 14.0));
    float grout = smoothstep(0.04, 0.07, tiles.x) * smoothstep(0.04, 0.07, tiles.y);
    vec3 tileCol = mix(vec3(0.04, 0.14, 0.24), vec3(0.07, 0.27, 0.42), grout);

    // Olympic swimming lane black guide lines
    float lane1 = smoothstep(0.018, 0.010, abs(vUv.y - 0.30)) * step(0.10, vUv.x) * step(vUv.x, 0.90);
    float lane2 = smoothstep(0.018, 0.010, abs(vUv.y - 0.70)) * step(0.10, vUv.x) * step(vUv.x, 0.90);
    tileCol = mix(tileCol, vec3(0.02, 0.06, 0.10), max(lane1, lane2) * 0.75);

    // Dual-layer animated caustics
    float c1 = voronoiCaustics(vUv * vec2(9.0, 5.5) + vec2(uTime * 0.15, 0.0), uTime * 1.4);
    float c2 = voronoiCaustics(vUv * vec2(14.0, 8.5) - vec2(0.0, uTime * 0.12), uTime * 1.85);
    float caust = clamp(c1 * 0.75 + c2 * 0.55, 0.0, 1.0);

    vec3 causticColor = mix(vec3(0.16, 0.85, 0.98), vec3(0.55, 0.98, 1.0), uDayFactor);
    vec3 col = tileCol * mix(0.95, 1.35, uDayFactor) + causticColor * caust * mix(0.65, 0.95, uDayFactor);

    gl_FragColor = vec4(col, 1.0);
  }
`;
