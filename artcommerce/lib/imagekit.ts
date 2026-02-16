import ImageKit from 'imagekit'

let imagekitClient: ImageKit | null = null

export function isImageKitConfigured(): boolean {
  return Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT,
  )
}

export function getImageKitClient(): ImageKit | null {
  if (!isImageKitConfigured()) return null
  if (!imagekitClient) {
    imagekitClient = new ImageKit({
      publicKey: process.env.IMAGEKIT_PUBLIC_KEY as string,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY as string,
      urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT as string,
    })
  }
  return imagekitClient
}
