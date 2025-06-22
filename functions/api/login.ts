// CloudFlare Pages Function for admin login
export async function onRequestPost(context: any) {
  const { request } = context;
  
  try {
    const { password } = await request.json();
    
    if (password === 'admin123') {
      return new Response(JSON.stringify({ success: true, message: '로그인 성공' }), {
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': 'admin_session=true; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400'
        }
      });
    } else {
      return new Response(JSON.stringify({ success: false, message: '비밀번호가 틀렸습니다' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
  } catch (error) {
    return new Response(JSON.stringify({ success: false, message: '로그인 처리 중 오류가 발생했습니다' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}