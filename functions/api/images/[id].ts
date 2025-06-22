// CloudFlare Pages Function for deleting specific image (admin only)
export async function onRequestDelete(context: any) {
  const { request, params, env } = context;
  
  const cookieHeader = request.headers.get('Cookie');
  const isAuthenticated = cookieHeader && cookieHeader.includes('admin_session=true');
  
  if (!isAuthenticated) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  try {
    const imageId = params.id;
    const { keys } = await env.IMAGE_STORE.list();
    let deleted = false;
    
    for (const key of keys) {
      try {
        const imageDataStr = await env.IMAGE_STORE.get(key.name);
        if (imageDataStr) {
          const imageData = JSON.parse(imageDataStr);
          if (imageData.id === parseInt(imageId)) {
            await env.IMAGE_STORE.delete(key.name);
            deleted = true;
            break;
          }
        }
      } catch (error) {
        console.error('Error processing image:', key.name, error);
      }
    }
    
    if (!deleted) {
      return new Response(JSON.stringify({ message: 'Image not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify({ message: 'Image deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error deleting image:', error);
    return new Response(JSON.stringify({ message: 'Failed to delete image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}