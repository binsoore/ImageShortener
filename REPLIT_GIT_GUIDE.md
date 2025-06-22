# Replit에서 GitHub으로 코드 업로드하기

## CloudFlare Pages 배포를 위한 GitHub 업로드

### 1. Replit Git 설정
Replit에서 Git 설정이 필요합니다:

1. 좌측 패널에서 "Git" 아이콘 클릭
2. "Initialize repository" 또는 기존 Git 확인
3. GitHub 계정 연결

### 2. 파일 정리
불필요한 파일들이 CloudFlare Pages 빌드에 영향을 주지 않도록:

```bash
# Python 관련 파일 제거 (JavaScript 프로젝트이므로)
rm -f pyproject.toml uv.lock

# .cfignore 파일로 빌드 제외 설정
```

### 3. Replit에서 GitHub 연결
1. Replit Git 패널에서 "Connect to GitHub"
2. 새 리포지토리 생성 또는 기존 리포지토리 선택
3. 리포지토리 이름: `imagelink`

### 4. 코드 커밋 및 푸시
Replit Git 패널에서:
1. 변경사항 확인
2. 커밋 메시지 입력: "CloudFlare Pages 배포용 이미지 호스팅 서비스"
3. "Commit & Push" 클릭

### 5. CloudFlare Pages 연결
GitHub 업로드 후:
1. CloudFlare 대시보드 접속
2. Workers & Pages > "Create application"
3. "Pages" 탭 > "Connect to Git"
4. GitHub 리포지토리 선택: `imagelink`
5. 빌드 설정:
   ```
   Framework preset: None
   Build command: npm ci && npx vite build --outDir dist && cp _redirects dist/ && cp -r functions dist/
   Build output directory: dist
   Root directory: /
   ```

### 6. KV 네임스페이스 설정
1. CloudFlare 대시보드 > Workers & Pages > KV
2. "Create a namespace" > 이름: `imagelink-storage`
3. Pages 프로젝트 > Settings > Functions
4. KV namespace bindings 추가:
   - Variable name: `IMAGE_STORE`
   - KV namespace: `imagelink-storage`

## 주의사항

✅ Python 관련 파일 제거됨 (빌드 오류 방지)
✅ .cfignore로 불필요한 파일 제외
✅ npm ci 사용 (더 안정적인 의존성 설치)
✅ 모든 필수 파일 포함 확인

이제 Replit → GitHub → CloudFlare Pages 순서로 안정적으로 배포할 수 있습니다.