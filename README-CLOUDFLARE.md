# CloudFlare Pages 배포 브랜치

이 브랜치는 CloudFlare Pages 배포용으로 설정되어 있습니다.

## 빌드 설정

**Framework preset:** None
**Build command:** 
```bash
npm ci && npx vite build --outDir dist && mkdir -p dist && printf '/api/* /api/:splat 200\n/i/* /i/:splat 200' > dist/_redirects && cp -r functions dist/functions
```
**Build output directory:** `dist`

## KV 네임스페이스 설정

1. CloudFlare 대시보드 > Workers & Pages > KV
2. "Create a namespace" > 이름: `imagelink-storage`
3. Pages 프로젝트 > Settings > Functions
4. KV namespace bindings 추가:
   - Variable name: `IMAGE_STORE`
   - KV namespace: `imagelink-storage`

## 주요 기능

- 드래그 앤 드롭 이미지 업로드
- 클립보드 붙여넣기 (Ctrl+V)
- 단축 URL 생성 (`/i/{shortId}`)
- 관리자 패널 (비밀번호: admin123)
- 자동 이미지 만료 (5일)
- CloudFlare KV 기반 서버리스 저장

## 파일 구조

- `functions/` - CloudFlare Pages Functions
- `_redirects` - URL 라우팅 설정
- `client/` - React 클라이언트 코드