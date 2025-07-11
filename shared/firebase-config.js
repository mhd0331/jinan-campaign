/**
 * 공통 Firebase 설정
 */

// 환경별 설정
const configs = {
  production: {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
  },
  development: {
    // 개발 환경 설정
  }
};

export const firebaseConfig = configs[process.env.NODE_ENV || 'production'];

// 공통 초기화 함수
export function initializeFirebase() {
  if (!firebase.apps.length) {
    return firebase.initializeApp(firebaseConfig);
  }
  return firebase.app();
}