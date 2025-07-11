// shared/firebase-config.js
/**
 * Firebase 공통 설정 파일
 * 프론트엔드와 관리자 패널에서 공통으로 사용
 */

// Firebase 설정 (환경변수 또는 직접 입력)
const firebaseConfig = {
    apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "jinan-campaign.firebaseapp.com",
    projectId: "jinan-campaign",
    storageBucket: "jinan-campaign.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxxxxxxxxxxxxx",
    measurementId: "G-XXXXXXXXXX"
};

// 공통 상수
const CONSTANTS = {
    CAMPAIGN_ID: 'jinan-wooden-tower',
    TARGET_SIGNATURES: 10000,
    
    REGIONS: [
        '진안읍', '마령면', '백운면', '성수면', 
        '동향면', '용담면', '정천면', '주천면',
        '안천면', '부귀면', '상전면'
    ],
    
    POST_CATEGORIES: [
        '공지사항', '자유토론', '긴급제보', 
        '아이디어', '활동인증', 'Q&A', '의회소식'
    ],
    
    POLL_TYPES: ['single', 'multiple', 'discussion'],
    
    USER_ROLES: {
        USER: 'user',
        MODERATOR: 'moderator',
        ADMIN: 'admin'
    }
};

// 환경별 설정
const ENV_CONFIG = {
    production: {
        useEmulator: false,
        apiUrl: 'https://asia-northeast3-jinan-campaign.cloudfunctions.net/api',
        frontendUrl: 'https://jinan-campaign.web.app',
        adminUrl: 'https://jinan-campaign-admin.web.app'
    },
    development: {
        useEmulator: true,
        apiUrl: 'http://localhost:5001/jinan-campaign/asia-northeast3/api',
        frontendUrl: 'http://localhost:3000',
        adminUrl: 'http://localhost:3001'
    }
};

// 현재 환경
const currentEnv = process.env.NODE_ENV || 'production';
const envConfig = ENV_CONFIG[currentEnv];

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig, CONSTANTS, envConfig };
} else {
    window.firebaseConfig = firebaseConfig;
    window.CONSTANTS = CONSTANTS;
    window.envConfig = envConfig;
}