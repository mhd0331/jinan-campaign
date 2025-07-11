# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `jinan-campaign` 입력
4. Google Analytics 활성화 (선택사항)

### 1.2 필요한 서비스 활성화
- **Authentication** (인증)
- **Cloud Firestore** (데이터베이스)
- **Storage** (파일 저장소)
- **Hosting** (웹 호스팅)
- **Functions** (서버리스 함수)
- **Cloud Messaging** (푸시 알림)

## 2. Authentication 설정

### 2.1 로그인 방법 설정
1. Authentication > Sign-in method
2. 다음 제공업체 활성화:
   - 이메일/비밀번호
   - 익명

### 2.2 승인된 도메인 추가
1. Authentication > Settings > Authorized domains
2. 추가할 도메인:
   - `jinan-campaign.web.app`
   - `jinan-campaign-admin.web.app`
   - `localhost` (개발용)

## 3. Firestore 설정

### 3.1 데이터베이스 생성
1. Firestore Database > 데이터베이스 만들기
2. 프로덕션 모드로 시작
3. 위치: `asia-northeast3` (서울)

### 3.2 보안 규칙 적용
1. Firestore Database > 규칙
2. `firestore.rules` 파일 내용 복사하여 붙여넣기
3. "게시" 클릭

### 3.3 인덱스 생성
1. Firestore Database > 색인
2. `firestore.indexes.json` 파일의 인덱스 수동 생성 또는:
```bash
firebase deploy --only firestore:indexes
```

### 3.4 초기 데이터 생성
```javascript
// 캠페인 문서 생성
db.collection('campaigns').doc('jinan-wooden-tower').set({
  title: '진안군 목조전망대 반대 캠페인',
  description: '445억원 혈세낭비를 막기 위한 시민 캠페인',
  targetSignatures: 10000,
  currentSignatures: 0,
  startDate: new Date('2024-12-01'),
  endDate: new Date('2024-12-31'),
  voteDate: new Date('2024-12-20'),
  status: 'active',
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});

// 관리자 계정 생성
// 1. Authentication에서 사용자 생성
// 2. users 컬렉션에 관리자 문서 생성
db.collection('users').doc('ADMIN_UID').set({
  email: 'admin@jinan.kr',
  displayName: '관리자',
  isAdmin: true,
  isModerator: true,
  isActive: true,
  createdAt: firebase.firestore.FieldValue.serverTimestamp()
});
```

## 4. Storage 설정

### 4.1 보안 규칙 적용
1. Storage > Rules
2. `storage.rules` 파일 내용 복사하여 붙여넣기

### 4.2 CORS 설정
```json
// cors.json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
gsutil cors set cors.json gs://jinan-campaign.appspot.com
```

## 5. Hosting 설정

### 5.1 사이트 추가
1. Hosting > 사이트 추가
2. 사이트 생성:
   - `jinan-campaign` (프론트엔드)
   - `jinan-campaign-admin` (관리자)

### 5.2 커스텀 도메인 (선택사항)
1. 각 사이트에서 "커스텀 도메인 추가"
2. DNS 레코드 설정 안내 따르기

## 6. Functions 설정

### 6.1 Functions 초기화
```bash
cd functions
npm install
```

### 6.2 환경 변수 설정
```bash
firebase functions:config:set \
  admin.email="admin@jinan.kr" \
  smtp.host="smtp.gmail.com" \
  smtp.port="587" \
  smtp.user="your-email@gmail.com" \
  smtp.pass="your-app-password"
```

### 6.3 서비스 계정 키 생성
1. 프로젝트 설정 > 서비스 계정
2. "새 비공개 키 생성" 클릭
3. `serviceAccountKey.json`으로 저장
4. `functions/` 폴더에 복사

## 7. Cloud Messaging 설정

### 7.1 웹 푸시 인증서
1. 프로젝트 설정 > 클라우드 메시징
2. 웹 구성 > 웹 푸시 인증서 생성
3. VAPID 키 복사하여 저장

### 7.2 서버 키
1. 프로젝트 설정 > 클라우드 메시징
2. 서버 키 복사하여 저장

## 8. 환경 변수 설정

### 8.1 로컬 개발
1. `.env.example`을 `.env`로 복사
2. 실제 값 입력:
```bash
cp .env.example .env
# .env 파일 편집
```

### 8.2 프로덕션
1. GitHub Secrets 또는 CI/CD 환경 변수로 설정
2. Firebase Functions 환경 변수 설정

## 9. 배포

### 9.1 Firebase CLI 설치
```bash
npm install -g firebase-tools
firebase login
```

### 9.2 프로젝트 초기화
```bash
firebase use --add
# jinan-campaign 선택
```

### 9.3 전체 배포
```bash
npm run deploy
```

### 9.4 개별 배포
```bash
# Firestore 규칙만
firebase deploy --only firestore:rules

# Storage 규칙만
firebase deploy --only storage:rules

# Functions만
firebase deploy --only functions

# 프론트엔드만
firebase deploy --only hosting:frontend

# 관리자 패널만
firebase deploy --only hosting:admin
```

## 10. 모니터링 및 유지보수

### 10.1 Firebase Console 모니터링
- **사용량**: 프로젝트 설정 > 사용량 및 청구
- **성능**: Performance Monitoring
- **오류**: Crashlytics

### 10.2 일일 체크리스트
- [ ] Firestore 사용량 확인
- [ ] Storage 사용량 확인
- [ ] Functions 실행 로그 확인
- [ ] 오류 로그 확인

### 10.3 백업
```bash
# Firestore 백업
gcloud firestore export gs://jinan-campaign-backups/$(date +%Y%m%d)

# 자동 백업 설정 (Cloud Scheduler)
```

## 11. 보안 체크리스트

- [ ] 모든 API 키를 환경 변수로 관리
- [ ] Firestore 보안 규칙 검토
- [ ] Storage 보안 규칙 검토
- [ ] 관리자 계정 2FA 활성화
- [ ] HTTPS 강제 적용
- [ ] CORS 정책 설정
- [ ] Rate Limiting 구현
- [ ] 민감한 데이터 암호화

## 12. 문제 해결

### 12.1 일반적인 오류

**CORS 오류**
```javascript
// Functions에서 CORS 설정
const cors = require('cors')({ origin: true });
```

**권한 오류**
- Firestore 규칙 확인
- 서비스 계정 권한 확인

**배포 실패**
```bash
# 캐시 정리
firebase hosting:disable
firebase hosting:enable
```

### 12.2 성능 최적화
- Firestore 복합 쿼리 최적화
- Storage 이미지 리사이징
- Functions 콜드 스타트 최소화
- CDN 캐싱 활용

## 13. 참고 자료

- [Firebase 공식 문서](https://firebase.google.com/docs)
- [Firestore 보안 규칙 가이드](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase 성능 최적화](https://firebase.google.com/docs/firestore/best-practices)
- [Firebase 가격 계산기](https://firebase.google.com/pricing)