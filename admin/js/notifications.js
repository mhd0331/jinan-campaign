/**
 * 진안 캠페인 관리자 CMS - 알림 관리 모듈
 */

class NotificationsModule extends BaseModule {
    constructor(app) {
        super(app);
        this.currentPage = 1;
        this.itemsPerPage = 20;
    }

    async fetchData() {
        try {
            this.data = await this.app.fetchData('notifications', {
                page: this.currentPage,
                limit: this.itemsPerPage
            });
        } catch (error) {
            console.error('알림 데이터 로드 실패:', error);
            this.data = this.getDummyData();
        }
    }

    getDummyData() {
        const notifications = [];
        const types = ['system', 'news', 'comment', 'like', 'mention'];
        const titles = [
            '서명이 등록되었습니다',
            '새로운 댓글이 달렸습니다',
            '캠페인 소식이 있습니다',
            '게시글이 추천되었습니다',
            '회원님을 멘션했습니다'
        ];

        for (let i = 0; i < 50; i++) {
            notifications.push({
                id: i + 1,
                userId: 'user' + (i % 10),
                userName: '사용자' + (i % 10),
                type: types[i % types.length],
                title: titles[i % titles.length],
                message: '알림 메시지 내용입니다...',
                isRead: Math.random() > 0.3,
                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            });
        }

        return {
            notifications: notifications.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage),
            total: notifications.length,
            stats: {
                total: 523,
                unread: 45,
                today: 23,
                pushEnabled: 189
            }
        };
    }

    render() {
        const content = this.getContent();
        content.innerHTML = `
            <!-- 통계 카드 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>전체 알림</h3>
                        <div class="stat-value">${this.app.formatNumber(this.data.stats.total)}</div>
                    </div>
                    <div class="stat-icon">🔔</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>읽지 않음</h3>
                        <div class="stat-value">${this.data.stats.unread}</div>
                    </div>
                    <div class="stat-icon">📬</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>오늘 발송</h3>
                        <div class="stat-value">${this.data.stats.today}</div>
                    </div>
                    <div class="stat-icon">📅</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>푸시 허용</h3>
                        <div class="stat-value">${this.data.stats.pushEnabled}</div>
                    </div>
                    <div class="stat-icon">📱</div>
                </div>
            </div>

            <!-- 알림 발송 섹션 -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">알림 발송</h3>
                </div>
                <div class="card-body">
                    <button class="btn btn-primary" onclick="adminApp.modules.notifications.showSendModal()">
                        <span>📤</span>
                        <span>새 알림 발송</span>
                    </button>
                    <button class="btn btn-secondary" onclick="adminApp.modules.notifications.showBulkModal()">
                        <span>📢</span>
                        <span>일괄 발송</span>
                    </button>
                    <button class="btn btn-secondary" onclick="adminApp.modules.notifications.showScheduleModal()">
                        <span>⏰</span>
                        <span>예약 발송</span>
                    </button>
                </div>
            </div>

            <!-- 알림 목록 -->
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">발송 내역</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>수신자</th>
                            <th>유형</th>
                            <th>제목</th>
                            <th>내용</th>
                            <th>읽음</th>
                            <th>발송일시</th>
                            <th>액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderNotifications()}
                    </tbody>
                </table>
                ${this.renderPagination()}
            </div>
        `;
    }

    renderNotifications() {
        return this.data.notifications.map(notif => `
            <tr>
                <td>${notif.id}</td>
                <td>${notif.userName}</td>
                <td>${this.getTypeBadge(notif.type)}</td>
                <td>${notif.title}</td>
                <td class="text-truncate" style="max-width: 200px">${notif.message}</td>
                <td>
                    <span class="badge badge-${notif.isRead ? 'success' : 'danger'}">
                        ${notif.isRead ? '읽음' : '안읽음'}
                    </span>
                </td>
                <td>${this.app.formatDate(notif.createdAt)}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="adminApp.modules.notifications.deleteNotification(${notif.id})">
                        삭제
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getTypeBadge(type) {
        const badges = {
            'system': '<span class="badge badge-info">시스템</span>',
            'news': '<span class="badge badge-primary">뉴스</span>',
            'comment': '<span class="badge badge-warning">댓글</span>',
            'like': '<span class="badge badge-success">좋아요</span>',
            'mention': '<span class="badge badge-secondary">멘션</span>'
        };
        return badges[type] || '<span class="badge">기타</span>';
    }

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.itemsPerPage);
        return `
            <div class="pagination">
                <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                        onclick="adminApp.modules.notifications.goToPage(${this.currentPage - 1})">
                    이전
                </button>
                ${this.renderPageNumbers(totalPages)}
                <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                        onclick="adminApp.modules.notifications.goToPage(${this.currentPage + 1})">
                    다음
                </button>
            </div>
        `;
    }

    renderPageNumbers(totalPages) {
        let pages = [];
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            pages.push(`
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="adminApp.modules.notifications.goToPage(${i})">
                    ${i}
                </button>
            `);
        }
        return pages.join('');
    }

    goToPage(page) {
        this.currentPage = page;
        this.load();
    }

    showSendModal() {
        const content = `
            <form id="notificationForm">
                <div class="form-group">
                    <label class="form-label">수신 대상</label>
                    <select name="target" class="form-control" required onchange="adminApp.modules.notifications.onTargetChange(this.value)">
                        <option value="">선택하세요</option>
                        <option value="all">전체 사용자</option>
                        <option value="signers">서명 참여자</option>
                        <option value="active">활성 사용자 (최근 7일)</option>
                        <option value="specific">특정 사용자</option>
                    </select>
                </div>
                <div class="form-group" id="specificUserGroup" style="display: none;">
                    <label class="form-label">사용자 ID 또는 이메일</label>
                    <input type="text" name="userId" class="form-control">
                </div>
                <div class="form-group">
                    <label class="form-label">알림 유형</label>
                    <select name="type" class="form-control" required>
                        <option value="system">시스템</option>
                        <option value="news">뉴스</option>
                        <option value="event">이벤트</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">제목</label>
                    <input type="text" name="title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">내용</label>
                    <textarea name="message" rows="5" class="form-control" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-check">
                        <input type="checkbox" name="sendPush" class="form-check-input">
                        <span>푸시 알림도 함께 발송</span>
                    </label>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="adminApp.closeModal()">취소</button>
            <button class="btn btn-primary" onclick="adminApp.modules.notifications.sendNotification()">발송</button>
        `;

        this.app.showModal('알림 발송', content, footer);
    }

    onTargetChange(value) {
        const specificUserGroup = document.getElementById('specificUserGroup');
        if (value === 'specific') {
            specificUserGroup.style.display = 'block';
        } else {
            specificUserGroup.style.display = 'none';
        }
    }

    async sendNotification() {
        const form = document.getElementById('notificationForm');
        const formData = new FormData(form);
        
        try {
            const notificationData = Object.fromEntries(formData);
            notificationData.sendPush = notificationData.sendPush === 'on';
            
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.sendNotification(notificationData);
            }
            
            this.app.showSuccess('알림이 발송되었습니다.');
            this.app.closeModal();
            this.load();
        } catch (error) {
            this.app.showError('알림 발송에 실패했습니다.');
        }
    }

    showBulkModal() {
        this.app.showModal('일괄 알림 발송', '<p>일괄 발송 기능은 준비 중입니다.</p>');
    }

    showScheduleModal() {
        this.app.showModal('예약 발송', '<p>예약 발송 기능은 준비 중입니다.</p>');
    }

    async deleteNotification(id) {
        if (!this.app.confirm('이 알림을 삭제하시겠습니까?')) return;

        try {
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.deleteData('notifications', id);
            }
            
            this.app.showSuccess('알림이 삭제되었습니다.');
            this.load();
        } catch (error) {
            this.app.showError('알림 삭제에 실패했습니다.');
        }
    }
}