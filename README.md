# ImageLink - 이미지 호스팅 서비스

이미지를 업로드하고 짧은 URL로 공유할 수 있는 서비스입니다.

## 주요 기능

- **드래그 앤 드롭 업로드**: 웹 인터페이스에서 간편한 이미지 업로드
- **API 업로드**: 프로그래밍 방식으로 이미지 업로드 (form-data, Base64 JSON)
- **짧은 URL 생성**: 업로드된 이미지마다 고유한 짧은 URL 생성
- **자동 이미지 리사이즈**: 1024px보다 큰 이미지 자동 리사이즈 (비율 유지)
- **자동 삭제 시스템**: 설정한 일수 후 이미지 자동 삭제
- **관리자 설정**: 비밀번호 보호된 관리 인터페이스

## 기술 스택

### Frontend
- React 18 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS + shadcn/ui
- TanStack Query (데이터 페칭)
- Wouter (라우팅)

### Backend
- Node.js + Express
- TypeScript
- Sharp (이미지 처리)
- Multer (파일 업로드)
- Express Session (인증)

### 데이터베이스
- 메모리 스토리지 (개발용)
- 서버 재시작 시 기존 이미지 자동 로드

## 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

서버는 `http://localhost:5000`에서 실행됩니다.

## API 엔드포인트

### 이미지 업로드

#### 1. Form-data 업로드
```bash
curl -X POST -F "images=@image.jpg" http://localhost:5000/api/upload
```

#### 2. Base64 JSON 업로드
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"images":[{"data":"data:image/jpeg;base64,...","filename":"test.jpg","mimeType":"image/jpeg"}]}' \
  http://localhost:5000/api/upload-base64
```

### 이미지 접근
- 짧은 URL: `http://localhost:5000/i/{shortId}`
- 이미지 목록: `GET /api/images`

### 관리 기능 (인증 필요)
- 이미지 삭제: `DELETE /api/images/{id}`
- 만료일 설정: `PATCH /api/images/{id}/expiration`
- 만료된 이미지 정리: `POST /api/cleanup`

## 설정

### 관리자 비밀번호
기본 비밀번호: `admin123`

환경변수로 변경 가능:
```bash
export ADMIN_PASSWORD=your_password
```

### 이미지 리사이즈
- 1024px보다 큰 이미지는 자동으로 1024px 너비로 리사이즈
- 세로 비율은 자동으로 유지
- JPEG 85% 품질로 압축

### 자동 삭제
- 기본값: 5일 후 자동 삭제
- 설정 페이지에서 변경 가능 (1-365일)
- 각 이미지별로 업로드 시점부터 개별 계산

## 프로젝트 구조

```
├── client/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/     # UI 컴포넌트
│   │   ├── hooks/          # React 훅
│   │   ├── lib/            # 유틸리티
│   │   └── pages/          # 페이지 컴포넌트
│   └── index.html
├── server/                 # Express 백엔드
│   ├── index.ts           # 서버 진입점
│   ├── routes.ts          # API 라우트
│   ├── storage.ts         # 데이터 스토리지
│   └── replitAuth.ts      # 인증 시스템
├── shared/                # 공유 타입 정의
│   └── schema.ts
├── uploads/               # 업로드된 파일
└── package.json
```

## 라이센스

MIT License