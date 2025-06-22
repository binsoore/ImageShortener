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
      const shortId = `${timestamp.toString(36)}${Math.random().toString(36).substring(2, 8)}`;
      const fileExt = filename.split('.').pop() || 'jpg';
      const finalFilename = `api-${timestamp}-${randomId}.${fileExt}`;

      let mimeType = 'image/jpeg';
      if (data.startsWith('data:')) {
        const mimeMatch = data.match(/data:([^;]+);/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      const base64Data = data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Calculate actual file size from base64
      const actualFileSize = Math.round(base64Data.length * 0.75);
      
      // Check if file exceeds KV storage limit (10MB)
      if (actualFileSize > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ 
          message: `파일이 너무 큽니다. 파일 크기: ${Math.round(actualFileSize / 1024 / 1024)}MB, 최대 허용: 10MB` 
        }), {
          status: 413,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // For Cloudflare Pages Functions, skip client-side resizing
      // Store original image data (resizing will be handled when serving)
      let processedImageData = base64Data;
      let finalMimeType = mimeType;
      let finalSize = actualFileSize;
      
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