# 진안 캠페인 관리자 CMS

진안군 목조전망대 반대 캠페인을 위한 관리자 대시보드 시스템입니다.

## 기능

- **대시보드**: 실시간 통계 및 차트
- **캠페인 관리**: 캠페인 정보 CRUD
- **서명 관리**: 서명 확인/거부, 필터링, 내보내기
- **사용자 관리**: 권한 관리, 사용자 정보 수정
- **게시글/댓글 관리**: 커뮤니티 콘텐츠 관리
- **투표 관리**: 투표 생성 및 결과 분석
- **알림 시스템**: 대상별 알림 발송
- **통계 분석**: 다양한 통계 데이터 시각화

## 설치 방법

### 1. 프로젝트 클론
```bash
git clone https://github.com/your-repo/jinan-campaign-admin.git
cd jinan-campaign-admin
```

### 2. 의존성 설치
```bash
npm install
```

### 3. Firebase 설정
1. `.env.example`을 `.env`로 복사
2. Firebase 프로젝트 생성 및 설정값 입력
3. Firebase Admin SDK 서비스 계정 키 다운로드

### 4. 환경 변수 설정
```bash
# .env 파일
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
ADMIN_EMAIL=admin@jinan.kr
```

### 5. 개발 서버 실행
```bash
npm start
# 또는
npm run dev
```

## 배포

### Firebase Hosting 배포
```bash
firebase login
firebase init hosting
firebase deploy
```

## 보안 설정

### 1. 관리자 인증
- Firebase Authentication으로 관리자만 접근 가능
- 이중 인증(2FA) 권장

### 2. Firestore 보안 규칙
```javascript
// 관리자만 읽기/쓰기 가능
match /{document=**} {
  allow read, write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
}
```

### 3. CORS 설정
관리자 도메인에서만 접근 가능하도록 설정

## 사용법

### 1. 로그인
- 관리자 이메일/비밀번호로 로그인
- 첫 로그인 시 비밀번호 변경 필수

### 2. 대시보드
- 주요 지표 확인
- 실시간 업데이트
- 차트 분석

### 3. 데이터 관리
- 각 메뉴에서 CRUD 작업 수행
- 필터링 및 검색 기능 활용
- 엑셀 내보내기로 보고서 생성

## 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Charts**: Chart.js
- **Backend**: Firebase (Firestore, Auth, Functions)
- **Export**: xlsx.js
- **Hosting**: Firebase Hosting

## 문제 해결

### 로그인 안 됨
1. Firebase 콘솔에서 Authentication 활성화 확인
2. 관리자 계정 생성 여부 확인
3. 네트워크 연결 상태 확인

### 데이터 로드 안 됨
1. Firestore 보안 규칙 확인
2. 인덱스 생성 여부 확인
3. 콘솔 에러 메시지 확인

### 차트 표시 안 됨
1. Chart.js 라이브러리 로드 확인
2. 데이터 형식 확인
3. Canvas 요소 존재 확인

## 라이선스

MIT License

## 문의

진안캠페인팀 - admin@jinan-campaign.kr