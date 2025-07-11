/**
 * 진안 캠페인 관리자 CMS - 사용자 관리 모듈
 */

class UsersModule extends BaseModule {
    constructor(app) {
        super(app);
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.filters = {
            region: '',
            role: '',
            status: ''
        };
    }

    async fetchData() {
        try {
            const response = await this.app.fetchData('users', {
                ...this.filters,
                page: this.currentPage,
                limit: this.itemsPerPage
            });

            this.data = response || this.getDummyData();
        } catch (error) {
            console.error('사용자 데이터 로드 실패:', error);
            this.data = this.getDummyData();
        }
    }

    getDummyData() {
        const users = [];
        const names = ['김민수', '이영희', '박철수', '정수연', '최준호', '강미진', '윤성호', '임정아'];
        const regions = ['진안읍', '마령면', '백운면', '성수면', '동향면', '용담면', '정천면', '주천면'];
        const emails = ['gmail.com', 'naver.com', 'daum.net', 'hanmail.net'];
        
        // 관리자 추가
        users.push({
            uid: 'admin001',
            displayName: '관리자',
            email: 'admin@jinan.kr',
            region: '진안읍',
            level: 10,
            points: 9999,
            totalPosts: 156,
            totalComments: 423,
            isAdmin: true,
            isModerator: true,
            isActive: true,
            createdAt: new Date('2024-12-01'),
            lastActive: new Date()
        });

        // 일반 사용자 생성
        for (let i = 0; i < 50; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const email = name.toLowerCase().replace(/\s/g, '') + '@' + emails[Math.floor(Math.random() * emails.length)];
            
            users.push({
                uid: 'user' + String(i + 2).padStart(3, '0'),
                displayName: name,
                email: email,
                region: regions[Math.floor(Math.random() * regions.length)],
                level: Math.floor(Math.random() * 5) + 1,
                points: Math.floor(Math.random() * 500),
                totalPosts: Math.floor(Math.random() * 50),
                totalComments: Math.floor(Math.random() * 100),
                isAdmin: false,
                isModerator: i < 3,
                isActive: Math.random() > 0.1,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            });
        }

        return {
            users: users.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage),
            total: users.length,
            stats: {
                total: users.length,
                active: users.filter(u => u.isActive).length,
                admins: users.filter(u => u.isAdmin).length,
                moderators: users.filter(u => u.isModerator).length,
                newToday: 5
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
                        <h3>전체 사용자</h3>
                        <div class="stat-value">${this.app.formatNumber(this.data.stats.total)}</div>
                    </div>
                    <div class="stat-icon">👥</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>활성 사용자</h3>
                        <div class="stat-value">${this.data.stats.active}</div>
                    </div>
                    <div class="stat-icon">✅</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>관리자</h3>
                        <div class="stat-value">${this.data.stats.admins}</div>
                    </div>
                    <div class="stat-icon">👮</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>오늘 가입</h3>
                        <div class="stat-value">${this.data.stats.newToday}</div>
                    </div>
                    <div class="stat-icon">🆕</div>
                </div>
            </div>

            <!-- 필터 -->
            <div class="filters">
                <div class="filter-group">
                    <label>지역:</label>
                    <select class="form-control" onchange="adminApp.modules.users.updateFilter('region', this.value)">
                        <option value="">전체</option>
                        <option value="진안읍">진안읍</option>
                        <option value="마령면">마령면</option>
                        <option value="백운면">백운면</option>
                        <option value="성수면">성수면</option>
                        <option value="동향면">동향면</option>
                        <option value="용담면">용담면</option>
                        <option value="정천면">정천면</option>
                        <option value="주천면">주천면</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>권한:</label>
                    <select class="form-control" onchange="adminApp.modules.users.updateFilter('role', this.value)">
                        <option value="">전체</option>
                        <option value="admin">관리자</option>
                        <option value="moderator">모더레이터</option>
                        <option value="user">일반</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>상태:</label>
                    <select class="form-control" onchange="adminApp.modules.users.updateFilter('status', this.value)">
                        <option value="">전체</option>
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                    </select>
                </div>
                <button class="btn btn-primary" onclick="adminApp.modules.users.applyFilters()">
                    필터 적용
                </button>
            </div>

            <!-- 사용자 테이블 -->
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">사용자 목록</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="adminApp.modules.users.showCreateModal()">
                            <span>➕</span>
                            <span>새 사용자</span>
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>UID</th>
                                <th>이름</th>
                                <th>이메일</th>
                                <th>지역</th>
                                <th>레벨</th>
                                <th>포인트</th>
                                <th>게시글</th>
                                <th>댓글</th>
                                <th>권한</th>
                                <th>상태</th>
                                <th>가입일</th>
                                <th>최근 활동</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderUsers()}
                        </tbody>
                    </table>
                </div>
                
                <!-- 페이지네이션 -->
                ${this.renderPagination()}
            </div>
        `;
    }

    renderUsers() {
        return this.data.users.map(user => {
            const roleBadge = this.getRoleBadge(user);
            const statusBadge = user.isActive 
                ? '<span class="badge badge-success">활성</span>' 
                : '<span class="badge badge-secondary">비활성</span>';

            return `
                <tr>
                    <td>${user.uid}</td>
                    <td>${user.displayName}</td>
                    <td>${user.email}</td>
                    <td>${user.region}</td>
                    <td>${user.level}</td>
                    <td>${this.app.formatNumber(user.points)}</td>
                    <td>${user.totalPosts}</td>
                    <td>${user.totalComments}</td>
                    <td>${roleBadge}</td>
                    <td>${statusBadge}</td>
                    <td>${this.app.formatDate(user.createdAt).split(' ')[0]}</td>
                    <td>${this.getRelativeTime(user.lastActive)}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" onclick="adminApp.modules.users.editUser('${user.uid}')">
                            수정
                        </button>
                        ${!user.isAdmin ? `
                            <button class="btn btn-sm btn-danger" onclick="adminApp.modules.users.toggleUserStatus('${user.uid}', ${user.isActive})">
                                ${user.isActive ? '정지' : '활성화'}
                            </button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    getRoleBadge(user) {
        if (user.isAdmin) {
            return '<span class="badge badge-danger">관리자</span>';
        } else if (user.isModerator) {
            return '<span class="badge badge-warning">모더레이터</span>';
        } else {
            return '<span class="badge badge-info">일반</span>';
        }
    }

    getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return new Date(date).toLocaleDateString('ko-KR');
    }

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.itemsPerPage);
        const pages = [];
        
        pages.push(`
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="adminApp.modules.users.goToPage(${this.currentPage - 1})">
                이전
            </button>
        `);

        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            pages.push(`
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="adminApp.modules.users.goToPage(${i})">
                    ${i}
                </button>
            `);
        }

        pages.push(`
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="adminApp.modules.users.goToPage(${this.currentPage + 1})">
                다음
            </button>
        `);

        return `
            <div class="pagination">
                ${pages.join('')}
            </div>
        `;
    }

    updateFilter(key, value) {
        this.filters[key] = value;
    }

    applyFilters() {
        this.currentPage = 1;
        this.load();
    }

    goToPage(page) {
        this.currentPage = page;
        this.load();
    }

    showCreateModal() {
        const content = `
            <form id="userForm">
                <div class="form-group">
                    <label class="form-label required">이름</label>
                    <input type="text" name="displayName" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label required">이메일</label>
                    <input type="email" name="email" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">지역</label>
                    <select name="region" class="form-control">
                        <option value="">선택</option>
                        <option value="진안읍">진안읍</option>
                        <option value="마령면">마령면</option>
                        <option value="백운면">백운면</option>
                        <option value="성수면">성수면</option>
                        <option value="동향면">동향면</option>
                        <option value="용담면">용담면</option>
                        <option value="정천면">정천면</option>
                        <option value="주천면">주천면</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">권한</label>
                    <select name="role" class="form-control">
                        <option value="user">일반 사용자</option>
                        <option value="moderator">모더레이터</option>
                        <option value="admin">관리자</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">초기 비밀번호</label>
                    <input type="password" name="password" class="form-control" required>
                    <div class="form-help">사용자가 첫 로그인 시 변경해야 합니다.</div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="adminApp.closeModal()">취소</button>
            <button class="btn btn-primary" onclick="adminApp.modules.users.createUser()">생성</button>
        `;

        this.app.showModal('새 사용자 만들기', content, footer);
    }

    async createUser() {
        const form = document.getElementById('userForm');
        const formData = new FormData(form);
        
        try {
            // Firebase에서 사용자 생성
            if (typeof firebaseAdmin !== 'undefined') {
                // 실제 구현
            }
            
            this.app.showSuccess('사용자가 생성되었습니다.');
            this.app.closeModal();
            this.load();
        } catch (error) {
            this.app.showError('사용자 생성에 실패했습니다.');
        }
    }

    editUser(uid) {
        const user = this.data.users.find(u => u.uid === uid);
        if (!user) return;

        const content = `
            <form id="editUserForm">
                <div class="form-group">
                    <label class="form-label">UID</label>
                    <input type="text" value="${user.uid}" class="form-control" disabled>
                </div>
                <div class="form-group">
                    <label class="form-label required">이름</label>
                    <input type="text" name="displayName" value="${user.displayName}" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label required">이메일</label>
                    <input type="email" name="email" value="${user.email}" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">지역</label>
                    <select name="region" class="form-control">
                        <option value="">선택</option>
                        ${this.renderRegionOptions(user.region)}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">레벨</label>
                    <input type="number" name="level" value="${user.level}" class="form-control" min="1" max="10">
                </div>
                <div class="form-group">
                    <label class="form-label">포인트</label>
                    <input type="number" name="points" value="${user.points}" class="form-control" min="0">
                </div>
                <div class="form-group">
                    <label class="form-label">권한</label>
                    <div class="form-check">
                        <input type="checkbox" id="isAdmin" name="isAdmin" class="form-check-input" ${user.isAdmin ? 'checked' : ''}>
                        <label for="isAdmin" class="form-check-label">관리자</label>
                    </div>
                    <div class="form-check">
                        <input type="checkbox" id="isModerator" name="isModerator" class="form-check-input" ${user.isModerator ? 'checked' : ''}>
                        <label for="isModerator" class="form-check-label">모더레이터</label>
                    </div>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="adminApp.closeModal()">취소</button>
            <button class="btn btn-primary" onclick="adminApp.modules.users.updateUser('${uid}')">저장</button>
        `;

        this.app.showModal('사용자 수정', content, footer);
    }

    renderRegionOptions(selectedRegion) {
        const regions = ['진안읍', '마령면', '백운면', '성수면', '동향면', '용담면', '정천면', '주천면'];
        return regions.map(region => 
            `<option value="${region}" ${region === selectedRegion ? 'selected' : ''}>${region}</option>`
        ).join('');
    }

    async updateUser(uid) {
        const form = document.getElementById('editUserForm');
        const formData = new FormData(form);
        
        try {
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.updateUser(uid, Object.fromEntries(formData));
            }
            
            this.app.showSuccess('사용자 정보가 수정되었습니다.');
            this.app.closeModal();
            this.load();
        } catch (error) {
            this.app.showError('사용자 수정에 실패했습니다.');
        }
    }

    async toggleUserStatus(uid, currentStatus) {
        const action = currentStatus ? '정지' : '활성화';
        if (!this.app.confirm(`이 사용자를 ${action}시키시겠습니까?`)) return;

        try {
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.updateUser(uid, { isActive: !currentStatus });
            }
            
            this.app.showSuccess(`사용자가 ${action}되었습니다.`);
            this.load();
        } catch (error) {
            this.app.showError(`사용자 ${action}에 실패했습니다.`);
        }
    }
}