// CloudFlare Pages Function for admin logout
export async function onRequestPost(context: any) {
  return new Response(JSON.stringify({ success: true, message: '로그아웃 성공' }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    }
  });
}