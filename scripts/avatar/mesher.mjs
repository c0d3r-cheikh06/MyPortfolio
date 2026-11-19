/**
 * Surface Nets mesher with gradient projection.
 * Produces smooth, watertight-ish indexed meshes from an SDF.
 */

export function gradient(sdf, x, y, z, e = 0.0004) {
  const gx = sdf(x + e, y, z) - sdf(x - e, y, z);
  const gy = sdf(x, y + e, z) - sdf(x, y - e, z);
  const gz = sdf(x, y, z + e) - sdf(x, y, z - e);
  const l = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
  return [gx / l, gy / l, gz / l];
}

/**
 * @param {(x:number,y:number,z:number)=>number} sdf
 * @param {[number,number,number]} bmin
 * @param {[number,number,number]} bmax
 * @param {number} h voxel size
 */
export function surfaceNets(sdf, bmin, bmax, h) {
  const nx = Math.ceil((bmax[0] - bmin[0]) / h) + 1;
  const ny = Math.ceil((bmax[1] - bmin[1]) / h) + 1;
  const nz = Math.ceil((bmax[2] - bmin[2]) / h) + 1;
  const field = new Float32Array(nx * ny * nz);
  const idx = (i, j, k) => i + nx * (j + ny * k);

  // coarse-to-fine: evaluate every point but skip expensive work far from surface
  for (let k = 0; k < nz; k++) {
    const z = bmin[2] + k * h;
    for (let j = 0; j < ny; j++) {
      const y = bmin[1] + j * h;
      for (let i = 0; i < nx; i++) {
        field[idx(i, j, k)] = sdf(bmin[0] + i * h, y, z);
      }
    }
  }

  const cx = nx - 1, cy = ny - 1, cz = nz - 1;
  const cellVert = new Int32Array(cx * cy * cz).fill(-1);
  const cidx = (i, j, k) => i + cx * (j + cy * k);
  const pos = [];
  const corner = new Float32Array(8);
  const edges = [
    [0, 1], [2, 3], [4, 5], [6, 7],
    [0, 2], [1, 3], [4, 6], [5, 7],
    [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const cOff = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0],
    [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
  ];

  for (let k = 0; k < cz; k++)
    for (let j = 0; j < cy; j++)
      for (let i = 0; i < cx; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const v = field[idx(i + cOff[c][0], j + cOff[c][1], k + cOff[c][2])];
          corner[c] = v;
          if (v < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of edges) {
          const va = corner[a], vb = corner[b];
          if ((va < 0) === (vb < 0)) continue;
          const t = va / (va - vb);
          sx += cOff[a][0] + (cOff[b][0] - cOff[a][0]) * t;
          sy += cOff[a][1] + (cOff[b][1] - cOff[a][1]) * t;
          sz += cOff[a][2] + (cOff[b][2] - cOff[a][2]) * t;
          n++;
        }
        let px = bmin[0] + (i + sx / n) * h;
        let py = bmin[1] + (j + sy / n) * h;
        let pz = bmin[2] + (k + sz / n) * h;
        // project onto the true surface (2 Newton steps), clamped to the cell neighbourhood
        const ox = px, oy = py, oz = pz;
        for (let it = 0; it < 2; it++) {
          const d = sdf(px, py, pz);
          const g = gradient(sdf, px, py, pz, h * 0.25);
          px -= d * g[0];
          py -= d * g[1];
          pz -= d * g[2];
        }
        const dx = px - ox, dy = py - oy, dz = pz - oz;
        const dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dl > h) {
          px = ox + (dx / dl) * h;
          py = oy + (dy / dl) * h;
          pz = oz + (dz / dl) * h;
        }
        cellVert[cidx(i, j, k)] = pos.length / 3;
        pos.push(px, py, pz);
      }

  const indices = [];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) [b, d] = [d, b];
    // choose shorter diagonal
    const dAC = dist2(pos, a, c), dBD = dist2(pos, b, d);
    if (dAC < dBD) indices.push(a, b, c, a, c, d);
    else indices.push(a, b, d, b, c, d);
  };

  for (let k = 1; k < cz; k++)
    for (let j = 1; j < cy; j++)
      for (let i = 1; i < cx; i++) {
        const v0 = field[idx(i, j, k)];
        const inside = v0 < 0;
        // x edge (i,j,k)->(i+1,j,k); shared by cells (i, j-1..j, k-1..k)
        if ((field[idx(i + 1, j, k)] < 0) !== inside) {
          quad(cellVert[cidx(i, j - 1, k - 1)], cellVert[cidx(i, j, k - 1)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j - 1, k)], !inside);
        }
        if ((field[idx(i, j + 1, k)] < 0) !== inside) {
          quad(cellVert[cidx(i - 1, j, k - 1)], cellVert[cidx(i - 1, j, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i, j, k - 1)], !inside);
        }
        if ((field[idx(i, j, k + 1)] < 0) !== inside) {
          quad(cellVert[cidx(i - 1, j - 1, k)], cellVert[cidx(i, j - 1, k)], cellVert[cidx(i, j, k)], cellVert[cidx(i - 1, j, k)], !inside);
        }
      }

  const positions = new Float32Array(pos);
  const normals = new Float32Array(positions.length);
  for (let v = 0; v < positions.length; v += 3) {
    const g = gradient(sdf, positions[v], positions[v + 1], positions[v + 2], h * 0.5);
    normals[v] = g[0];
    normals[v + 1] = g[1];
    normals[v + 2] = g[2];
  }
  // fix winding against SDF normals (robust regardless of quad orientation rule)
  const idxArr = new Uint32Array(indices);
  for (let t = 0; t < idxArr.length; t += 3) {
    const a = idxArr[t] * 3, b = idxArr[t + 1] * 3, c = idxArr[t + 2] * 3;
    const ux = positions[b] - positions[a], uy = positions[b + 1] - positions[a + 1], uz = positions[b + 2] - positions[a + 2];
    const vx = positions[c] - positions[a], vy = positions[c + 1] - positions[a + 1], vz = positions[c + 2] - positions[a + 2];
    const fx = uy * vz - uz * vy, fy = uz * vx - ux * vz, fz = ux * vy - uy * vx;
    const nxs = normals[a] + normals[b] + normals[c];
    const nys = normals[a + 1] + normals[b + 1] + normals[c + 1];
    const nzs = normals[a + 2] + normals[b + 2] + normals[c + 2];
    if (fx * nxs + fy * nys + fz * nzs < 0) {
      const tmp = idxArr[t + 1];
      idxArr[t + 1] = idxArr[t + 2];
      idxArr[t + 2] = tmp;
    }
  }
  return { positions, normals, indices: idxArr };
}

