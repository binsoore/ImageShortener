// CloudFlare Pages Function for base64 image upload
export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const { images } = await request.json();
    
    if (!images || !Array.isArray(images)) {
      return new Response(JSON.stringify({ message: '이미지 데이터가 없습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadedImages = [];

    for (const imageData of images) {
      const { filename, data } = imageData;
      
      if (!data || !filename) {
        continue;
      }

      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const shortId = Math.random().toString(36).substring(2, 10);
      const finalFilename = `api-${timestamp}-${randomId}-${filename}`;

      let mimeType = 'image/jpeg';
      if (data.startsWith('data:')) {
        const mimeMatch = data.match(/data:([^;]+);/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      const base64Data = data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to ArrayBuffer for image processing
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Resize image if needed (using browser APIs in Cloudflare Workers)
      let processedImageData = base64Data;
      let finalMimeType = mimeType;
      let finalSize = Math.round(base64Data.length * 0.75);
      
      try {
        // Create canvas for image resizing
        const blob = new Blob([bytes], { type: mimeType });
        const imageBitmap = await createImageBitmap(blob);
        
        if (imageBitmap.width > 1024) {
          const canvas = new OffscreenCanvas(1024, Math.round(imageBitmap.height * (1024 / imageBitmap.width)));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
          
          const resizedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
          const resizedArrayBuffer = await resizedBlob.arrayBuffer();
          const resizedBytes = new Uint8Array(resizedArrayBuffer);
          
          processedImageData = btoa(String.fromCharCode(...resizedBytes));
          finalMimeType = 'image/jpeg';
          finalSize = resizedBlob.size;
        }
      } catch (resizeError) {
        console.warn('Image resizing failed, using original:', resizeError);
        // Use original image if resizing fails
      }
      
      const storedImageData = {
        id: timestamp,
        filename: finalFilename,
        shortId,
        originalName: filename,
        mimeType: finalMimeType,
        size: finalSize,
        data: processedImageData,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };

      await env.IMAGE_STORE.put(shortId, JSON.stringify(storedImageData));
      
      uploadedImages.push({
        id: timestamp,
        filename: finalFilename,
        shortId,
        originalName: filename,
        mimeType: finalMimeType,
        size: storedImageData.size,
        uploadedAt: storedImageData.uploadedAt,
        expiresAt: storedImageData.expiresAt,
        shortUrl: `${new URL(request.url).origin}/i/${shortId}`
      });
    }

    return new Response(JSON.stringify({ images: uploadedImages }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Base64 upload error:', error);
    return new Response(JSON.stringify({ message: '업로드 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}