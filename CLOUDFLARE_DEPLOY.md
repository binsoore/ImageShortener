# CloudFlare Pages 배포 가이드

## 준비사항

1. CloudFlare 계정
2. GitHub 리포지토리에 코드 푸시

## 배포 단계

### 1. KV 네임스페이스 생성

CloudFlare 대시보드에서:
1. Workers & Pages > KV 로 이동
2. "Create a namespace" 클릭
3. 네임스페이스 이름: `imagelink-storage` 입력
4. 생성된 네임스페이스 ID 메모

### 2. CloudFlare Pages 프로젝트 생성

1. CloudFlare 대시보드 > Workers & Pages
2. "Create application" > "Pages" 탭 선택
3. "Connect to Git" 선택
4. GitHub 리포지토리 연결
5. Build settings:
   - Project name: `imagelink`
   - Production branch: `main`
   - Framework preset: `None`
   - Build command: `npm install && npm run build`
   - Build output directory: `dist`
   - Root directory: `/` (루트)

### 3. 정적 파일 빌드

로컬에서 정적 파일 생성:
```bash
# Vite로 정적 파일 빌드
npx vite build --outDir dist

# _redirects 파일 복사
cp _redirects dist/

# functions 폴더 전체 복사 (중요!)
cp -r functions dist/
```

### 4. Functions 바인딩 설정

Pages 프로젝트 배포 후:
1. Pages 프로젝트 > Settings > Functions
2. "KV namespace bindings" 섹션에서 "Add binding" 클릭
3. 설정:
   - Variable name: `IMAGE_STORE`
   - KV namespace: 앞서 생성한 `imagelink-storage` 선택

### 5. 수동 배포 (권장)

Wrangler CLI 사용:
```bash
# Wrangler 설치
npm install -g wrangler

# CloudFlare 로그인
wrangler login

# 정적 파일 빌드
npx vite build --outDir dist
cp _redirects dist/
cp -r functions dist/

# Pages에 배포
wrangler pages deploy dist --project-name imagelink
```

## 배포 후 확인사항

1. 이미지 업로드 테스트
2. 단축 URL 동작 확인 (`/i/{shortId}`)
3. 관리자 로그인 테스트 (비밀번호: admin123)
4. 이미지 목록 확인
5. 이미지 삭제 및 정리 기능 확인

## 주요 특징

- **서버리스**: CloudFlare Pages Functions 사용
- **저장소**: CloudFlare KV를 이용한 이미지 저장 (Base64)
- **자동 만료**: 5일 후 자동 이미지 삭제
- **관리 기능**: 쿠키 기반 간단 인증

## API 엔드포인트

- `POST /api/upload` - 파일 업로드
- `POST /api/upload-base64` - Base64 업로드
- `GET /api/images` - 이미지 목록
- `DELETE /api/images/{id}` - 이미지 삭제 (관리자)
- `POST /api/cleanup` - 만료 이미지 정리 (관리자)
- `GET /i/{shortId}` - 이미지 서빙
- `POST /api/login` - 관리자 로그인
- `POST /api/logout` - 로그아웃

## 트러블슈팅

### Functions 오류
- KV 바인딩이 `IMAGE_STORE`로 정확히 설정되었는지 확인
- functions 폴더가 dist에 올바르게 복사되었는지 확인

### 업로드 실패
- KV 저장소 용량 확인 (100GB 무료)
- 파일 크기 제한 (25MB)
- Base64 인코딩으로 인한 크기 증가 고려

### 빌드 오류
- Node.js 18 이상 사용
- `npm install` 정상 실행 확인
- dist 폴더에 index.html과 assets 폴더 존재 확인

## 비용 정보

CloudFlare Pages 무료 플랜:
- 500 빌드/월
- 100GB 대역폭/월
- KV 100GB 저장소
- Functions 100,000 요청/일