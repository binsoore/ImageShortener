# ImageLink API 문서

이 문서는 ImageLink 서비스의 API 사용법을 설명합니다.

## API 엔드포인트

### 1. 파일 업로드 (Form Data)

**POST** `/api/upload`

**Content-Type:** `multipart/form-data`

**Parameters:**
- `images`: 업로드할 이미지 파일들 (최대 10개)

**Example using curl:**
```bash
curl -X POST \
  -F "images=@image1.jpg" \
  -F "images=@image2.png" \
  http://localhost:5000/api/upload
```

**Response:**
```json
{
  "images": [
    {
      "id": 1,
      "filename": "images-1640995200000-123456789.jpg",
      "originalName": "image1.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "shortId": "abc12345",
      "filePath": "/uploads/images-1640995200000-123456789.jpg",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Base64 업로드 (JSON)

**POST** `/api/upload-base64`

**Content-Type:** `application/json`

**Request Body:**
```json
{
  "images": [
    {
      "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "filename": "image1.jpg",
      "mimeType": "image/jpeg"
    }
  ]
}
```

**Example using curl:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      {
        "data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
        "filename": "test.jpg", 
        "mimeType": "image/jpeg"
      }
    ]
  }' \
  http://localhost:5000/api/upload-base64
```

**Response:**
```json
{
  "images": [
    {
      "id": 1,
      "filename": "api-1640995200000-123456789.jpg",
      "originalName": "test.jpg",
      "mimeType": "image/jpeg", 
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "shortId": "abc12345",
      "filePath": "/uploads/api-1640995200000-123456789.jpg",
      "uploadedAt": "2024-01-01T00:00:00.000Z",
      "shortUrl": "http://localhost:5000/i/abc12345"
    }
  ]
}
```

### 3. 이미지 목록 조회

**GET** `/api/images`

**Response:**
```json
{
  "images": [
    {
      "id": 1,
      "filename": "images-1640995200000-123456789.jpg",
      "originalName": "image1.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "width": 1920,
      "height": 1080,
      "shortId": "abc12345",
      "filePath": "/uploads/images-1640995200000-123456789.jpg",
      "uploadedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 4. 이미지 접근 (단축 URL)

**GET** `/i/{shortId}`

이미지 파일을 직접 반환합니다.

**Example:**
```
http://localhost:5000/i/abc12345
```

### 5. 이미지 메타데이터 조회

**GET** `/api/images/{shortId}`

**Response:**
```json
{
  "image": {
    "id": 1,
    "filename": "images-1640995200000-123456789.jpg",
    "originalName": "image1.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "width": 1920,
    "height": 1080,
    "shortId": "abc12345",
    "filePath": "/uploads/images-1640995200000-123456789.jpg",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "shortUrl": "http://localhost:5000/i/abc12345"
  }
}
```

### 6. 이미지 삭제

**DELETE** `/api/images/{id}`

**Response:**
```json
{
  "message": "Image deleted successfully"
}
```

## 지원되는 이미지 형식

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)

## 제한사항

- 최대 파일 크기: 10MB
- 동시 업로드 최대 개수: 10개

## 에러 응답

모든 에러는 다음 형식으로 반환됩니다:

```json
{
  "message": "에러 메시지"
}
```

**일반적인 에러 코드:**
- `400`: 잘못된 요청 (파일 없음, 잘못된 형식 등)
- `404`: 이미지를 찾을 수 없음
- `500`: 서버 내부 오류

## JavaScript 예제

### Form Data로 업로드

```javascript
const formData = new FormData();
formData.append('images', fileInput.files[0]);

fetch('/api/upload', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => {
  console.log('업로드 성공:', data.images);
});
```

### Base64로 업로드

```javascript
const reader = new FileReader();
reader.onload = function(e) {
  const base64Data = e.target.result;
  
  fetch('/api/upload-base64', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      images: [{
        data: base64Data,
        filename: file.name,
        mimeType: file.type
      }]
    })
  })
  .then(response => response.json())
  .then(data => {
    console.log('업로드 성공:', data.images);
  });
};
reader.readAsDataURL(file);
```