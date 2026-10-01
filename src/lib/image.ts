export async function resizeImage(file: Blob): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file)

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('The selected image could not be read.'))
      element.src = imageUrl
    })

    const size = Math.min(image.naturalWidth, image.naturalHeight)
    const sourceX = (image.naturalWidth - size) / 2
    const sourceY = (image.naturalHeight - size) / 2
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const context = canvas.getContext('2d')

    if (!context) {
      throw new Error('Image processing is not supported in this browser.')
    }

    context.drawImage(image, sourceX, sourceY, size, size, 0, 0, 400, 400)

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('The image could not be prepared for upload.'))
      }, 'image/jpeg', 0.8)
    })
  } finally {
    URL.revokeObjectURL(imageUrl)
  }
}
