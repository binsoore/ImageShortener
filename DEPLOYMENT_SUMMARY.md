# CloudFlare Pages 배포 완료 안내

## 배포 준비 완료 ✅

모든 필요한 파일과 설정이 준비되었습니다:

### 📁 파일 구조
```
project/
├── functions/          # CloudFlare Pages Functions
│   ├── api/
│   │   ├── upload.ts           # 파일 업로드
│   │   ├── upload-base64.ts    # Base64 업로드  
│   │   ├── images.ts           # 이미지 목록
│   │   ├── images/[id].ts      # 이미지 삭제
│   │   ├── cleanup.ts          # 만료 이미지 정리
│   │   ├── login.ts            # 관리자 로그인
│   │   ├── logout.ts           # 로그아웃
│   │   └── auth/status.ts      # 인증 상태
│   └── i/[shortId].ts          # 이미지 서빙
├── dist/               # 배포용 빌드 폴더
├── _redirects          # URL 리디렉션 설정
├── wrangler.toml       # CloudFlare 설정
└── build-static.js     # 자동 빌드 스크립트
```

### 🚀 배포 방법

#### 1. Wrangler CLI 사용 (권장)
```bash
# Wrangler 설치
npm install -g wrangler

# 로그인
wrangler login

# 정적 파일 빌드
npx vite build --outDir dist
cp _redirects dist/
cp -r functions dist/

# 배포 (프로젝트 처음 생성시)
wrangler pages deploy dist --project-name imagelink

# 기존 프로젝트 업데이트시
wrangler pages deploy dist
```

#### 2. GitHub 자동 배포 (가장 간단)
1. GitHub 리포지토리에 코드 푸시
2. CloudFlare Pages에서 GitHub 연결
3. 빌드 명령어:
   ```
   npm ci && npx vite build --outDir dist && cp _redirects dist/ && cp -r functions dist/
   ```
4. 출력 디렉토리: `dist`

### ⚙️ CloudFlare 대시보드 설정

#### KV 네임스페이스 생성
1. Workers & Pages > KV
2. "Create namespace": `imagelink-storage`

#### Pages 프로젝트 KV 바인딩
1. Pages 프로젝트 > Settings > Functions
2. KV namespace bindings:
   - Variable: `IMAGE_STORE`
   - Namespace: `imagelink-storage`

### 🔧 주요 기능

- ✅ 드래그 앤 드롭 이미지 업로드
- ✅ 클립보드 붙여넣기 (Ctrl+V)
- ✅ Base64 API 업로드 지원
- ✅ 단축 URL 생성 (`/i/{shortId}`)
- ✅ 관리자 패널 (비밀번호: admin123)
- ✅ 자동 이미지 만료 (5일)
- ✅ 서버리스 아키텍처

### 📊 비용 (CloudFlare Pages 무료 플랜)
- 500 빌드/월
- 100GB 대역폭/월
- KV 100GB 저장소
- Functions 100,000 요청/일

### 🔍 배포 후 테스트
1. 메인 페이지 접속
2. 이미지 업로드 테스트
3. 단축 URL 동작 확인
4. 관리자 로그인 (admin123)
5. API 테스트 (/api-test)

### 📞 지원
Contact: binsoore@naver.com

---
배포 완료 후 도메인을 통해 서비스를 이용할 수 있습니다.