# CloudFlare Pages 배포 문제 해결

## 발생한 오류들

### 1. Workers 명령어 오류
```
It looks like you've run a Workers-specific command in a Pages project.
For Pages, please run `wrangler pages deploy` instead.
```

### 2. Wrangler CLI 누락 오류
```
/bin/sh: 1: wrangler: not found
Failed: error occurred while running deploy command
```

## 올바른 배포 명령어

### 1. 첫 배포 (프로젝트 생성)
```bash
wrangler pages deploy dist --project-name imagelink
```

### 2. 기존 프로젝트 업데이트
```bash
wrangler pages deploy dist
```

### 3. 환경별 배포
```bash
# Production 환경
wrangler pages deploy dist --env production

# Preview 환경  
wrangler pages deploy dist --env preview
```

## 전체 배포 과정

### 1. 빌드 준비
```bash
# 정적 파일 빌드
npx vite build --outDir dist

# 필수 파일 복사
cp _redirects dist/
cp -r functions dist/
```

### 2. 배포 실행
```bash
# Wrangler 로그인 (최초 1회)
wrangler login

# 배포
wrangler pages deploy dist --project-name imagelink
```

### 3. KV 바인딩 설정
CloudFlare 대시보드에서:
1. Pages 프로젝트 > Settings > Functions
2. KV namespace bindings 추가:
   - Variable: `IMAGE_STORE`
   - Namespace: `imagelink-storage`

## 권장 해결 방법: GitHub 연동

CloudFlare Pages 빌드 환경에 wrangler가 없으므로 GitHub 연동 사용:

1. GitHub 리포지토리에 코드 업로드
2. CloudFlare Pages에서 GitHub 연결
3. 빌드 명령어: `npm ci && npx vite build --outDir dist && cp _redirects dist/ && cp -r functions dist/`
4. KV 바인딩은 대시보드에서 설정

## 참고사항

- `wrangler.toml` 파일은 Pages에서 KV 바인딩 설정용이 아님
- KV 바인딩은 CloudFlare 대시보드에서 수동 설정 필요
- Workers와 Pages는 다른 배포 명령어 사용
- GitHub 연동이 가장 안정적인 배포 방법