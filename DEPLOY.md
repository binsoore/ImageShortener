# GitHub 배포 가이드

이 프로젝트를 GitHub에 업로드하는 방법:

## 방법 1: 압축 파일 업로드

1. `ImageShortener.tar.gz` 파일을 다운로드
2. 로컬에서 압축 해제: `tar -xzf ImageShortener.tar.gz`
3. GitHub에서 새 저장소 생성: https://github.com/binsoore/ImageShortener
4. 로컬에서 Git 설정:

```bash
cd ImageShortener
git init
git add .
git commit -m "Initial commit: ImageLink 이미지 호스팅 서비스"
git branch -M main
git remote add origin https://github.com/binsoore/ImageShortener.git
git push -u origin main
```

## 방법 2: 수동 파일 복사

GitHub에서 파일을 하나씩 업로드하거나 GitHub Desktop을 사용하여 업로드

## 주요 파일

- `README.md`: 프로젝트 설명서
- `package.json`: 의존성 정보
- `client/`: React 프론트엔드
- `server/`: Express 백엔드
- `shared/`: 공유 타입 정의

## 환경 변수 설정

GitHub에서 배포할 때 다음 환경 변수를 설정하세요:

```
ADMIN_PASSWORD=your_secure_password
NODE_ENV=production
```