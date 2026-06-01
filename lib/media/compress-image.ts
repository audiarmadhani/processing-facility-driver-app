import imageCompression from 'browser-image-compression';

export async function compressImage(file: File | Blob): Promise<Blob> {
  const asFile =
    file instanceof File
      ? file
      : new File([file], 'photo.jpg', { type: file.type || 'image/jpeg' });

  const compressed = await imageCompression(asFile, {
    maxSizeMB: 0.4,
    maxWidthOrHeight: 1024,
    useWebWorker: typeof window !== 'undefined' && 'Worker' in window,
    fileType: 'image/webp',
  });

  return compressed;
}
