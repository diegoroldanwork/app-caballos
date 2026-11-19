// Achica la foto del celular antes de subirla (máx. 1600 px, JPEG).
export async function comprimir(file: File, max = 1600): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file)
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * k)
    c.height = Math.round(bmp.height * k)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    return await new Promise((ok) => c.toBlob((b) => ok(b ?? file), 'image/jpeg', 0.82))
  } catch {
    return file
  }
}
