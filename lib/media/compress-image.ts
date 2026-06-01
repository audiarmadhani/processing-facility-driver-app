import imageCompression from 'browser-image-compression';

export async function compressImage(file: File | Blob): Promise<Blob> {
  const asFile =
    file instanceof File
      ? file
      : new File([file], 'photo.jpg', { type: file.type || 'image/jpeg' });

  const compressed = await imageCompression(asFile, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1280,
    useWebWorker: true,
    fileType: 'image/webp',
  });

  return compressed;
}
