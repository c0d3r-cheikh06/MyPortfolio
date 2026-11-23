/**
 * Minimal glTF 2.0 binary (GLB) writer — no dependencies.
 * Supports indexed triangle meshes with POSITION, NORMAL, COLOR_0 (vec4),
 * TEXCOORD_0 and simple PBR materials. One node per mesh.
 */
import { writeFileSync } from 'node:fs';

export function writeGLB(path, meshes, { generator = 'CHEIKH.EXE avatar generator' } = {}) {
  const chunks = [];
  let byteLength = 0;
  const bufferViews = [];
  const accessors = [];
  const materials = [];
  const gltfMeshes = [];
  const nodes = [];

  const addView = (typed, target) => {
    const pad = (4 - (byteLength % 4)) % 4;
    if (pad) {
      chunks.push(new Uint8Array(pad));
      byteLength += pad;
    }
    const bytes = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength);
    chunks.push(bytes);
    bufferViews.push({ buffer: 0, byteOffset: byteLength, byteLength: bytes.byteLength, ...(target ? { target } : {}) });
    byteLength += bytes.byteLength;
    return bufferViews.length - 1;
  };

  const addAccessor = (typed, type, componentType, count, target, extra = {}) => {
    const bufferView = addView(typed, target);
    accessors.push({ bufferView, componentType, count, type, ...extra });
    return accessors.length - 1;
  };

  for (const m of meshes) {
    const count = m.positions.length / 3;
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < m.positions.length; i += 3)
      for (let c = 0; c < 3; c++) {
        min[c] = Math.min(min[c], m.positions[i + c]);
        max[c] = Math.max(max[c], m.positions[i + c]);
      }
    const attributes = {};
    attributes.POSITION = addAccessor(m.positions, 'VEC3', 5126, count, 34962, { min, max });
    if (m.normals) attributes.NORMAL = addAccessor(m.normals, 'VEC3', 5126, count, 34962);
    if (m.colors) {
      if (m.colorFloat) {
        const f32 = m.colors instanceof Float32Array ? m.colors : new Float32Array(m.colors);
        attributes.COLOR_0 = addAccessor(f32, 'VEC4', 5126, count, 34962);
      } else {
        // Compact normalized UNSIGNED_BYTE VEC4 (4 bytes/vert instead of 16 bytes/vert)
        const u8 = new Uint8Array(m.colors.length);
        for (let i = 0; i < m.colors.length; i++) u8[i] = Math.max(0, Math.min(255, Math.round(m.colors[i] * 255)));
        attributes.COLOR_0 = addAccessor(u8, 'VEC4', 5121, count, 34962, { normalized: true });
      }
    }
    if (m.uvs) attributes.TEXCOORD_0 = addAccessor(m.uvs, 'VEC2', 5126, count, 34962);

    const primitive = { attributes, mode: m.mode ?? 4 };
    if (m.indices) {
      const big = count > 65535;
      const idx = big ? new Uint32Array(m.indices) : new Uint16Array(m.indices);
      primitive.indices = addAccessor(idx, 'SCALAR', big ? 5125 : 5123, idx.length, 34963);
    }
    if (m.material) {
      materials.push({
        name: m.material.name,
        pbrMetallicRoughness: {
          baseColorFactor: m.material.color ?? [1, 1, 1, 1],
          metallicFactor: m.material.metalness ?? 0,
          roughnessFactor: m.material.roughness ?? 0.8,
        },
        doubleSided: !!m.material.doubleSided,
      });
      primitive.material = materials.length - 1;
    }
    gltfMeshes.push({ name: m.name, primitives: [primitive] });
    nodes.push({ name: m.name, mesh: gltfMeshes.length - 1 });
  }

  const json = {
    asset: { version: '2.0', generator },
    scene: 0,
    scenes: [{ name: 'CheikhAvatar', nodes: nodes.map((_, i) => i) }],
    nodes,
    meshes: gltfMeshes,
    materials,
    accessors,
    bufferViews,
    buffers: [{ byteLength }],
  };

  let jsonBytes = new TextEncoder().encode(JSON.stringify(json));
  const jsonPad = (4 - (jsonBytes.length % 4)) % 4;
  if (jsonPad) {
    const p = new Uint8Array(jsonBytes.length + jsonPad).fill(0x20);
    p.set(jsonBytes);
    jsonBytes = p;
  }
  const binPad = (4 - (byteLength % 4)) % 4;
  const binLength = byteLength + binPad;
  const total = 12 + 8 + jsonBytes.length + 8 + binLength;
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true); // glTF
  dv.setUint32(4, 2, true);
  dv.setUint32(8, total, true);
  dv.setUint32(12, jsonBytes.length, true);
  dv.setUint32(16, 0x4e4f534a, true); // JSON
  out.set(jsonBytes, 20);
  let o = 20 + jsonBytes.length;
  dv.setUint32(o, binLength, true);
  dv.setUint32(o + 4, 0x004e4942, true); // BIN
  o += 8;
  for (const c of chunks) {
    out.set(c, o);
    o += c.byteLength;
  }
  writeFileSync(path, out);
  return total;
}
