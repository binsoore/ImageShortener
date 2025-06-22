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

      // Generate unique identifiers
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const shortId = Math.random().toString(36).substring(2, 10);
      const finalFilename = `api-${timestamp}-${randomId}-${filename}`;

      // Detect MIME type from base64 header
      let mimeType = 'image/jpeg';
      if (data.startsWith('data:')) {
        const mimeMatch = data.match(/data:([^;]+);/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
      }

      // Clean base64 data
      const base64Data = data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      const storedImageData = {
        id: timestamp,
        filename: finalFilename,
        shortId,
        originalName: filename,
        mimeType,
        size: Math.round(base64Data.length * 0.75), // Approximate size
        data: base64Data,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Store in CloudFlare KV
      await env.IMAGE_STORE.put(shortId, JSON.stringify(storedImageData));
      
      uploadedImages.push({
        id: timestamp,
        filename: finalFilename,
        shortId,
        originalName: filename,
        mimeType,
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