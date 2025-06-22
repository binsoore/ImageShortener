# CloudFlare Pages 배포 가이드

## 404 오류 해결 방법

### 1. CloudFlare Pages 빌드 설정

**Framework preset:** None
**수정된 Build command:**
```bash
mkdir -p dist && cp -r functions dist/ && cp _redirects dist/ && cp client/index.html dist/index.html && cp dist/index.html dist/404.html
```

**화면 표시 문제 해결:**
- body 태그에 배경색과 기본 스타일 추가
- 가시성 향상을 위한 CSS 개선
**Build output directory:** `dist`

**Root directory:** (비워두기)
**Environment variables:** 없음

### 대안: React 빌드 사용시
```bash
npm ci && npx vite build --outDir dist && cp _redirects dist/ && cp -r functions dist/functions
```

### 2. 반드시 필요한 파일들

#### _redirects 파일 (루트에 위치)
```
/api/* /api/:splat 200
/i/* /i/:splat 200
/* /index.html 200
```

#### functions/ 폴더 구조
```
functions/
├── api/
│   ├── auth/
│   │   └── status.ts
│   ├── images/
│   │   └── [id].ts
│   ├── cleanup.ts
│   ├── images.ts
│   ├── login.ts
│   ├── logout.ts
│   ├── upload.ts
│   └── upload-base64.ts
└── i/
    └── [shortId].ts
```

### 3. KV 네임스페이스 설정

1. CloudFlare 대시보드 > Workers & Pages > KV
2. "Create a namespace" > 이름: `imagelink-storage`
3. Pages 프로젝트 > Settings > Functions > KV namespace bindings:
   - Variable name: `IMAGE_STORE`
   - KV namespace: `imagelink-storage`

### 4. 일반적인 404 오류 원인과 해결책

#### 원인 1: _redirects 파일 누락
- 해결: `/* /index.html 200` 규칙이 반드시 필요
- SPA 라우팅을 위해 모든 경로를 index.html로 리다이렉트

#### 원인 2: 빌드 출력 디렉토리 문제
- 해결: `dist` 폴더에 index.html이 정확히 위치해야 함
- CloudFlare에서 "Build output directory"를 `dist`로 설정

#### 원인 3: base href 설정 누락
- client/index.html에 `<base href="/" />` 추가됨

#### 원인 4: Functions 폴더 복사 누락
- 빌드 시 functions 폴더가 dist/functions로 복사되어야 함

### 5. 배포 후 확인사항

1. CloudFlare Pages > 프로젝트 > Functions 탭에서 함수들이 정상 배포되었는지 확인
2. KV 바인딩이 올바르게 설정되었는지 확인
3. 브라우저에서 F12 > Network 탭으로 API 요청 상태 확인
    "build:cf": "vite build --outDir dist && cp _redirects dist/ && cp -r functions dist/"
  }
}
```

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