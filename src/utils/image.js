export const resizeImageToBase64 = (
  file,
  {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.7,
    mimeType = 'image/jpeg',
  } = {},
) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const image = new Image();

      image.onload = () => {
        const widthRatio = maxWidth / image.width;
        const heightRatio = maxHeight / image.height;
        const ratio = Math.min(widthRatio, heightRatio, 1);
        const width = Math.round(image.width * ratio);
        const height = Math.round(image.height * ratio);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;

        if (!context) {
          reject(new Error('Canvas-Kontext konnte nicht erstellt werden.'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL(mimeType, quality));
      };

      image.onerror = () => reject(new Error('Bild konnte nicht geladen werden.'));
      image.src = reader.result;
    };

    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden.'));
    reader.readAsDataURL(file);
  });
