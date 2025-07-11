/**
 * 진안군 목조전망대 반대 캠페인 앱 - 메인 JavaScript
 */

class JinanCampaignApp {
    constructor() {
        this.state = {
            signatureCount: 1247,
            targetSignatures: 10000,
            currentTab: 'home',
            isOnline: navigator.onLine,
            user: null,
            posts: [],
            polls: [],
            isLoading: true
        };

        this.config = {
            campaign: {
                id: 'jinan-wooden-tower',
                startDate: new Date('2024-12-01'),
                endDate: new Date('2024-12-31'),
                voteDate: new Date('2024-12-20')
            },
            updateInterval: 30000 // 30초
        };

        this.charts = {};
        this.intervals = {};

        this.init();
    }

    async init() {
        try {
            // Firebase 초기화
            if (typeof firebaseService !== 'undefined') {
                await firebaseService.initialize();
                this.setupFirebaseListeners();
            }

            // UI 초기화
            this.initializeEventListeners();
            this.updateSignatureDisplay();
            this.updateDDayCounter();
            this.startRealTimeUpdates();

            // 로딩 화면 숨기기
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 500);

            console.log('✅ 앱 초기화 완료');
        } catch (error) {
            console.error('❌ 앱 초기화 실패:', error);
            this.hideLoadingScreen();
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 300);
        }
        this.state.isLoading = false;
    }

    // ==========================================================================
    // Event Listeners
    // ==========================================================================

    initializeEventListeners() {
        // 탭 네비게이션
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleTabClick(e));
        });

        // 서명 폼
        const signatureForm = document.getElementById('signatureForm');
        if (signatureForm) {
            signatureForm.addEventListener('submit', (e) => this.handleSignatureSubmit(e));
        }

        // 새 글 작성 폼
        const newPostForm = document.getElementById('newPostForm');
        if (newPostForm) {
            newPostForm.addEventListener('submit', (e) => this.handleNewPostSubmit(e));
        }

        // 카테고리 탭
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleCategoryClick(e));
        });

        // 온라인/오프라인 감지
        window.addEventListener('online', () => this.handleOnlineStatus(true));
        window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }

    handleTabClick(event) {
        const tab = event.currentTarget;
        const tabName = tab.dataset.tab;
        
        if (tabName === this.state.currentTab) return;

        // 탭 상태 업데이트
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // 컨텐츠 전환
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const targetContent = document.getElementById(`${tabName}-content`);
        if (targetContent) {
            targetContent.classList.add('active');
        }

        this.state.currentTab = tabName;
        this.onTabChange(tabName);
    }

    onTabChange(tabName) {
        switch (tabName) {
            case 'info':
                this.initializeInfoTab();
                break;
            case 'community':
                this.loadCommunityData();
                break;
            case 'poll':
                this.loadPollData();
                break;
        }
    }

    handleOnlineStatus(isOnline) {
        this.state.isOnline = isOnline;
        if (isOnline) {
            this.showNotification('온라인 상태가 복구되었습니다.', 'success');
            this.syncOfflineData();
        } else {
            this.showNotification('오프라인 모드입니다. 일부 기능이 제한될 수 있습니다.', 'warning');
        }
    }

    // ==========================================================================
    // Signature System
    // ==========================================================================

    async handleSignatureSubmit(event) {
        event.preventDefault();
        
        const form = event.target;
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        try {
            // 버튼 로딩 상태
            submitButton.disabled = true;
            submitButton.textContent = '처리 중...';
            submitButton.classList.add('loading');

            // 폼 데이터 수집
            const formData = new FormData(form);
            const signatureData = {
                name: formData.get('name').trim(),
                region: formData.get('region'),
                phone: formData.get('phone')?.trim() || '',
                comment: formData.get('comment')?.trim() || '',
                isPublic: formData.get('isPublic') === 'on',
                allowContact: formData.get('allowContact') === 'on',
                agreePrivacy: formData.get('agreePrivacy') === 'on',
                campaignId: this.config.campaign.id,
                timestamp: new Date()
            };

            // 유효성 검사
            this.validateSignatureData(signatureData);

            // 서명 제출
            if (typeof firebaseService !== 'undefined' && this.state.isOnline) {
                await firebaseService.submitSignature(signatureData);
            } else {
                this.saveSignatureLocally(signatureData);
            }

            // 성공 처리
            this.state.signatureCount++;
            this.updateSignatureDisplay();
            this.showNotification('서명이 성공적으로 등록되었습니다! 감사합니다.', 'success');
            
            // 폼 초기화
            form.reset();
            
            // 공유 유도
            setTimeout(() => {
                if (confirm('서명해주셔서 감사합니다! 친구들에게도 공유하시겠습니까?')) {
                    this.shareToSocial();
                }
            }, 1000);

        } catch (error) {
            console.error('❌ 서명 제출 실패:', error);
            this.showNotification(error.message || '서명 등록 중 오류가 발생했습니다.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            submitButton.classList.remove('loading');
        }
    }

    validateSignatureData(data) {
        if (!data.name || data.name.length < 2) {
            throw new Error('이름을 올바르게 입력해주세요.');
        }
        
        if (!data.region) {
            throw new Error('거주지를 선택해주세요.');
        }
        
        if (!data.agreePrivacy) {
            throw new Error('개인정보 처리방침에 동의해주세요.');
        }
        
        if (data.phone && !this.isValidPhoneNumber(data.phone)) {
            throw new Error('연락처 형식이 올바르지 않습니다.');
        }
    }

    isValidPhoneNumber(phone) {
        const phoneRegex = /^010-?\d{4}-?\d{4}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }

    saveSignatureLocally(data) {
        const signatures = JSON.parse(localStorage.getItem('offline_signatures') || '[]');
        signatures.push(data);
        localStorage.setItem('offline_signatures', JSON.stringify(signatures));
    }

    async syncOfflineData() {
        const signatures = JSON.parse(localStorage.getItem('offline_signatures') || '[]');
        
        if (signatures.length > 0 && typeof firebaseService !== 'undefined') {
            for (const signature of signatures) {
                try {
                    await firebaseService.submitSignature(signature);
                } catch (error) {
                    console.error('오프라인 서명 동기화 실패:', error);
                }
            }
            
            localStorage.removeItem('offline_signatures');
            this.showNotification(`${signatures.length}개의 오프라인 서명이 동기화되었습니다.`, 'success');
        }
    }

    updateSignatureDisplay() {
        const count = this.state.signatureCount.toLocaleString();
        const percentage = ((this.state.signatureCount / this.state.targetSignatures) * 100).toFixed(1);

        // 메인 카운터 업데이트
        const signatureCount = document.getElementById('signature-count');
        if (signatureCount) {
            signatureCount.textContent = count;
        }

        // 퍼센티지 업데이트
        const percentageElements = document.querySelectorAll('#signature-percentage, #sign-percentage');
        percentageElements.forEach(el => {
            el.textContent = `${percentage}%`;
        });

        // 프로그레스 바 업데이트
        const progressBars = document.querySelectorAll('#progress-bar, #sign-progress-bar');
        progressBars.forEach(bar => {
            bar.style.width = `${percentage}%`;
        });

        // 서명 탭 카운터 업데이트
        const currentSignatures = document.getElementById('current-signatures');
        if (currentSignatures) {
            currentSignatures.textContent = `${count}명`;
        }
    }

    // ==========================================================================
    // D-Day Counter
    // ==========================================================================

    updateDDayCounter() {
        const now = new Date();
        const voteDate = this.config.campaign.voteDate;
        const diffTime = voteDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        const ddayValue = document.getElementById('dday-value');
        if (ddayValue) {
            if (diffDays > 0) {
                ddayValue.textContent = `D-${diffDays}`;
            } else if (diffDays === 0) {
                ddayValue.textContent = 'D-DAY';
            } else {
                ddayValue.textContent = `D+${Math.abs(diffDays)}`;
            }
        }
    }

    // ==========================================================================
    // Info Tab
    // ==========================================================================

    initializeInfoTab() {
        if (!this.charts.comparison) {
            this.createComparisonChart();
        }
    }

    createComparisonChart() {
        const ctx = document.getElementById('comparisonChart');
        if (!ctx) return;

        this.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['케이블카\n(2019)', '목조전망대\n(2024)'],
                datasets: [{
                    label: '사업비 (억원)',
                    data: [29, 445],
                    backgroundColor: ['#fbbf24', '#ef4444'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '억원'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // ==========================================================================
    // Community Features
    // ==========================================================================

    async loadCommunityData() {
        // 커뮤니티 통계 업데이트
        this.updateCommunityStats();
        
        // 게시글 로드 (Firebase 연동시)
        if (typeof firebaseService !== 'undefined') {
            try {
                const posts = await firebaseService.getPosts();
                this.displayPosts(posts);
            } catch (error) {
                console.error('게시글 로드 실패:', error);
            }
        }
    }

    updateCommunityStats() {
        // 더미 데이터로 표시 (실제로는 Firebase에서 가져옴)
        document.getElementById('total-posts').textContent = '234';
        document.getElementById('total-comments').textContent = '567';
        document.getElementById('active-users').textContent = '89';
    }

    displayPosts(posts) {
        const postList = document.getElementById('post-list');
        if (!postList) return;

        postList.innerHTML = posts.map(post => `
            <div class="post-item">
                <h4>${post.title}</h4>
                <p>${post.content}</p>
                <div class="post-meta">
                    <span>${post.authorName} · ${post.region}</span>
                    <span>${this.formatDate(post.createdAt)}</span>
                </div>
            </div>
        `).join('');
    }

    handleCategoryClick(event) {
        const tab = event.currentTarget;
        
        // 활성 탭 변경
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const category = tab.textContent.trim();
        this.filterPostsByCategory(category);
    }

    filterPostsByCategory(category) {
        console.log('카테고리 필터링:', category);
        // 실제 구현시 Firebase 쿼리로 필터링
    }

    async handleNewPostSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const postData = {
            title: formData.get('title'),
            content: formData.get('content'),
            category: formData.get('category'),
            hashtags: this.extractHashtags(formData.get('hashtags')),
            authorName: this.state.user?.displayName || '익명',
            region: this.state.user?.region || '미확인',
            createdAt: new Date()
        };

        try {
            if (typeof firebaseService !== 'undefined') {
                await firebaseService.createPost(postData);
            }
            
            this.hideWritePostModal();
            event.target.reset();
            this.showNotification('게시글이 성공적으로 등록되었습니다!', 'success');
            this.loadCommunityData();
            
        } catch (error) {
            console.error('게시글 작성 실패:', error);
            this.showNotification('게시글 등록 중 오류가 발생했습니다.', 'error');
        }
    }

    extractHashtags(hashtagString) {
        if (!hashtagString) return [];
        return hashtagString.split(/\s+/)
            .filter(tag => tag.startsWith('#'))
            .map(tag => tag.toLowerCase())
            .slice(0, 5);
    }

    // ==========================================================================
    // Poll Features
    // ==========================================================================

    async loadPollData() {
        // 더미 투표 데이터 표시
        this.displayActivePolls();
        this.displayCompletedPolls();
    }

    displayActivePolls() {
        const activePolls = document.getElementById('active-polls');
        if (!activePolls) return;

        activePolls.innerHTML = `
            <div class="poll-container">
                <div class="poll-header">
                    <h4>목조전망대 사업 최종 의견</h4>
                    <div class="poll-deadline">2일 남음</div>
                </div>
                <p>진안군 목조전망대 사업(445억원)에 대한 군민 여러분의 최종 의견을 듣고자 합니다.</p>
                
                <div class="poll-options">
                    <label class="poll-option">
                        <input type="radio" name="poll1" value="oppose">
                        <div class="option-content">
                            <div class="option-title">절대 반대</div>
                            <div class="option-percentage">78%</div>
                        </div>
                    </label>
                    
                    <label class="poll-option">
                        <input type="radio" name="poll1" value="conditional">
                        <div class="option-content">
                            <div class="option-title">조건부 찬성</div>
                            <div class="option-percentage">15%</div>
                        </div>
                    </label>
                    
                    <label class="poll-option">
                        <input type="radio" name="poll1" value="support">
                        <div class="option-content">
                            <div class="option-title">적극 찬성</div>
                            <div class="option-percentage">7%</div>
                        </div>
                    </label>
                </div>
                
                <div class="poll-stats">
                    <span>총 892명 참여</span>
                    <span>마감: 12월 22일 23:59</span>
                </div>
                
                <button class="btn btn-primary btn-block">투표하기</button>
            </div>
        `;
    }

    displayCompletedPolls() {
        const completedPolls = document.getElementById('completed-polls');
        if (!completedPolls) return;

        completedPolls.innerHTML = `
            <div class="result-item">
                <h4>목조전망대 예산 적정성</h4>
                <p>1,456명 참여 | 11월 30일 완료</p>
                <div class="result-bar">
                    <div class="result-option">
                        <span>과도함</span>
                        <span>82%</span>
                    </div>
                    <div class="result-option">
                        <span>적정함</span>
                        <span>18%</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ==========================================================================
    // Real-time Updates
    // ==========================================================================

    startRealTimeUpdates() {
        // 서명 카운터 업데이트
        this.intervals.signatureUpdate = setInterval(() => {
            this.updateSignatureCount();
        }, this.config.updateInterval);

        // D-Day 카운터 업데이트
        this.intervals.ddayUpdate = setInterval(() => {
            this.updateDDayCounter();
        }, 60000); // 1분마다

        // 홈 탭 통계 업데이트
        this.updateHomeStats();
    }

    updateSignatureCount() {
        // 시뮬레이션: 랜덤하게 서명 증가
        if (Math.random() < 0.3) {
            this.state.signatureCount += Math.floor(Math.random() * 3) + 1;
            this.updateSignatureDisplay();
        }
    }

    updateHomeStats() {
        // 홈 화면 통계 업데이트
        document.getElementById('media-count').textContent = '15';
        document.getElementById('share-count').textContent = '234';
        document.getElementById('post-count').textContent = '89';
        document.getElementById('opposition-rate').textContent = '89%';
        
        // 최신 뉴스 표시
        this.displayLatestNews();
    }

    displayLatestNews() {
        const newsList = document.getElementById('news-list');
        if (!newsList) return;

        const news = [
            {
                title: '진안군의회 긴급회의 소집',
                content: '목조전망대 사업 재논의 예정 - 12월 20일',
                time: '2시간 전',
                urgent: true
            },
            {
                title: '군민 1,200명 서명 돌파!',
                content: '하루만에 100명 추가 참여',
                time: '5시간 전',
                urgent: false
            }
        ];

        newsList.innerHTML = news.map(item => `
            <div class="news-item">
                <h4>${item.title}</h4>
                <p>${item.content}</p>
                <span class="news-time">${item.time}</span>
            </div>
        `).join('');
    }

    // ==========================================================================
    // UI Helpers
    // ==========================================================================

    showSignForm() {
        this.state.currentTab = 'sign';
        document.querySelector('[data-tab="sign"]').click();
    }

    showWritePost() {
        const modal = document.getElementById('writePostModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideWritePostModal() {
        const modal = document.getElementById('writePostModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    shareToSocial() {
        const shareData = {
            title: '진안군 목조전망대 반대 캠페인',
            text: `445억원 혈세낭비를 막아주세요! 현재 ${this.state.signatureCount.toLocaleString()}명이 서명했습니다.`,
            url: window.location.href
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => console.log('공유 취소'));
        } else {
            // 대체 공유 방법
            const text = `${shareData.text} ${shareData.url}`;
            navigator.clipboard.writeText(text).then(() => {
                this.showNotification('링크가 클립보드에 복사되었습니다!', 'success');
            });
        }
    }

    quickShare() {
        this.shareToSocial();
    }

    getActionIdea() {
        const ideas = [
            "주변 이웃에게 캠페인 소개하기",
            "SNS에 #목조전망대반대 해시태그 달기",
            "군의원에게 의견서 보내기",
            "지역 언론사에 제보하기",
            "마을 게시판에 포스터 붙이기",
            "가족 단체 채팅방에 공유하기",
            "진안군청에 전화로 의견 전달하기",
            "온라인 커뮤니티에 글 작성하기"
        ];

        const randomIdea = ideas[Math.floor(Math.random() * ideas.length)];
        alert(`💡 오늘의 행동 아이디어\n\n${randomIdea}\n\n작은 행동이 큰 변화를 만듭니다!`);
    }

    showNotification(message, type = 'info') {
        // 간단한 토스트 알림 구현
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    formatDate(date) {
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

    // ==========================================================================
    // Firebase Setup
    // ==========================================================================

    setupFirebaseListeners() {
        if (typeof firebaseService === 'undefined') return;

        // 서명 수 실시간 업데이트
        firebaseService.onSignatureCountChange(this.config.campaign.id, (count) => {
            this.state.signatureCount = count;
            this.updateSignatureDisplay();
        });

        // 사용자 인증 상태 모니터링
        firebaseService.onAuthStateChanged((user) => {
            this.state.user = user;
            this.updateUserInterface();
        });
    }

    updateUserInterface() {
        // 로그인 상태에 따른 UI 업데이트
        const user = this.state.user;
        
        if (user) {
            console.log('사용자 로그인:', user.displayName || user.email);
        }
    }

    // ==========================================================================
    // Cleanup
    // ==========================================================================

    destroy() {
        // 인터벌 정리
        Object.values(this.intervals).forEach(interval => clearInterval(interval));
        
        // 차트 정리
        Object.values(this.charts).forEach(chart => chart.destroy());
        
        console.log('앱 정리 완료');
    }
}

// ==========================================================================
// App Initialization
// ==========================================================================

let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new JinanCampaignApp();
    
    // 전역 접근을 위해 window에 추가
    window.app = app;
});

// 페이지 언로드시 정리
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});

// ==========================================================================
// CSS Animations
// ==========================================================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .notification {
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);