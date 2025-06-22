# Cloudflare Pages 배포 가이드

## 준비 완료된 파일들

프로젝트가 Cloudflare Pages 배포를 위해 준비되었습니다:

```
dist/
├── index.html          # React 앱 메인 페이지
├── assets/            # CSS, JS 번들 파일들
├── _redirects         # 라우팅 설정
└── functions/         # Cloudflare Functions API
    ├── api/
    │   ├── auth/
    │   ├── images.ts
    │   ├── upload.ts
    │   └── ...
    └── i/
        └── [shortId].ts
```

## Cloudflare Pages 배포 단계

### 1단계: GitHub 저장소 연결
1. [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
2. "Create a project" → "Connect to Git"
3. GitHub 저장소 선택 및 권한 승인

### 2단계: 빌드 설정
```
Framework preset: None
Build command: npm ci && cd client && npx vite build
Build output directory: dist
Root directory: (비워두기)
```

### 3단계: KV 스토리지 설정
1. Cloudflare Dashboard → Workers & Pages → KV
2. "Create a namespace" 클릭
3. Name: `imagelink-storage`

### 4단계: KV 바인딩 설정
1. Pages 프로젝트 → Settings → Functions
2. "KV namespace bindings" 섹션에서 "Add binding"
3. Variable name: `IMAGE_STORE`
4. KV namespace: `imagelink-storage` 선택

### 5단계: 환경 변수 (선택사항)
필요시 Settings → Environment variables에서 설정:
- `NODE_ENV=production`

## 배포 후 확인사항

배포 완료 후 다음 기능들이 정상 작동하는지 확인:

- ✅ 메인 페이지 로드 (`/`)
- ✅ 네비게이션 메뉴 (홈, API 테스트, 설정)
- ✅ 이미지 업로드 기능
- ✅ 이미지 URL 단축 기능 (`/i/[shortId]`)
- ✅ API 엔드포인트들 (`/api/*`)

## 문제 해결

### 빌드 실패시
- Functions → Logs에서 오류 확인
- KV 바인딩이 올바르게 설정되었는지 확인

### 라우팅 문제시
- `_redirects` 파일이 dist 폴더에 포함되었는지 확인
- SPA 라우팅을 위한 fallback 설정 확인

## 완료!

모든 설정이 완료되면 Cloudflare Pages에서 제공하는 URL로 접속하여 애플리케이션을 사용할 수 있습니다.