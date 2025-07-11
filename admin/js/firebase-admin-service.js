// admin/js/firebase-admin-service.js
/**
 * 진안 캠페인 관리자 - Firebase 서비스
 */

class FirebaseAdminService {
    constructor() {
        this.app = null;
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.functions = null;
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🔥 Firebase Admin 초기화 시작...');

            // Firebase 앱 초기화
            if (!firebase.apps.length) {
                this.app = firebase.initializeApp(firebaseConfig);
            } else {
                this.app = firebase.app();
            }

            // Firestore 초기화
            this.db = firebase.firestore();
            
            // Authentication 초기화
            this.auth = firebase.auth();
            await this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

            // Storage 초기화
            this.storage = firebase.storage();

            // Functions 초기화
            this.functions = firebase.functions('asia-northeast3');

            // 에뮬레이터 연결 (개발 환경)
            if (envConfig.useEmulator) {
                this.connectToEmulators();
            }

            this.isInitialized = true;
            console.log('✅ Firebase Admin 초기화 완료');

        } catch (error) {
            console.error('❌ Firebase Admin 초기화 실패:', error);
            throw error;
        }
    }

    connectToEmulators() {
        console.log('🔧 에뮬레이터 연결 중...');
        
        this.db.useEmulator('localhost', 8080);
        this.auth.useEmulator('http://localhost:9099');
        this.storage.useEmulator('localhost', 9199);
        this.functions.useEmulator('localhost', 5001);
    }

    // ==========================================================================
    // Authentication
    // ==========================================================================

    async signIn(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            
            // 관리자 권한 확인
            const user = await this.getUser(result.user.uid);
            if (!user || !user.isAdmin) {
                await this.auth.signOut();
                throw new Error('관리자 권한이 없습니다.');
            }

            console.log('✅ 관리자 로그인 성공:', result.user.email);
            return result.user;
        } catch (error) {
            console.error('❌ 로그인 실패:', error);
            throw error;
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            console.log('✅ 로그아웃 성공');
        } catch (error) {
            console.error('❌ 로그아웃 실패:', error);
            throw error;
        }
    }

    getCurrentUser() {
        return this.auth.currentUser;
    }

    onAuthStateChanged(callback) {
        return this.auth.onAuthStateChanged(callback);
    }

    // ==========================================================================
    // Firestore - 캠페인
    // ==========================================================================

    async getCampaigns() {
        try {
            const snapshot = await this.db.collection('campaigns')
                .orderBy('createdAt', 'desc')
                .get();
                
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('캠페인 조회 실패:', error);
            throw error;
        }
    }

    async getCampaign(id) {
        try {
            const doc = await this.db.collection('campaigns').doc(id).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error('캠페인 조회 실패:', error);
            throw error;
        }
    }

    async createCampaign(data) {
        try {
            const campaign = {
                ...data,
                currentSignatures: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.getCurrentUser().uid
            };

            const docRef = await this.db.collection('campaigns').add(campaign);
            console.log('✅ 캠페인 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ 캠페인 생성 실패:', error);
            throw error;
        }
    }

    async updateCampaign(id, data) {
        try {
            const update = {
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: this.getCurrentUser().uid
            };

            await this.db.collection('campaigns').doc(id).update(update);
            console.log('✅ 캠페인 업데이트 성공:', id);
        } catch (error) {
            console.error('❌ 캠페인 업데이트 실패:', error);
            throw error;
        }
    }

    async deleteCampaign(id) {
        try {
            await this.db.collection('campaigns').doc(id).delete();
            console.log('✅ 캠페인 삭제 성공:', id);
        } catch (error) {
            console.error('❌ 캠페인 삭제 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Firestore - 서명
    // ==========================================================================

    async getSignatures(filters = {}) {
        try {
            let query = this.db.collection('signatures');

            // 필터 적용
            if (filters.campaignId) {
                query = query.where('campaignId', '==', filters.campaignId);
            }
            if (filters.region) {
                query = query.where('region', '==', filters.region);
            }
            if (filters.verificationStatus) {
                query = query.where('verificationStatus', '==', filters.verificationStatus);
            }
            if (filters.startDate) {
                query = query.where('timestamp', '>=', new Date(filters.startDate));
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                query = query.where('timestamp', '<=', endDate);
            }

            // 정렬
            query = query.orderBy('timestamp', 'desc');

            // 페이지네이션
            if (filters.limit) {
                query = query.limit(filters.limit);
            }
            if (filters.startAfter) {
                query = query.startAfter(filters.startAfter);
            }

            const snapshot = await query.get();
            
            return {
                signatures: snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })),
                lastDoc: snapshot.docs[snapshot.docs.length - 1] || null
            };
        } catch (error) {
            console.error('서명 조회 실패:', error);
            throw error;
        }
    }

    async updateSignatureStatus(id, status) {
        try {
            await this.db.collection('signatures').doc(id).update({
                verificationStatus: status,
                verifiedAt: firebase.firestore.FieldValue.serverTimestamp(),
                verifiedBy: this.getCurrentUser().uid
            });
            console.log('✅ 서명 상태 업데이트:', id, status);
        } catch (error) {
            console.error('❌ 서명 상태 업데이트 실패:', error);
            throw error;
        }
    }

    async bulkUpdateSignatures(ids, status) {
        try {
            const batch = this.db.batch();
            const verifiedBy = this.getCurrentUser().uid;
            const verifiedAt = firebase.firestore.FieldValue.serverTimestamp();

            ids.forEach(id => {
                const ref = this.db.collection('signatures').doc(id);
                batch.update(ref, {
                    verificationStatus: status,
                    verifiedAt: verifiedAt,
                    verifiedBy: verifiedBy
                });
            });

            await batch.commit();
            console.log('✅ 일괄 서명 업데이트 성공:', ids.length);
        } catch (error) {
            console.error('❌ 일괄 서명 업데이트 실패:', error);
            throw error;
        }
    }

    async exportSignatures(campaignId, format = 'csv') {
        try {
            // Cloud Function 호출
            const exportFunction = this.functions.httpsCallable('exportSignatures');
            const result = await exportFunction({ campaignId, format });
            
            return result.data.downloadUrl;
        } catch (error) {
            console.error('서명 내보내기 실패:', error);
            
            // 대체 방법: 클라이언트에서 직접 처리
            const { signatures } = await this.getSignatures({ 
                campaignId, 
                limit: 10000 
            });
            
            return this.generateCSV(signatures);
        }
    }

    // ==========================================================================
    // Firestore - 사용자
    // ==========================================================================

    async getUsers(filters = {}) {
        try {
            let query = this.db.collection('users');

            if (filters.isActive !== undefined) {
                query = query.where('isActive', '==', filters.isActive);
            }
            if (filters.region) {
                query = query.where('region', '==', filters.region);
            }
            if (filters.role) {
                if (filters.role === 'admin') {
                    query = query.where('isAdmin', '==', true);
                } else if (filters.role === 'moderator') {
                    query = query.where('isModerator', '==', true);
                }
            }

            query = query.orderBy('createdAt', 'desc');

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('사용자 조회 실패:', error);
            throw error;
        }
    }

    async getUser(uid) {
        try {
            const doc = await this.db.collection('users').doc(uid).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (error) {
            console.error('사용자 조회 실패:', error);
            throw error;
        }
    }

    async updateUser(uid, data) {
        try {
            await this.db.collection('users').doc(uid).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: this.getCurrentUser().uid
            });
            console.log('✅ 사용자 업데이트 성공:', uid);
        } catch (error) {
            console.error('❌ 사용자 업데이트 실패:', error);
            throw error;
        }
    }

    async toggleUserStatus(uid, isActive) {
        try {
            await this.updateUser(uid, { isActive });
            console.log(`✅ 사용자 ${isActive ? '활성화' : '비활성화'} 성공:`, uid);
        } catch (error) {
            console.error('❌ 사용자 상태 변경 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Firestore - 게시글
    // ==========================================================================

    async getPosts(filters = {}) {
        try {
            let query = this.db.collection('posts');

            if (filters.category) {
                query = query.where('category', '==', filters.category);
            }
            if (filters.isActive !== undefined) {
                query = query.where('isActive', '==', filters.isActive);
            }
            if (filters.isPinned !== undefined) {
                query = query.where('isPinned', '==', filters.isPinned);
            }

            query = query.orderBy('createdAt', 'desc');

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('게시글 조회 실패:', error);
            throw error;
        }
    }

    async createPost(data) {
        try {
            const post = {
                ...data,
                authorId: this.getCurrentUser().uid,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                reactions: { like: 0, love: 0, angry: 0, sad: 0 },
                viewCount: 0,
                commentCount: 0,
                isActive: true
            };

            const docRef = await this.db.collection('posts').add(post);
            console.log('✅ 게시글 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ 게시글 생성 실패:', error);
            throw error;
        }
    }

    async updatePost(id, data) {
        try {
            await this.db.collection('posts').doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedBy: this.getCurrentUser().uid
            });
            console.log('✅ 게시글 업데이트 성공:', id);
        } catch (error) {
            console.error('❌ 게시글 업데이트 실패:', error);
            throw error;
        }
    }

    async togglePostStatus(id, isActive) {
        try {
            await this.updatePost(id, { isActive });
            console.log(`✅ 게시글 ${isActive ? '활성화' : '비활성화'} 성공:`, id);
        } catch (error) {
            console.error('❌ 게시글 상태 변경 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Firestore - 투표
    // ==========================================================================

    async getPolls(filters = {}) {
        try {
            let query = this.db.collection('polls');

            if (filters.isActive !== undefined) {
                query = query.where('isActive', '==', filters.isActive);
            }

            query = query.orderBy('createdAt', 'desc');

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('투표 조회 실패:', error);
            throw error;
        }
    }

    async createPoll(data) {
        try {
            const poll = {
                ...data,
                options: data.options.map((text, index) => ({
                    id: index,
                    text: text,
                    votes: 0
                })),
                totalVotes: 0,
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.getCurrentUser().uid
            };

            const docRef = await this.db.collection('polls').add(poll);
            console.log('✅ 투표 생성 성공:', docRef.id);
            return docRef.id;
        } catch (error) {
            console.error('❌ 투표 생성 실패:', error);
            throw error;
        }
    }

    async closePoll(id) {
        try {
            await this.db.collection('polls').doc(id).update({
                isActive: false,
                closedAt: firebase.firestore.FieldValue.serverTimestamp(),
                closedBy: this.getCurrentUser().uid
            });
            console.log('✅ 투표 마감 성공:', id);
        } catch (error) {
            console.error('❌ 투표 마감 실패:', error);
            throw error;
        }
    }

    async getPollResults(pollId) {
        try {
            // 투표 정보 가져오기
            const pollDoc = await this.db.collection('polls').doc(pollId).get();
            if (!pollDoc.exists) {
                throw new Error('투표를 찾을 수 없습니다.');
            }

            const poll = { id: pollDoc.id, ...pollDoc.data() };

            // 투표 참여자 목록 가져오기
            const votesSnapshot = await this.db.collection('poll_votes')
                .where('pollId', '==', pollId)
                .get();

            const votes = votesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // 옵션별 집계
            const optionCounts = {};
            votes.forEach(vote => {
                vote.selectedOptions.forEach(optionId => {
                    optionCounts[optionId] = (optionCounts[optionId] || 0) + 1;
                });
            });

            return {
                poll: poll,
                votes: votes,
                optionCounts: optionCounts,
                totalVotes: votes.length
            };
        } catch (error) {
            console.error('투표 결과 조회 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Firestore - 알림
    // ==========================================================================

    async sendNotification(data) {
        try {
            const notification = {
                ...data,
                isRead: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: this.getCurrentUser().uid
            };

            // 대상별 처리
            if (data.target === 'all') {
                // Cloud Function 호출
                const sendBulkNotification = this.functions.httpsCallable('sendBulkNotification');
                await sendBulkNotification(notification);
                
                console.log('✅ 전체 알림 발송 성공');
            } else if (data.target === 'specific' && data.userId) {
                // 특정 사용자에게 발송
                await this.db.collection('notifications').add({
                    ...notification,
                    userId: data.userId
                });
                
                console.log('✅ 개별 알림 발송 성공');
            }
        } catch (error) {
            console.error('❌ 알림 발송 실패:', error);
            throw error;
        }
    }

    async getNotifications(filters = {}) {
        try {
            let query = this.db.collection('notifications');

            if (filters.userId) {
                query = query.where('userId', '==', filters.userId);
            }
            if (filters.type) {
                query = query.where('type', '==', filters.type);
            }
            if (filters.isRead !== undefined) {
                query = query.where('isRead', '==', filters.isRead);
            }

            query = query.orderBy('createdAt', 'desc');

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('알림 조회 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Firestore - 통계
    // ==========================================================================

    async getStatistics(date, type = 'daily') {
        try {
            const doc = await this.db.collection('statistics')
                .where('date', '==', date)
                .where('type', '==', type)
                .limit(1)
                .get();

            if (!doc.empty) {
                return doc.docs[0].data();
            }

            // 통계가 없으면 실시간 계산
            return await this.calculateStatistics(date, type);
        } catch (error) {
            console.error('통계 조회 실패:', error);
            throw error;
        }
    }

    async calculateStatistics(date, type) {
        // 실시간 통계 계산
        const stats = {
            date: date,
            type: type,
            signatures: {
                total: 0,
                new: 0,
                byRegion: {}
            },
            users: {
                total: 0,
                active: 0,
                new: 0
            },
            posts: {
                total: 0,
                new: 0,
                byCategory: {}
            }
        };

        // 서명 통계
        const signaturesSnapshot = await this.db.collection('signatures').get();
        stats.signatures.total = signaturesSnapshot.size;

        // 사용자 통계
        const usersSnapshot = await this.db.collection('users').get();
        stats.users.total = usersSnapshot.size;
        stats.users.active = usersSnapshot.docs.filter(doc => doc.data().isActive).length;

        // 게시글 통계
        const postsSnapshot = await this.db.collection('posts').get();
        stats.posts.total = postsSnapshot.size;

        return stats;
    }

    async generateStatisticsReport(startDate, endDate) {
        try {
            // Cloud Function 호출
            const generateReport = this.functions.httpsCallable('generateStatisticsReport');
            const result = await generateReport({ startDate, endDate });
            
            return result.data;
        } catch (error) {
            console.error('통계 리포트 생성 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Storage
    // ==========================================================================

    async uploadFile(file, path) {
        try {
            const storageRef = this.storage.ref().child(path);
            const metadata = {
                contentType: file.type,
                customMetadata: {
                    uploadedBy: this.getCurrentUser().uid,
                    uploadedAt: new Date().toISOString()
                }
            };

            const uploadTask = storageRef.put(file, metadata);
            
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
                        console.log('✅ 파일 업로드 성공:', downloadURL);
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error('❌ 파일 업로드 실패:', error);
            throw error;
        }
    }

    async deleteFile(path) {
        try {
            const storageRef = this.storage.ref().child(path);
            await storageRef.delete();
            console.log('✅ 파일 삭제 성공:', path);
        } catch (error) {
            console.error('❌ 파일 삭제 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Utilities
    // ==========================================================================

    generateCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // 타임스탬프 변환
                    if (header === 'timestamp' && value && value.toDate) {
                        return value.toDate().toLocaleString('ko-KR');
                    }
                    // 쉼표나 줄바꿈이 있으면 따옴표로 감싸기
                    if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value || '';
                }).join(',')
            )
        ].join('\n');

        // BOM 추가 (한글 깨짐 방지)
        return '\ufeff' + csv;
    }

    downloadCSV(filename, csv) {
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
    }

    // 실시간 리스너
    onCampaignUpdate(callback) {
        return this.db.collection('campaigns')
            .onSnapshot((snapshot) => {
                const campaigns = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(campaigns);
            });
    }

    onSignatureUpdate(campaignId, callback) {
        return this.db.collection('signatures')
            .where('campaignId', '==', campaignId)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .onSnapshot((snapshot) => {
                const signatures = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                callback(signatures);
            });
    }

    // 권한 체크
    async checkAdminPermission() {
        const user = this.getCurrentUser();
        if (!user) {
            throw new Error('로그인이 필요합니다.');
        }

        const userData = await this.getUser(user.uid);
        if (!userData || !userData.isAdmin) {
            throw new Error('관리자 권한이 없습니다.');
        }

        return true;
    }
}

// 전역 서비스 인스턴스
const firebaseAdminService = new FirebaseAdminService();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = firebaseAdminService;
} else {
    window.firebaseAdminService = firebaseAdminService;
}