function dist2(p, a, b) {
  const dx = p[a * 3] - p[b * 3], dy = p[a * 3 + 1] - p[b * 3 + 1], dz = p[a * 3 + 2] - p[b * 3 + 2];
  return dx * dx + dy * dy + dz * dz;
}

/** Laplacian smoothing restricted to tangent plane (keeps volume). */
export function smoothMesh(mesh, iterations = 1, lambda = 0.4) {
  const { positions, indices } = mesh;
  const nV = positions.length / 3;
  const adj = Array.from({ length: nV }, () => new Set());
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t], b = indices[t + 1], c = indices[t + 2];
    adj[a].add(b).add(c);
    adj[b].add(a).add(c);
    adj[c].add(a).add(b);
  }
  for (let it = 0; it < iterations; it++) {
    const next = new Float32Array(positions);
    for (let v = 0; v < nV; v++) {
      const s = adj[v];
      if (s.size === 0) continue;
      let ax = 0, ay = 0, az = 0;
      for (const u of s) {
        ax += positions[u * 3];
        ay += positions[u * 3 + 1];
        az += positions[u * 3 + 2];
      }
      ax = ax / s.size - positions[v * 3];
      ay = ay / s.size - positions[v * 3 + 1];
      az = az / s.size - positions[v * 3 + 2];
      const nx = mesh.normals[v * 3], ny = mesh.normals[v * 3 + 1], nz = mesh.normals[v * 3 + 2];
      const dn = ax * nx + ay * ny + az * nz;
      next[v * 3] += lambda * (ax - dn * nx);
      next[v * 3 + 1] += lambda * (ay - dn * ny);
      next[v * 3 + 2] += lambda * (az - dn * nz);
    }
    positions.set(next);
  }
  return mesh;
}
