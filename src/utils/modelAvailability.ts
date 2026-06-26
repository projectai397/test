const GLB_MAGIC = 0x46546c67;

/** True when the URL returns a real GLB (not Vite's HTML 404 page). */
export async function isGlbAvailable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'GET', headers: { Range: 'bytes=0-11' } });
    if (!res.ok) return false;

    const type = res.headers.get('content-type') ?? '';
    if (type.includes('text/html')) return false;

    const buf = await res.arrayBuffer();
    if (buf.byteLength < 4) return false;

    const magic = new DataView(buf).getUint32(0, true);
    return magic === GLB_MAGIC;
  } catch {
    return false;
  }
}
