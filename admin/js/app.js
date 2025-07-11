/**
 * 진안 캠페인 관리자 CMS - 메인 애플리케이션
 */

class AdminApp {
    constructor() {
        this.state = {
            currentPage: 'dashboard',
            user: null,
            data: {},
            charts: {},
            filters: {},
            isLoading: false
        };

        this.modules = {};
        this.init();
    }

    async init() {
        try {
            // 인증 체크
            await this.checkAuth();
            
            // 모듈 초기화
            this.initializeModules();
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            
            // 초기 페이지 로드
            this.loadPage('dashboard');
            
            console.log('✅ Admin CMS 초기화 완료');
        } catch (error) {
            console.error('❌ 초기화 실패:', error);
            this.showError('시스템 초기화에 실패했습니다.');
        }
    }

    async checkAuth() {
        // Firebase Auth 체크
        if (typeof firebaseAdmin !== 'undefined') {
            const user = await firebaseAdmin.getCurrentUser();
            if (!user) {
                window.location.href = '/admin/login.html';
                return;
            }
            this.state.user = user;
        }
    }

    initializeModules() {
        // 모듈 로드
        this.modules.dashboard = new DashboardModule(this);
        this.modules.campaigns = new CampaignsModule(this);
        this.modules.signatures = new SignaturesModule(this);
        this.modules.users = new UsersModule(this);
        this.modules.posts = new PostsModule(this);
        this.modules.polls = new PollsModule(this);
        this.modules.notifications = new NotificationsModule(this);
        this.modules.statistics = new StatisticsModule(this);
    }

