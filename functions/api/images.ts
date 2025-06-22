// CloudFlare Pages Function for getting images list
export async function onRequestGet(context: any) {
  const { env } = context;
  
  try {
    // Get all images from KV store
    const { keys } = await env.IMAGE_STORE.list();
    const images = [];
    
    for (const key of keys) {
      try {
        const imageDataStr = await env.IMAGE_STORE.get(key.name);
        if (imageDataStr) {
          const imageData = JSON.parse(imageDataStr);
          
          // Check if image is expired
          if (new Date(imageData.expiresAt) > new Date()) {
            images.push({
              id: imageData.id,
              filename: imageData.filename,
              shortId: imageData.shortId,
              originalName: imageData.originalName,
              mimeType: imageData.mimeType,
              size: imageData.size,
              uploadedAt: imageData.uploadedAt,
              expiresAt: imageData.expiresAt,
              shortUrl: `${new URL(context.request.url).origin}/i/${imageData.shortId}`
            });
          } else {
            // Delete expired image
            await env.IMAGE_STORE.delete(key.name);
          }
        }
      } catch (error) {
        console.error('Error processing image:', key.name, error);
      }
    }
    
    // Sort by upload date (newest first)
    images.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    return new Response(JSON.stringify({ images }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching images:', error);
    return new Response(JSON.stringify({ message: '이미지 목록을 가져오는데 실패했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}