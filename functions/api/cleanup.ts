// CloudFlare Pages Function for cleaning up expired images (admin only)
export async function onRequestPost(context: any) {
  const { request, env } = context;
  
  // Check authentication
  const cookieHeader = request.headers.get('Cookie');
  const isAuthenticated = cookieHeader && cookieHeader.includes('admin_session=true');
  
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const { keys } = await env.IMAGE_STORE.list();
    let deletedCount = 0;
    
    for (const key of keys) {
      try {
        const imageDataStr = await env.IMAGE_STORE.get(key.name);
        if (imageDataStr) {
          const imageData = JSON.parse(imageDataStr);
          
          // Check if image is expired
          if (new Date(imageData.expiresAt) <= new Date()) {
            await env.IMAGE_STORE.delete(key.name);
            deletedCount++;
          }
        }
      } catch (error) {
        console.error('Error processing image:', key.name, error);
        // Delete corrupted entries
        await env.IMAGE_STORE.delete(key.name);
        deletedCount++;
      }
    }
    
    return new Response(JSON.stringify({ 
      message: `Deleted ${deletedCount} expired images`,
      deletedCount 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error cleaning up expired images:', error);
    return new Response(JSON.stringify({ message: 'Failed to cleanup expired images' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}