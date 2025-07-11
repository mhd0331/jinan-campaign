/**
 * 진안군 목조전망대 반대 캠페인 앱 - Firebase 설정
 */

// Firebase 설정 (실제 값으로 교체 필요)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Firebase 서비스 클래스
class FirebaseService {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.messaging = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🔥 Firebase 초기화 시작...');

            // Firebase 앱 초기화
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(firebaseConfig);
            } else {
                this.app = firebase.app();
            }

            // Firestore 초기화
            this.db = firebase.firestore();
            
            // 오프라인 지원 활성화
            this.db.enablePersistence({ synchronizeTabs: true })
                .catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn('여러 탭이 열려있어 오프라인 지원이 제한됩니다.');
                    } else if (err.code === 'unimplemented') {
                        console.warn('브라우저가 오프라인 지원을 하지 않습니다.');
                    }
                });

            // Authentication 초기화
            this.auth = firebase.auth();
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

            // Storage 초기화
            this.storage = firebase.storage();

            // Messaging 초기화 (HTTPS에서만)
            if (location.protocol === 'https:' && 'serviceWorker' in navigator) {
                this.messaging = firebase.messaging();
            }

            this.isInitialized = true;
            console.log('✅ Firebase 초기화 완료');

        } catch (error) {
            console.error('❌ Firebase 초기화 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Authentication
    // ==========================================================================

    async signInAnonymously() {
        try {
            const result = await this.auth.signInAnonymously();
            console.log('익명 로그인 성공:', result.user.uid);
            return result.user;
        } catch (error) {
            console.error('익명 로그인 실패:', error);
            throw error;
        }
    }

    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }

    // ==========================================================================
    // Firestore - 캠페인 데이터
    // ==========================================================================

    async getCampaignData(campaignId) {
        try {
            const doc = await this.db.collection('campaigns').doc(campaignId).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error('캠페인 데이터 조회 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Firestore - 서명
    // ==========================================================================

    async submitSignature(signatureData) {
        try {
            // IP 해시 생성
            const ipHash = await this.hashString(this.getClientIP());
            
            // 중복 체크
            const duplicate = await this.checkDuplicateSignature(signatureData.campaignId, ipHash);
            if (duplicate) {
                throw new Error('이미 서명에 참여하셨습니다.');
            }

            // 서명 데이터 준비
            const signature = {
                ...signatureData,
                ipHash: ipHash,
                phoneHash: signatureData.phone ? await this.hashString(signatureData.phone) : null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                verificationStatus: 'pending'
            };

            // 개인정보 제거
            delete signature.phone;
            delete signature.email;

            // Firestore에 저장
            const docRef = await this.db.collection('signatures').add(signature);

            // 캠페인 카운터 업데이트
            await this.db.collection('campaigns').doc(signatureData.campaignId).update({
                currentSignatures: firebase.firestore.FieldValue.increment(1)
            });

            console.log('✅ 서명 제출 성공:', docRef.id);
            return docRef.id;

        } catch (error) {
            console.error('❌ 서명 제출 실패:', error);
            throw error;
        }
    }

    async checkDuplicateSignature(campaignId, ipHash) {
        const query = this.db.collection('signatures')
            .where('campaignId', '==', campaignId)
            .where('ipHash', '==', ipHash)
            .limit(1);

        const snapshot = await query.get();
        return !snapshot.empty;
    }

    onSignatureCountChange(campaignId, callback) {
        return this.db.collection('campaigns').doc(campaignId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback(doc.data().currentSignatures || 0);
                }
            });
    }

    // ==========================================================================
    // Firestore - 게시글
    // ==========================================================================

    async createPost(postData) {
        try {
            const post = {
                ...postData,
                authorId: this.getCurrentUser()?.uid || 'anonymous',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reactions: { like: 0, love: 0, angry: 0, sad: 0 },
                viewCount: 0,
                commentCount: 0,
                isActive: true
            };

            const docRef = await this.db.collection('posts').add(post);
            console.log('✅ 게시글 작성 성공:', docRef.id);
            return docRef.id;

        } catch (error) {
            console.error('❌ 게시글 작성 실패:', error);
            throw error;
        }
    }

    async getPosts(category = null, limit = 20) {
        let query = this.db.collection('posts')
            .where('isActive', '==', true)
            .orderBy('createdAt', 'desc');

        if (category && category !== '전체') {
            query = query.where('category', '==', category);
        }

        query = query.limit(limit);

        const snapshot = await query.get();
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    }

    onPostsChange(category, callback) {
        let query = this.db.collection('posts')
            .where('isActive', '==', true)
            .orderBy('createdAt', 'desc');

        if (category && category !== '전체') {
            query = query.where('category', '==', category);
        }

        return query.onSnapshot((snapshot) => {
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(posts);
        });
    }

    // ==========================================================================
    // Firestore - 투표
    // ==========================================================================

    async submitVote(pollId, selectedOptions) {
        try {
            const userId = this.getCurrentUser()?.uid || this.getAnonymousId();
            
            // 중복 투표 체크
            const existingVote = await this.db.collection('poll_votes')
                .where('pollId', '==', pollId)
                .where('userId', '==', userId)
                .get();

            if (!existingVote.empty) {
                throw new Error('이미 투표에 참여하셨습니다.');
            }

            // 투표 저장
            await this.db.collection('poll_votes').add({
                pollId: pollId,
                userId: userId,
                selectedOptions: selectedOptions,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 투표 수 업데이트
            const pollRef = this.db.collection('polls').doc(pollId);
            const batch = this.db.batch();

            selectedOptions.forEach(optionId => {
                batch.update(pollRef, {
                    [`options.${optionId}.votes`]: firebase.firestore.FieldValue.increment(1),
                    totalVotes: firebase.firestore.FieldValue.increment(1)
                });
            });

            await batch.commit();
            console.log('✅ 투표 제출 성공');

        } catch (error) {
            console.error('❌ 투표 제출 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Storage
    // ==========================================================================

    async uploadImage(file, folder = 'images') {
        try {
            const fileName = `${folder}/${Date.now()}_${file.name}`;
            const storageRef = this.storage.ref().child(fileName);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log('✅ 이미지 업로드 성공:', downloadURL);
            return downloadURL;

        } catch (error) {
            console.error('❌ 이미지 업로드 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Utilities
    // ==========================================================================

    async hashString(str) {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    getClientIP() {
        // 실제 구현에서는 서버 API를 통해 IP를 가져와야 함
        return '127.0.0.1';
    }

    getAnonymousId() {
        let anonymousId = localStorage.getItem('anonymous_id');
        if (!anonymousId) {
            anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anonymous_id', anonymousId);
        }
        return anonymousId;
    }
}

// ==========================================================================
// Firestore Security Rules (참고용)
// ==========================================================================

const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 캠페인 정보 (읽기 전용)
    match /campaigns/{campaignId} {
      allow read: if true;
      allow write: if false;
    }
    
    // 서명 데이터 (생성만 허용)
    match /signatures/{signatureId} {
      allow create: if request.resource.data.keys().hasAll(['name', 'region', 'campaignId']) &&
                      request.resource.data.name is string &&
                      request.resource.data.region is string;
      allow read: if resource.data.isPublic == true;
      allow update, delete: if false;
    }
    
    // 사용자 프로필
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 게시글
    match /posts/{postId} {
      allow read: if resource.data.isActive == true;
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
                      (request.auth.uid == resource.data.authorId || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isModerator == true);
      allow delete: if false;
    }
    
    // 투표
    match /poll_votes/{voteId} {
      allow create: if request.auth != null;
      allow read: if false;
      allow update, delete: if false;
    }
  }
}
`;

// 전역 서비스 인스턴스
const firebaseService = new FirebaseService();

// 앱 로드시 자동 초기화
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await firebaseService.initialize();
        
        // 익명 로그인
        if (!firebaseService.getCurrentUser()) {
            await firebaseService.signInAnonymously();
        }
        
        console.log('🚀 Firebase 서비스 준비 완료');
    } catch (error) {
        console.error('❌ Firebase 서비스 초기화 실패:', error);
    }
});

// 전역 접근을 위해 window에 추가
window.firebaseService = firebaseService;