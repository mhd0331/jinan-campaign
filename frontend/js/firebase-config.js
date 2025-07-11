// frontend/js/firebase-service.js
/**
 * 진안 캠페인 프론트엔드 - Firebase 서비스
 */

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
            try {
                await this.db.enablePersistence({ synchronizeTabs: true });
            } catch (err) {
                if (err.code === 'failed-precondition') {
                    console.warn('오프라인 지원 제한: 여러 탭이 열려있습니다.');
                } else if (err.code === 'unimplemented') {
                    console.warn('브라우저가 오프라인 지원을 하지 않습니다.');
                }
            }

            // Authentication 초기화
            this.auth = firebase.auth();
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

            // Storage 초기화
            this.storage = firebase.storage();

            // Messaging 초기화 (HTTPS에서만)
            if (location.protocol === 'https:' && 'serviceWorker' in navigator) {
                this.messaging = firebase.messaging();
                await this.initializeMessaging();
            }

            // 에뮬레이터 연결 (개발 환경)
            if (envConfig.useEmulator) {
                this.connectToEmulators();
            }

            this.isInitialized = true;
            console.log('✅ Firebase 초기화 완료');

        } catch (error) {
            console.error('❌ Firebase 초기화 실패:', error);
            throw error;
        }
    }

    connectToEmulators() {
        console.log('🔧 에뮬레이터 연결 중...');
        
        // Firestore 에뮬레이터
        this.db.useEmulator('localhost', 8080);
        
        // Auth 에뮬레이터
        this.auth.useEmulator('http://localhost:9099');
        
        // Storage 에뮬레이터
        this.storage.useEmulator('localhost', 9199);
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

    async signInWithEmail(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            return result.user;
        } catch (error) {
            console.error('이메일 로그인 실패:', error);
            throw error;
        }
    }

    async signUp(email, password, displayName) {
        try {
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            
            // 프로필 업데이트
            await result.user.updateProfile({ displayName });
            
            // Firestore에 사용자 문서 생성
            await this.createUserDocument(result.user);
            
            return result.user;
        } catch (error) {
            console.error('회원가입 실패:', error);
            throw error;
        }
    }

    async createUserDocument(user) {
        const userDoc = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '익명',
            photoURL: user.photoURL || null,
            region: '',
            level: 1,
            points: 0,
            totalPosts: 0,
            totalComments: 0,
            isAdmin: false,
            isModerator: false,
            isActive: true,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        };

        await this.db.collection('users').doc(user.uid).set(userDoc);
    }

    async signOut() {
        try {
            await this.auth.signOut();
            console.log('로그아웃 완료');
        } catch (error) {
            console.error('로그아웃 실패:', error);
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
    // Firestore - 캠페인
    // ==========================================================================

    async getCampaignData(campaignId) {
        try {
            const doc = await this.db.collection('campaigns').doc(campaignId).get();
            
            if (!doc.exists) {
                throw new Error('캠페인을 찾을 수 없습니다.');
            }
            
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error('캠페인 데이터 조회 실패:', error);
            throw error;
        }
    }

    onCampaignChange(campaignId, callback) {
        return this.db.collection('campaigns').doc(campaignId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    callback({ id: doc.id, ...doc.data() });
                }
            }, (error) => {
                console.error('캠페인 실시간 업데이트 오류:', error);
            });
    }

    // ==========================================================================
    // Firestore - 서명
    // ==========================================================================

    async submitSignature(signatureData) {
        try {
            // IP 해시 생성
            const ipHash = await this.hashString(await this.getClientIP());
            
            // 중복 체크
            const duplicate = await this.checkDuplicateSignature(signatureData.campaignId, ipHash);
            if (duplicate) {
                throw new Error('이미 서명에 참여하셨습니다.');
            }

            // 서명 데이터 준비
            const signature = {
                name: signatureData.name,
                region: signatureData.region,
                comment: signatureData.comment || '',
                isPublic: signatureData.isPublic || false,
                allowContact: signatureData.allowContact || false,
                agreePrivacy: signatureData.agreePrivacy,
                campaignId: signatureData.campaignId,
                ipHash: ipHash,
                phoneHash: signatureData.phone ? await this.hashString(signatureData.phone) : null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                verificationStatus: 'pending'
            };

            // Firestore에 저장
            const batch = this.db.batch();
            
            // 서명 추가
            const signatureRef = this.db.collection('signatures').doc();
            batch.set(signatureRef, signature);
            
            // 캠페인 카운터 업데이트
            const campaignRef = this.db.collection('campaigns').doc(signatureData.campaignId);
            batch.update(campaignRef, {
                currentSignatures: firebase.firestore.FieldValue.increment(1),
                lastSignatureAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            await batch.commit();

            console.log('✅ 서명 제출 성공:', signatureRef.id);
            return signatureRef.id;

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

    async getRecentSignatures(campaignId, limit = 10) {
        try {
            const query = this.db.collection('signatures')
                .where('campaignId', '==', campaignId)
                .where('isPublic', '==', true)
                .orderBy('timestamp', 'desc')
                .limit(limit);

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('최근 서명 조회 실패:', error);
            return [];
        }
    }

    onSignatureCountChange(campaignId, callback) {
        return this.db.collection('campaigns').doc(campaignId)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    const data = doc.data();
                    callback(data.currentSignatures || 0);
                }
            });
    }

    // ==========================================================================
    // Firestore - 게시글
    // ==========================================================================

    async createPost(postData) {
        try {
            const user = this.getCurrentUser();
            
            const post = {
                title: postData.title,
                content: postData.content,
                category: postData.category,
                hashtags: postData.hashtags || [],
                authorId: user?.uid || 'anonymous',
                authorName: postData.authorName || '익명',
                region: postData.region || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reactions: { like: 0, love: 0, angry: 0, sad: 0 },
                viewCount: 0,
                commentCount: 0,
                isActive: true,
                isPinned: false
            };

            const docRef = await this.db.collection('posts').add(post);
            console.log('✅ 게시글 작성 성공:', docRef.id);
            return docRef.id;

        } catch (error) {
            console.error('❌ 게시글 작성 실패:', error);
            throw error;
        }
    }

    async getPosts(category = null, limit = 20, startAfter = null) {
        try {
            let query = this.db.collection('posts')
                .where('isActive', '==', true)
                .orderBy('createdAt', 'desc');

            if (category && category !== '전체') {
                query = query.where('category', '==', category);
            }

            if (startAfter) {
                query = query.startAfter(startAfter);
            }

            query = query.limit(limit);

            const snapshot = await query.get();
            const posts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return {
                posts: posts,
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
            };
        } catch (error) {
            console.error('게시글 조회 실패:', error);
            return { posts: [], lastDoc: null };
        }
    }

    async updatePostReaction(postId, reactionType) {
        try {
            const postRef = this.db.collection('posts').doc(postId);
            await postRef.update({
                [`reactions.${reactionType}`]: firebase.firestore.FieldValue.increment(1)
            });
        } catch (error) {
            console.error('반응 업데이트 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Firestore - 댓글
    // ==========================================================================

    async createComment(postId, commentData) {
        try {
            const user = this.getCurrentUser();
            
            const comment = {
                postId: postId,
                content: commentData.content,
                authorId: user?.uid || 'anonymous',
                authorName: commentData.authorName || '익명',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                likes: 0,
                isActive: true
            };

            const batch = this.db.batch();
            
            // 댓글 추가
            const commentRef = this.db.collection('comments').doc();
            batch.set(commentRef, comment);
            
            // 게시글 댓글 수 증가
            const postRef = this.db.collection('posts').doc(postId);
            batch.update(postRef, {
                commentCount: firebase.firestore.FieldValue.increment(1)
            });
            
            await batch.commit();
            
            return commentRef.id;
        } catch (error) {
            console.error('댓글 작성 실패:', error);
            throw error;
        }
    }

    async getComments(postId, limit = 50) {
        try {
            const query = this.db.collection('comments')
                .where('postId', '==', postId)
                .where('isActive', '==', true)
                .orderBy('createdAt', 'asc')
                .limit(limit);

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('댓글 조회 실패:', error);
            return [];
        }
    }

    // ==========================================================================
    // Firestore - 투표
    // ==========================================================================

    async getActivePolls() {
        try {
            const now = new Date();
            const query = this.db.collection('polls')
                .where('isActive', '==', true)
                .where('expiresAt', '>', now)
                .orderBy('expiresAt', 'asc');

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('투표 조회 실패:', error);
            return [];
        }
    }

    async submitVote(pollId, selectedOptions) {
        try {
            const userId = this.getCurrentUser()?.uid || this.getAnonymousId();
            
            // 중복 투표 체크
            const existingVote = await this.db.collection('poll_votes')
                .where('pollId', '==', pollId)
                .where('userId', '==', userId)
                .limit(1)
                .get();

            if (!existingVote.empty) {
                throw new Error('이미 투표에 참여하셨습니다.');
            }

            // 투표 저장
            const voteData = {
                pollId: pollId,
                userId: userId,
                selectedOptions: selectedOptions,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await this.db.collection('poll_votes').add(voteData);

            // 투표 수 업데이트 (Cloud Function에서 처리하는 것이 더 안전)
            // 여기서는 클라이언트에서 직접 업데이트
            const pollRef = this.db.collection('polls').doc(pollId);
            await pollRef.update({
                totalVotes: firebase.firestore.FieldValue.increment(1)
            });

            console.log('✅ 투표 제출 성공');
            return true;

        } catch (error) {
            console.error('❌ 투표 제출 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Messaging (푸시 알림)
    // ==========================================================================

    async initializeMessaging() {
        try {
            // 알림 권한 요청
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                console.log('알림 권한이 거부되었습니다.');
                return;
            }

            // FCM 토큰 가져오기
            const token = await this.messaging.getToken({
                vapidKey: 'YOUR_VAPID_KEY' // Firebase Console에서 생성
            });

            if (token) {
                console.log('FCM 토큰:', token);
                await this.saveTokenToServer(token);
            }

            // 토큰 갱신 감지
            this.messaging.onTokenRefresh(async () => {
                const newToken = await this.messaging.getToken();
                await this.saveTokenToServer(newToken);
            });

            // 포그라운드 메시지 수신
            this.messaging.onMessage((payload) => {
                console.log('메시지 수신:', payload);
                this.showNotification(payload.notification);
            });

        } catch (error) {
            console.error('메시징 초기화 실패:', error);
        }
    }

    async saveTokenToServer(token) {
        const user = this.getCurrentUser();
        if (user) {
            await this.db.collection('users').doc(user.uid).update({
                fcmToken: token,
                fcmTokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }

    showNotification(notification) {
        // 커스텀 알림 UI 표시
        const notificationElement = document.createElement('div');
        notificationElement.className = 'custom-notification';
        notificationElement.innerHTML = `
            <h4>${notification.title}</h4>
            <p>${notification.body}</p>
        `;
        
        document.body.appendChild(notificationElement);
        
        setTimeout(() => {
            notificationElement.remove();
        }, 5000);
    }

    // ==========================================================================
    // Storage
    // ==========================================================================

    async uploadImage(file, folder = 'images') {
        try {
            // 파일 크기 체크 (5MB 제한)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('파일 크기는 5MB를 초과할 수 없습니다.');
            }

            // 파일 타입 체크
            if (!file.type.startsWith('image/')) {
                throw new Error('이미지 파일만 업로드 가능합니다.');
            }

            const fileName = `${folder}/${Date.now()}_${file.name}`;
            const storageRef = this.storage.ref().child(fileName);
            
            const uploadTask = storageRef.put(file);
            
            // 업로드 진행률 모니터링
            return new Promise((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        console.log(`업로드 진행률: ${progress}%`);
                    },
                    (error) => {
                        console.error('업로드 실패:', error);
                        reject(error);
                    },
                    async () => {
                        const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                        console.log('✅ 이미지 업로드 성공:', downloadURL);
                        resolve(downloadURL);
                    }
                );
            });

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

    async getClientIP() {
        try {
            // IP 조회 서비스 사용 (예: ipify)
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('IP 조회 실패:', error);
            return '0.0.0.0';
        }
    }

    getAnonymousId() {
        let anonymousId = localStorage.getItem('anonymous_id');
        if (!anonymousId) {
            anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('anonymous_id', anonymousId);
        }
        return anonymousId;
    }

    formatTimestamp(timestamp) {
        if (!timestamp) return '';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return date.toLocaleDateString('ko-KR');
    }
}

// 전역 서비스 인스턴스
const firebaseService = new FirebaseService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseService;
} else {
    window.firebaseService = firebaseService;
}