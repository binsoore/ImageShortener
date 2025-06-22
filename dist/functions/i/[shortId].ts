// CloudFlare Pages Function for serving images by short ID
export async function onRequestGet(context: any) {
  const { params, env } = context;
  const shortId = params.shortId;
  
  try {
    const imageDataStr = await env.IMAGE_STORE.get(shortId);
    
    if (!imageDataStr) {
      return new Response('Image not found', { status: 404 });
    }
    
    const imageData = JSON.parse(imageDataStr);
    
    if (new Date(imageData.expiresAt) <= new Date()) {
      await env.IMAGE_STORE.delete(shortId);
      return new Response('Image expired', { status: 404 });
    }
    
    const binaryString = atob(imageData.data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    return new Response(bytes, {
      headers: {
        'Content-Type': imageData.mimeType,
        'Cache-Control': 'public, max-age=31536000',
        'Content-Disposition': `inline; filename="${imageData.originalName}"`
      }
    });
    
  } catch (error) {
    console.error('Error serving image:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}