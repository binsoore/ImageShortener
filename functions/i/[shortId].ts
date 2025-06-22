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
    
    // Try to resize image if it's too large
    try {
      const blob = new Blob([bytes], { type: imageData.mimeType });
      
      // Check if we can create an image bitmap for resizing
      if (typeof createImageBitmap !== 'undefined') {
        const imageBitmap = await createImageBitmap(blob);
        
        if (imageBitmap.width > 1024) {
          const canvas = new OffscreenCanvas(1024, Math.round(imageBitmap.height * (1024 / imageBitmap.width)));
          const ctx = canvas.getContext('2d');
          ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);
          
          const resizedBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 });
          const resizedBytes = new Uint8Array(await resizedBlob.arrayBuffer());
          
          return new Response(resizedBytes, {
            headers: {
              'Content-Type': 'image/jpeg',
              'Cache-Control': 'public, max-age=31536000',
              'Content-Disposition': `inline; filename="${imageData.originalName}"`
            }
          });
        }
      }
    } catch (resizeError) {
      console.warn('Image resizing failed, serving original:', resizeError);
    }
    
    // Serve original image if resizing failed or not needed
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