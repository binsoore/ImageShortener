// CloudFlare Pages Function for image upload
export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ message: '파일이 선택되지 않았습니다.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const uploadedImages = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        continue;
      }

      // Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const extension = file.name.split('.').pop() || 'jpg';
      const filename = `images-${timestamp}-${randomId}.${extension}`;
      
      // Generate short ID for URL
      const shortId = Math.random().toString(36).substring(2, 10);

      // For Cloudflare Pages Functions, store original data
      // Image resizing will be handled when serving the image
      const arrayBuffer = await file.arrayBuffer();
      let processedData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      let finalMimeType = file.type;
      let finalSize = file.size;
      
      const imageData = {
        id: timestamp,
        filename,
        shortId,
        originalName: file.name,
        mimeType: finalMimeType,
        size: finalSize,
        data: processedData,
        uploadedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days
      };

      await env.IMAGE_STORE.put(shortId, JSON.stringify(imageData));
      
      uploadedImages.push({
        id: timestamp,
        filename,
        shortId,
        originalName: file.name,
        mimeType: finalMimeType,
        size: finalSize,
        uploadedAt: imageData.uploadedAt,
        expiresAt: imageData.expiresAt,
        shortUrl: `${new URL(request.url).origin}/i/${shortId}`
      });
    }

    return new Response(JSON.stringify({ images: uploadedImages }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ message: '업로드 중 오류가 발생했습니다.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}