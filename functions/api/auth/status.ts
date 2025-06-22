// CloudFlare Pages Function for auth status
export async function onRequestGet(context: any) {
  const { request } = context;
  
  // Simple session check using cookies
  const cookieHeader = request.headers.get('Cookie');
  const isAuthenticated = cookieHeader && cookieHeader.includes('admin_session=true');
  
  return new Response(JSON.stringify({ isAuthenticated }), {
    headers: { 'Content-Type': 'application/json' }
  });
}