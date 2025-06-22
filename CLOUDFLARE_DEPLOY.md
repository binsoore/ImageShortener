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
4. 생성된 네임스페이스 ID 복사

### 2. wrangler.toml 설정

`wrangler.toml` 파일에서 KV 네임스페이스 ID를 실제 값으로 교체:

```toml
[env.production]
kv_namespaces = [
  { binding = "IMAGE_STORE", id = "실제-kv-네임스페이스-id" }
]
```

### 3. CloudFlare Pages 프로젝트 생성

1. CloudFlare 대시보드 > Pages
2. "Create a project" 클릭
3. GitHub 연결 및 리포지토리 선택
4. Build settings:
   - Framework preset: `None`
   - Build command: `npm run build:cloudflare`
   - Build output directory: `dist`
   - Root directory: `/` (루트)

### 4. 환경 변수 설정

Pages 프로젝트 설정에서:
1. Settings > Environment variables
2. Production 환경에 다음 추가:
   - `NODE_VERSION`: `18`

### 5. Functions 바인딩 설정

Pages 프로젝트 설정에서:
1. Settings > Functions
2. KV namespace bindings 추가:
   - Variable name: `IMAGE_STORE`
   - KV namespace: 앞서 생성한 네임스페이스 선택

## 배포 후 확인사항

1. 이미지 업로드 테스트
2. 단축 URL 동작 확인
3. 관리자 로그인 테스트 (비밀번호: admin123)
4. 이미지 만료 기능 확인

## 주요 특징

- 서버리스 아키텍처로 변환
- CloudFlare KV를 이용한 이미지 저장
- 자동 이미지 만료 처리
- 정적 파일 배포

## 트러블슈팅

### 함수가 작동하지 않는 경우
- KV 바인딩이 올바르게 설정되었는지 확인
- wrangler.toml의 네임스페이스 ID 확인

### 이미지 업로드 실패
- KV 저장소 용량 확인
- 파일 크기 제한 (CloudFlare 기본: 25MB)

### 빌드 오류
- Node.js 버전 확인 (18 이상 권장)
- 의존성 설치 상태 확인