    setupEventListeners() {
        // 네비게이션 클릭
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.loadPage(page);
            });
        });

        // 사이드바 토글 (모바일)
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('open');
            });
        }

        // 모달 닫기
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        // 모달 외부 클릭
        document.querySelector('.modal')?.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
            }
        });

        // 새로고침 버튼
        document.querySelector('.btn-refresh')?.addEventListener('click', () => {
            this.refreshCurrentPage();
        });

        // Primary Action 버튼
        document.querySelector('#primaryActionBtn')?.addEventListener('click', () => {
            this.handlePrimaryAction();
        });
    }

    loadPage(page) {
        // 현재 페이지 정리
        this.cleanupCurrentPage();

        // 네비게이션 활성화
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // 페이지 상태 업데이트
        this.state.currentPage = page;

        // 페이지 제목 업데이트
        this.updatePageTitle(page);

        // 로딩 표시
        this.showLoading();

        // 모듈 로드
        setTimeout(() => {
            const module = this.modules[page];
            if (module) {
                module.load();
            } else {
                this.showError('페이지를 찾을 수 없습니다.');
            }
            this.hideLoading();
        }, 300);

        // 모바일에서 사이드바 닫기
        if (window.innerWidth < 1024) {
            document.querySelector('.sidebar').classList.remove('open');
        }
    }

    updatePageTitle(page) {
        const titles = {
            dashboard: '통계 대시보드',
            campaigns: '캠페인 정보',
            signatures: '서명 관리',
            users: '사용자 관리',
            posts: '게시글 관리',
            comments: '댓글 관리',
            polls: '투표 관리',
            'poll-votes': '투표 결과',
            notifications: '알림 관리',
            statistics: '통계 데이터'
        };

        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.textContent = titles[page] || '페이지';
        }

        // Primary Action 버튼 텍스트 업데이트
        const primaryBtn = document.getElementById('primaryActionBtn');
        if (primaryBtn) {
            const btnTexts = {
                campaigns: '새 캠페인',
                signatures: '서명 내보내기',
                users: '새 사용자',
                posts: '새 게시글',
                polls: '새 투표',
                notifications: '알림 발송'
            };
            
            const btnText = btnTexts[page];
            if (btnText) {
                primaryBtn.innerHTML = `<span>➕</span><span>${btnText}</span>`;
                primaryBtn.style.display = 'flex';
            } else {
                primaryBtn.style.display = 'none';
            }
        }
    }

    handlePrimaryAction() {
        const actions = {
            campaigns: () => this.modules.campaigns.showCreateModal(),
            signatures: () => this.modules.signatures.exportData(),
            users: () => this.modules.users.showCreateModal(),
            posts: () => this.modules.posts.showCreateModal(),
            polls: () => this.modules.polls.showCreateModal(),
            notifications: () => this.modules.notifications.showSendModal()
        };

        const action = actions[this.state.currentPage];
        if (action) {
            action();
        }
    }

    cleanupCurrentPage() {
        // 차트 정리
        Object.values(this.state.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.state.charts = {};

        // 인터벌 정리
        if (this.state.intervals) {
            Object.values(this.state.intervals).forEach(interval => {
                clearInterval(interval);
            });
            this.state.intervals = {};
        }
    }

    refreshCurrentPage() {
        this.loadPage(this.state.currentPage);
        this.showToast('페이지를 새로고침했습니다.', 'success');
    }

    showLoading() {
        this.state.isLoading = true;
        const content = document.getElementById('content');
        if (content) {
            content.innerHTML = `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>로딩 중...</span>
                </div>
            `;
        }
    }

    hideLoading() {
        this.state.isLoading = false;
    }

    showModal(title, body, footer) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modalTitle');
        const modalBody = document.getElementById('modalBody');
        const modalFooter = document.getElementById('modalFooter');

        if (modal && modalTitle && modalBody) {
            modalTitle.textContent = title;
            modalBody.innerHTML = body;
            
            if (footer && modalFooter) {
                modalFooter.innerHTML = footer;
                modalFooter.style.display = 'flex';
            } else if (modalFooter) {
                modalFooter.style.display = 'none';
            }

            modal.classList.add('active');
        }
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">${this.getToastIcon(type)}</div>
            <div class="toast-message">${message}</div>
        `;

        // 스타일 추가
        toast.style.cssText = `
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            background: white;
            border: 1px solid var(--gray-200);
            border-radius: var(--radius-md);
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
            box-shadow: var(--shadow-lg);
            z-index: 9999;
            animation: slideUp 0.3s ease;
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideDown 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    confirm(message) {
        return window.confirm(message);
    }

    formatDate(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('ko-KR') + ' ' + d.toLocaleTimeString('ko-KR');
    }

    formatNumber(num) {
        return num.toLocaleString('ko-KR');
    }

    async fetchData(endpoint, options = {}) {
        try {
            // Firebase 또는 API 호출
            if (typeof firebaseAdmin !== 'undefined') {
                return await firebaseAdmin.fetchData(endpoint, options);
            }
            
            // 개발용 더미 데이터
            return this.getDummyData(endpoint);
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            throw error;
        }
    }

    getDummyData(endpoint) {
        // 개발용 더미 데이터
        const dummyData = {
            'campaigns/stats': {
                totalSignatures: 1247,
                activeUsers: 89,
                totalPosts: 234,
                voteParticipation: 78
            },
            'signatures/recent': [
                { id: 1, name: '김민수', region: '진안읍', createdAt: new Date() },
                { id: 2, name: '이영희', region: '마령면', createdAt: new Date() }
            ],
            // ... 더 많은 더미 데이터
        };

        return Promise.resolve(dummyData[endpoint] || {});
    }
}

// 기본 모듈 클래스
class BaseModule {
    constructor(app) {
        this.app = app;
        this.data = {};
    }

    async load() {
        try {
            await this.fetchData();
            this.render();
        } catch (error) {
            console.error(`${this.constructor.name} 로드 실패:`, error);
            this.app.showError('데이터 로드에 실패했습니다.');
        }
    }

    async fetchData() {
        // 하위 클래스에서 구현
    }

    render() {
        // 하위 클래스에서 구현
    }

    getContent() {
        return document.getElementById('content');
    }
}

// 전역 앱 인스턴스
let adminApp;

// DOM 로드 완료시 초기화
document.addEventListener('DOMContentLoaded', () => {
    adminApp = new AdminApp();
    window.adminApp = adminApp; // 디버깅용
});