# CloudFlare Pages 배포 단계별 가이드

## 1단계: GitHub 연결

1. CloudFlare 대시보드 > Pages
2. "Create a project" > "Connect to Git"
3. GitHub 저장소 선택

## 2단계: 빌드 설정

**권장 설정:**
```
Framework preset: None  
Build command: mkdir -p dist && cp -r functions dist/ && cp _redirects dist/ && cp client/index.html dist/index.html && cp dist/index.html dist/404.html
Build output directory: dist
Root directory: (비워두기)
Environment variables: (없음)
```

**React 빌드 시도시:**
```
Framework preset: React
Build command: npm ci && npx vite build --outDir dist && cp _redirects dist/ && cp -r functions dist/functions
Build output directory: dist
```

## 3단계: KV 스토리지 설정

1. CloudFlare 대시보드 > Workers & Pages > KV
2. "Create a namespace"
3. Name: `imagelink-storage`
4. 생성 완료

## 4단계: KV 바인딩

1. Pages 프로젝트 > Settings > Functions
2. "KV namespace bindings" 섹션
3. "Add binding" 클릭
4. Variable name: `IMAGE_STORE`
5. KV namespace: `imagelink-storage` 선택
6. Save

## 5단계: 배포 확인

배포 완료 후 다음 URL들이 작동하는지 확인:

- `https://your-project.pages.dev/` - 메인 페이지
- `https://your-project.pages.dev/api/images` - 이미지 목록 API
- `https://your-project.pages.dev/settings` - 설정 페이지 (관리자 로그인 필요)

## 문제 해결

### 404 오류가 계속 발생하는 경우:

1. **빌드 로그 확인**
   - CloudFlare Pages > 프로젝트 > "View build" 에서 로그 확인
   - `dist/index.html` 파일이 생성되었는지 확인

2. **Functions 배포 확인**
   - Pages > 프로젝트 > Functions 탭
   - 모든 API 함수가 나열되는지 확인

3. **_redirects 파일 확인**
   - 빌드 로그에서 `cp _redirects dist/` 명령이 성공했는지 확인

4. **다시 배포**
   - Settings > Builds and deployments > "Retry deployment"

### API 오류가 발생하는 경우:

1. **KV 바인딩 확인**
   - Settings > Functions > KV namespace bindings
   - `IMAGE_STORE` 바인딩이 올바른지 확인

2. **함수 로그 확인**
   - CloudFlare 대시보드 > Workers & Pages > 프로젝트 > Functions > View logs

## 추가 정보

- 초기 배포 시 전 세계 CDN에 전파되는데 최대 5분 소요
- 설정 변경 후에는 새로운 배포가 필요할 수 있음
- 무료 플랜에서는 월 10만 요청 제한이 있음