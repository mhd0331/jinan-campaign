/**
 * 진안 캠페인 관리자 CMS - 투표 관리 모듈
 */

class PollsModule extends BaseModule {
    constructor(app) {
        super(app);
        this.currentFilter = 'all';
    }

    async fetchData() {
        try {
            this.data = await this.app.fetchData('polls', {
                status: this.currentFilter
            });
        } catch (error) {
            console.error('투표 데이터 로드 실패:', error);
            this.data = this.getDummyData();
        }
    }

    getDummyData() {
        return {
            polls: [
                {
                    id: 1,
                    title: '목조전망대 사업 최종 의견',
                    description: '진안군 목조전망대 사업(445억원)에 대한 군민 여러분의 최종 의견을 듣고자 합니다.',
                    type: 'single',
                    options: [
                        { id: 1, text: '절대 반대', votes: 695, percentage: 77.8 },
                        { id: 2, text: '조건부 찬성', votes: 134, percentage: 15.0 },
                        { id: 3, text: '적극 찬성', votes: 63, percentage: 7.2 }
                    ],
                    totalVotes: 892,
                    isActive: true,
                    expiresAt: new Date('2024-12-22'),
                    createdAt: new Date('2024-12-07')
                },
                {
                    id: 2,
                    title: '목조전망대 예산 적정성',
                    description: '445억원 예산이 적정하다고 생각하십니까?',
                    type: 'single',
                    options: [
                        { id: 1, text: '과도함', votes: 1195, percentage: 82.0 },
                        { id: 2, text: '적정함', votes: 261, percentage: 18.0 }
                    ],
                    totalVotes: 1456,
                    isActive: false,
                    expiresAt: new Date('2024-11-30'),
                    createdAt: new Date('2024-11-20')
                }
            ],
            stats: {
                total: 5,
                active: 2,
                completed: 3,
                totalVotes: 3523
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
                        <h3>전체 투표</h3>
                        <div class="stat-value">${this.data.stats.total}</div>
                    </div>
                    <div class="stat-icon">🗳️</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>진행중</h3>
                        <div class="stat-value">${this.data.stats.active}</div>
                    </div>
                    <div class="stat-icon">▶️</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>완료됨</h3>
                        <div class="stat-value">${this.data.stats.completed}</div>
                    </div>
                    <div class="stat-icon">✅</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>총 참여자</h3>
                        <div class="stat-value">${this.app.formatNumber(this.data.stats.totalVotes)}</div>
                    </div>
                    <div class="stat-icon">👥</div>
                </div>
            </div>

            <!-- 필터 탭 -->
            <div class="tabs">
                <button class="tab ${this.currentFilter === 'all' ? 'active' : ''}" 
                        onclick="adminApp.modules.polls.changeFilter('all')">전체</button>
                <button class="tab ${this.currentFilter === 'active' ? 'active' : ''}" 
                        onclick="adminApp.modules.polls.changeFilter('active')">진행중</button>
                <button class="tab ${this.currentFilter === 'completed' ? 'active' : ''}" 
                        onclick="adminApp.modules.polls.changeFilter('completed')">완료됨</button>
            </div>

            <!-- 투표 목록 -->
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">투표 목록</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="adminApp.modules.polls.showCreateModal()">
                            <span>➕</span>
                            <span>새 투표</span>
                        </button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>제목</th>
                            <th>설명</th>
                            <th>유형</th>
                            <th>총 투표수</th>
                            <th>상태</th>
                            <th>마감일</th>
                            <th>액션</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderPolls()}
                    </tbody>
                </table>
            </div>

            <!-- 실시간 투표 현황 -->
            ${this.renderActivePollsDetail()}
        `;
    }

    renderPolls() {
        return this.data.polls.map(poll => `
            <tr>
                <td>${poll.id}</td>
                <td>${poll.title}</td>
                <td>${poll.description.substring(0, 50)}...</td>
                <td><span class="badge badge-info">${this.getPollTypeText(poll.type)}</span></td>
                <td>${this.app.formatNumber(poll.totalVotes)}</td>
                <td>
                    <span class="badge badge-${poll.isActive ? 'success' : 'danger'}">
                        ${poll.isActive ? '진행중' : '마감'}
                    </span>
                </td>
                <td>${this.app.formatDate(poll.expiresAt).split(' ')[0]}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="adminApp.modules.polls.viewResults(${poll.id})">
                        결과
                    </button>
                    ${poll.isActive ? `
                        <button class="btn btn-sm btn-secondary" onclick="adminApp.modules.polls.editPoll(${poll.id})">
                            수정
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="adminApp.modules.polls.closePoll(${poll.id})">
                            마감
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    renderActivePollsDetail() {
        const activePolls = this.data.polls.filter(p => p.isActive);
        if (activePolls.length === 0) return '';

        return `
            <div class="chart-container">
                <h3 class="chart-title">실시간 투표 현황</h3>
                ${activePolls.map(poll => this.renderPollChart(poll)).join('')}
            </div>
        `;
    }

    renderPollChart(poll) {
        return `
            <div class="poll-detail">
                <h4>${poll.title}</h4>
                <p>총 ${poll.totalVotes}명 참여</p>
                <div class="poll-options">
                    ${poll.options.map(option => `
                        <div class="poll-option-result">
                            <div class="option-header">
                                <span>${option.text}</span>
                                <span>${option.votes}표 (${option.percentage}%)</span>
                            </div>
                            <div class="progress">
                                <div class="progress-bar" style="width: ${option.percentage}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getPollTypeText(type) {
        const types = {
            'single': '단일선택',
            'multiple': '복수선택',
            'discussion': '토론형'
        };
        return types[type] || type;
    }

    changeFilter(filter) {
        this.currentFilter = filter;
        this.load();
    }

    showCreateModal() {
        const content = `
            <form id="pollForm">
                <div class="form-group">
                    <label class="form-label">제목</label>
                    <input type="text" name="title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">설명</label>
                    <textarea name="description" rows="3" class="form-control" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">투표 유형</label>
                    <select name="type" class="form-control" required>
                        <option value="single">단일 선택</option>
                        <option value="multiple">복수 선택</option>
                        <option value="discussion">토론형</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">선택지 (한 줄에 하나씩)</label>
                    <textarea name="options" rows="5" class="form-control" required 
                              placeholder="절대 반대&#10;조건부 찬성&#10;적극 찬성"></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">마감일시</label>
                    <input type="datetime-local" name="expiresAt" class="form-control">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="adminApp.closeModal()">취소</button>
            <button class="btn btn-primary" onclick="adminApp.modules.polls.createPoll()">생성</button>
        `;

        this.app.showModal('새 투표 만들기', content, footer);
    }

    async createPoll() {
        const form = document.getElementById('pollForm');
        const formData = new FormData(form);
        
        try {
            const pollData = Object.fromEntries(formData);
            pollData.options = pollData.options.split('\n').filter(o => o.trim());
            
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.createPoll(pollData);
            }
            
            this.app.showSuccess('투표가 생성되었습니다.');
            this.app.closeModal();
            this.load();
        } catch (error) {
            this.app.showError('투표 생성에 실패했습니다.');
        }
    }

    viewResults(id) {
        // 상세 결과 페이지로 이동
        this.app.loadPage('poll-votes');
    }

    async closePoll(id) {
        if (!this.app.confirm('이 투표를 마감하시겠습니까?')) return;

        try {
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.closePoll(id);
            }
            
            this.app.showSuccess('투표가 마감되었습니다.');
            this.load();
        } catch (error) {
            this.app.showError('투표 마감에 실패했습니다.');
        }
    }

    editPoll(id) {
        console.log('투표 수정:', id);
    }
}