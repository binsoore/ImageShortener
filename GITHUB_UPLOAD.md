# GitHub을 통한 CloudFlare Pages 배포

## 배포 오류 해결

wrangler CLI가 CloudFlare Pages 빌드 환경에 없어서 발생한 오류입니다.
GitHub 연동을 통한 자동 배포를 사용하면 이 문제를 해결할 수 있습니다.

## GitHub 업로드 및 배포 과정

### 1. GitHub 리포지토리 생성
1. GitHub에서 새 리포지토리 생성
2. 리포지토리 이름: `imagelink` (또는 원하는 이름)

### 2. 코드 업로드
```bash
# Git 초기화 (아직 안했다면)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "CloudFlare Pages 배포용 이미지 호스팅 서비스"

# GitHub 리포지토리 연결
git remote add origin https://github.com/사용자명/imagelink.git

# 업로드
git push -u origin main
```

### 3. CloudFlare Pages 연결
1. CloudFlare 대시보드 접속
2. Workers & Pages > "Create application"
3. "Pages" 탭 > "Connect to Git"
4. GitHub 계정 연결 및 리포지토리 선택
5. 빌드 설정:
   ```
   Project name: imagelink
   Production branch: main
   Build command: npm ci && npx vite build --outDir dist && cp _redirects dist/ && cp -r functions dist/
   Build output directory: dist
   ```

### 4. 자동 빌드 확인
- GitHub에 코드가 푸시되면 자동으로 빌드됩니다
- CloudFlare Pages 대시보드에서 빌드 로그 확인 가능

### 5. KV 바인딩 설정
빌드 완료 후:
1. Pages 프로젝트 > Settings > Functions
2. KV namespace bindings 추가:
   - Variable name: `IMAGE_STORE`
   - KV namespace: `imagelink-storage` (미리 생성 필요)

## 장점

✅ wrangler CLI 설치 불필요
✅ 자동 빌드 및 배포
✅ Git 기반 버전 관리
✅ 빌드 로그 확인 가능
✅ 롤백 기능 지원

## 파일 확인

다음 파일들이 올바르게 리포지토리에 포함되어야 합니다:

```
프로젝트/
├── functions/          # CloudFlare Pages Functions
├── client/             # React 클라이언트 코드
├── shared/             # 공유 스키마
├── _redirects          # URL 리디렉션 설정
├── package.json        # 의존성 설정
├── vite.config.ts      # Vite 빌드 설정
└── wrangler.toml       # CloudFlare 설정 (단순화됨)
```

이제 GitHub을 통해 안정적으로 배포할 수 있습니다.