/**
 * 진안 캠페인 관리자 CMS - Firebase 관리자 설정
 */

class FirebaseAdmin {
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
            // Firebase 설정 (환경변수에서 로드)
            const firebaseConfig = {
                apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
                authDomain: process.env.FIREBASE_AUTH_DOMAIN || "YOUR_AUTH_DOMAIN",
                projectId: process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "YOUR_STORAGE_BUCKET",
                messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
                appId: process.env.FIREBASE_APP_ID || "YOUR_APP_ID"
            };

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

            // Storage 초기화
            this.storage = firebase.storage();

            // Functions 초기화
            this.functions = firebase.functions();

            this.isInitialized = true;
            console.log('✅ Firebase Admin 초기화 완료');

        } catch (error) {
            console.error('❌ Firebase Admin 초기화 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Authentication
    // ==========================================================================

    async signIn(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            
            // 관리자 권한 확인
            const user = await this.getUser(result.user.uid);
            if (!user.isAdmin) {
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
            const snapshot = await this.db.collection('campaigns').get();
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
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
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
                query = query.where('timestamp', '>=', filters.startDate);
            }
            if (filters.endDate) {
                query = query.where('timestamp', '<=', filters.endDate);
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
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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

    async exportSignatures(campaignId) {
        try {
            const signatures = await this.getSignatures({ 
                campaignId, 
                limit: 10000 
            });

            // CSV 형식으로 변환
            const csv = this.convertToCSV(signatures);
            return csv;
        } catch (error) {
            console.error('서명 내보내기 실패:', error);
            throw error;
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

            query = query.orderBy('createdAt', 'desc');

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
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ 사용자 업데이트 성공:', uid);
        } catch (error) {
            console.error('❌ 사용자 업데이트 실패:', error);
            throw error;
        }
    }

    async banUser(uid) {
        try {
            await this.updateUser(uid, { isActive: false });
            console.log('✅ 사용자 정지 성공:', uid);
        } catch (error) {
            console.error('❌ 사용자 정지 실패:', error);
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
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ 게시글 업데이트 성공:', id);
        } catch (error) {
            console.error('❌ 게시글 업데이트 실패:', error);
            throw error;
        }
    }

    async deletePost(id) {
        try {
            // 실제로는 isActive를 false로 변경
            await this.updatePost(id, { isActive: false });
            console.log('✅ 게시글 삭제 성공:', id);
        } catch (error) {
            console.error('❌ 게시글 삭제 실패:', error);
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
                totalVotes: 0,
                isActive: true,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
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
                closedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ 투표 마감 성공:', id);
        } catch (error) {
            console.error('❌ 투표 마감 실패:', error);
            throw error;
        }
    }

    async getPollVotes(pollId) {
        try {
            const snapshot = await this.db.collection('poll_votes')
                .where('pollId', '==', pollId)
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
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
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // 대상별 처리
            if (data.target === 'all') {
                // 모든 사용자에게 발송
                const users = await this.getUsers({ isActive: true });
                const batch = this.db.batch();

                users.forEach(user => {
                    const docRef = this.db.collection('notifications').doc();
                    batch.set(docRef, {
                        ...notification,
                        userId: user.id
                    });
                });

                await batch.commit();
                console.log('✅ 전체 알림 발송 성공');
            } else {
                // 특정 사용자에게 발송
                await this.db.collection('notifications').add(notification);
                console.log('✅ 개별 알림 발송 성공');
            }
        } catch (error) {
            console.error('❌ 알림 발송 실패:', error);
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
                .get();

            if (!doc.empty) {
                return doc.docs[0].data();
            }

            return null;
        } catch (error) {
            console.error('통계 조회 실패:', error);
            throw error;
        }
    }

    async generateStatistics(date) {
        try {
            // 일일 통계 생성
            const stats = {
                date: date,
                type: 'daily',
                signatures: {
                    total: 0,
                    new: 0,
                    byRegion: {}
                },
                users: {
                    activeUsers: 0,
                    newUsers: 0
                },
                posts: {
                    total: 0,
                    new: 0,
                    byCategory: {}
                }
            };

            // 실제 데이터 집계 로직
            // ...

            await this.db.collection('statistics').add(stats);
            console.log('✅ 통계 생성 성공:', date);
        } catch (error) {
            console.error('❌ 통계 생성 실패:', error);
            throw error;
        }
    }

    // ==========================================================================
    // Storage
    // ==========================================================================

    async uploadFile(file, path) {
        try {
            const storageRef = this.storage.ref().child(path);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            
            console.log('✅ 파일 업로드 성공:', downloadURL);
            return downloadURL;
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

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csv = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header];
                    // 쉼표나 줄바꿈이 있으면 따옴표로 감싸기
                    if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        return csv;
    }

    downloadCSV(filename, csv) {
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
}

// 전역 Firebase Admin 인스턴스
const firebaseAdmin = new FirebaseAdmin();

// 초기화
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await firebaseAdmin.initialize();
        console.log('🚀 Firebase Admin 서비스 준비 완료');
    } catch (error) {
        console.error('❌ Firebase Admin 서비스 초기화 실패:', error);
    }
});

// 전역 접근을 위해 window에 추가
window.firebaseAdmin = firebaseAdmin;