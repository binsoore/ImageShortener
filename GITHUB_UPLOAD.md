# GitHub 업로드 방법

Git 제한으로 인해 수동으로 GitHub에 업로드해야 합니다.

## 방법 1: GitHub 웹 인터페이스 사용

1. https://github.com/binsoore/ImageShortener 접속
2. "uploading an existing file" 또는 "create new file" 사용
3. 아래 주요 파일들을 순서대로 업로드:

### 필수 파일 목록:
- `package.json`
- `README.md`
- `.gitignore`
- `tsconfig.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `components.json`
- `drizzle.config.ts`

### 디렉토리 구조로 업로드:
```
client/
├── index.html
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   ├── components/ui/ (모든 UI 컴포넌트들)
│   ├── hooks/
│   ├── lib/
│   └── pages/

server/
├── index.ts
├── routes.ts
├── storage.ts
├── vite.ts
└── replitAuth.ts

shared/
└── schema.ts

uploads/
└── .gitkeep
```

## 방법 2: Git Clone 후 복사

로컬에서:
```bash
git clone https://github.com/binsoore/ImageShortener.git
# 이 프로젝트의 모든 파일을 clone한 폴더로 복사
cd ImageShortener
git add .
git commit -m "Initial commit: ImageLink 이미지 호스팅 서비스"
git push origin main
```

## 환경 변수

배포 시 설정할 환경 변수:
```
ADMIN_PASSWORD=your_secure_password
NODE_ENV=production
SESSION_SECRET=your_session_secret
```