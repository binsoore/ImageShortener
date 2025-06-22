# CloudFlare Pages 배포 명령어 정리

## 로컬에서 빌드 및 배포

### 1. 의존성 설치
```bash
npm install
```

### 2. 정적 파일 빌드
```bash
# Vite로 정적 파일 생성
npx vite build --outDir dist

# 필수 파일들 복사
cp _redirects dist/
cp -r functions dist/
```

### 3. Wrangler 설치 및 로그인
```bash
# Wrangler CLI 전역 설치
npm install -g wrangler

# CloudFlare 계정 로그인
wrangler login
```

### 4. Pages 프로젝트 배포
```bash
# CloudFlare Pages에 배포
wrangler pages deploy dist

# 또는 프로젝트 이름 지정
wrangler pages deploy dist --project-name imagelink
```

## 자동 빌드 스크립트 사용

### 편리한 원클릭 빌드
```bash
# 빌드 스크립트 실행 권한 부여
chmod +x build-static.js

# 자동 빌드 실행
node build-static.js
```

### 이후 배포
```bash
wrangler pages deploy dist --project-name imagelink
```

## CloudFlare 대시보드 설정

### KV 네임스페이스 생성
1. CloudFlare 대시보드 접속
2. Workers & Pages > KV
3. "Create a namespace" 클릭
4. 이름: `imagelink-storage`

### Pages 프로젝트에서 KV 바인딩
1. Pages 프로젝트 > Settings > Functions
2. "KV namespace bindings" > "Add binding"
3. Variable name: `IMAGE_STORE`
4. KV namespace: `imagelink-storage` 선택

## 환경별 배포

### Production
```bash
wrangler pages deploy dist --env production
```

### Preview (테스트)
```bash
wrangler pages deploy dist --env preview
```

### 환경 없이 배포 (기본)
```bash
wrangler pages deploy dist
```

## 배포 확인

배포 완료 후 다음을 테스트:
1. 메인 페이지 접속
2. 이미지 업로드 기능
3. 단축 URL 동작
4. 관리자 로그인 (admin123)
5. 이미지 삭제 기능