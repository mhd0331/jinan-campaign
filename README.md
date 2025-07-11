# 진안군 목조전망대 반대 캠페인 앱

진안군 목조전망대 445억원 혈세낭비를 막기 위한 시민 캠페인 웹 애플리케이션입니다.

## 주요 기능

### 1. 홈 화면
- D-Day 카운터 (의회 표결일까지 남은 날짜)
- 실시간 서명 카운터 (자동 업데이트)
- 빠른 액션 버튼 (서명하기, 공유하기, 행동 아이디어)
- 최신 뉴스 표시
- 캠페인 현황 통계

### 2. 서명 기능
- 완전한 서명 폼 (이름, 지역, 연락처, 의견)
- 유효성 검사
- 로컬 스토리지에 저장
- 최근 서명자 목록 표시
- 서명 후 자동 공유 유도

### 3. 커뮤니티
- 게시글 작성 기능
- 카테고리별 필터링
- 해시태그 지원
- 게시글 목록 표시

### 4. 정보 탭
- 예산 시각화
- 과거 사례와 비교 차트
- 타임라인 표시

### 5. 투표/설문
- 실시간 투표 기능
- 투표 결과 표시
- 설문조사 참여 (5개 문항)

### 6. 추가 기능
- 오프라인 지원 (로컬 스토리지 활용)
- 알림 시스템
- 공유 기능 (Web Share API)
- 반응형 디자인
- 부드러운 애니메이션

## 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Backend**: Firebase (Firestore, Auth, Storage, FCM)
- **PWA**: Service Worker, Web App Manifest
- **Charts**: Chart.js
- **Offline**: LocalStorage, Cache API

## 프로젝트 구조

```
jinan-campaign/
├── index.html              # 메인 HTML 파일
├── manifest.json           # PWA 매니페스트
├── firebase-messaging-sw.js # FCM 서비스 워커
├── README.md              # 프로젝트 문서
│
├── css/
│   └── styles.css         # 메인 스타일시트
│
├── js/
│   ├── app.js            # 메인 JavaScript
│   ├── firebase-config.js # Firebase 설정
│   └── sw.js             # Service Worker
│
├── data/
│   └── db-structure.json  # 데이터베이스 구조
│
├── docs/
│   └── firebase-rules.txt # Firebase 보안 규칙
│
└── images/
    ├── icons/            # PWA 아이콘
    ├── screenshots/      # 앱 스크린샷
    └── og-image.jpg      # Open Graph 이미지
```

## 설치 및 실행

### 1. Firebase 프로젝트 설정
1. [Firebase Console](https://console.firebase.google.com)에서 새 프로젝트 생성
2. Authentication, Firestore, Storage, Hosting 활성화
3. 웹 앱 추가 및 설정 키 획득

### 2. 설정 파일 수정
```javascript
// js/firebase-config.js
const firebaseConfig = {
    apiKey: "실제_API_키",
    authDomain: "실제_AUTH_도메인",
    projectId: "실제_프로젝트_ID",
    storageBucket: "실제_스토리지_버킷",
    messagingSenderId: "실제_메시징_발신자_ID",
    appId: "실제_앱_ID"
};
```

### 3. Firebase 보안 규칙 적용
`docs/firebase-rules.txt` 파일의 내용을 Firebase Console에서 적용

### 4. 로컬 개발
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# 브라우저에서 접속
http://localhost:8000
```

### 5. Firebase 배포
```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 초기화
firebase init

# 배포
firebase deploy
```

## 사용 방법

1. **서명하기**
   - 서명 탭으로 이동 또는 "지금 서명하기" 버튼 클릭
   - 필수 항목 입력 (이름, 거주지, 개인정보 동의)
   - 선택 항목 입력 (연락처, 의견)
   - "서명 참여하기" 버튼 클릭

2. **커뮤니티 참여**
   - 커뮤니티 탭에서 게시글 확인
   - 우측 하단 ✏️ 버튼으로 새 글 작성
   - 해시태그 클릭으로 관련 게시글 필터링

3. **투표/설문 참여**
   - 투표 탭에서 진행중인 투표 확인
   - "설문 참여하기" 버튼으로 설문조사 시작
   - 5개 문항에 순차적으로 답변

## 오프라인 지원

- 모든 데이터는 브라우저의 로컬 스토리지에 저장
- 오프라인 상태에서도 서명 가능
- 온라인 복구 시 자동 동기화

## 보안 고려사항

- 개인정보는 해시 처리 후 저장
- IP 기반 중복 서명 방지
- Firebase Security Rules로 데이터 보호
- HTTPS 필수

## 라이선스

이 프로젝트는 시민 캠페인을 위한 공익 목적으로 제작되었습니다.

## 문의

캠페인 관련 문의는 진안군민 대표 연락처로 부탁드립니다.