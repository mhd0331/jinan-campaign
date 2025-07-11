/**
 * 진안 캠페인 관리자 CMS - 서명 관리 모듈
 */

class SignaturesModule extends BaseModule {
    constructor(app) {
        super(app);
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.filters = {
            region: '',
            status: '',
            startDate: '',
            endDate: ''
        };
    }

    async fetchData() {
        try {
            // 서명 데이터 로드
            const response = await this.app.fetchData('signatures', {
                ...this.filters,
                page: this.currentPage,
                limit: this.itemsPerPage
            });

            this.data = response || this.getDummyData();
        } catch (error) {
            console.error('서명 데이터 로드 실패:', error);
            this.data = this.getDummyData();
        }
    }

    getDummyData() {
        const signatures = [];
        const names = ['김민수', '이영희', '박철수', '정수연', '최준호', '강미진', '윤성호', '임정아'];
        const regions = ['진안읍', '마령면', '백운면', '성수면', '동향면', '용담면', '정천면', '주천면'];
        const statuses = ['pending', 'verified', 'rejected'];
        const comments = [
            '절대 반대합니다. 혈세낭비입니다.',
            '주민 의견 무시하는 행정 반대',
            '445억은 너무 과도한 예산입니다.',
            '더 시급한 현안이 많습니다.',
            '투명한 행정을 요구합니다.'
        ];

        for (let i = 0; i < 50; i++) {
            signatures.push({
                id: i + 1,
                name: names[Math.floor(Math.random() * names.length)],
                region: regions[Math.floor(Math.random() * regions.length)],
                phone: Math.random() > 0.5 ? '010-****-' + Math.floor(Math.random() * 9000 + 1000) : null,
                comment: comments[Math.floor(Math.random() * comments.length)],
                isPublic: Math.random() > 0.3,
                allowContact: Math.random() > 0.5,
                verificationStatus: statuses[Math.floor(Math.random() * statuses.length)],
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                ipHash: 'hash_' + Math.random().toString(36).substr(2, 9)
            });
        }

        return {
            signatures: signatures.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage),
            total: signatures.length,
            stats: {
                total: 1247,
                pending: 23,
                verified: 1198,
                rejected: 26,
                todayCount: 143
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
                        <h3>전체 서명</h3>
                        <div class="stat-value">${this.app.formatNumber(this.data.stats.total)}</div>
                    </div>
                    <div class="stat-icon">✍️</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>대기중</h3>
                        <div class="stat-value">${this.data.stats.pending}</div>
                    </div>
                    <div class="stat-icon">⏳</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>확인됨</h3>
                        <div class="stat-value">${this.app.formatNumber(this.data.stats.verified)}</div>
                    </div>
                    <div class="stat-icon">✅</div>
                </div>
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>오늘 서명</h3>
                        <div class="stat-value">${this.data.stats.todayCount}</div>
                    </div>
                    <div class="stat-icon">📅</div>
                </div>
            </div>

            <!-- 필터 -->
            <div class="filters">
                <div class="filter-group">
                    <label>지역:</label>
                    <select id="regionFilter" class="form-control" onchange="adminApp.modules.signatures.updateFilter('region', this.value)">
                        <option value="">전체</option>
                        <option value="진안읍">진안읍</option>
                        <option value="마령면">마령면</option>
                        <option value="백운면">백운면</option>
                        <option value="성수면">성수면</option>
                        <option value="동향면">동향면</option>
                        <option value="용담면">용담면</option>
                        <option value="정천면">정천면</option>
                        <option value="주천면">주천면</option>
                        <option value="안천면">안천면</option>
                        <option value="부귀면">부귀면</option>
                        <option value="상전면">상전면</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>상태:</label>
                    <select id="statusFilter" class="form-control" onchange="adminApp.modules.signatures.updateFilter('status', this.value)">
                        <option value="">전체</option>
                        <option value="pending">대기중</option>
                        <option value="verified">확인됨</option>
                        <option value="rejected">거부됨</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>시작일:</label>
                    <input type="date" id="startDate" class="form-control" onchange="adminApp.modules.signatures.updateFilter('startDate', this.value)">
                </div>
                <div class="filter-group">
                    <label>종료일:</label>
                    <input type="date" id="endDate" class="form-control" onchange="adminApp.modules.signatures.updateFilter('endDate', this.value)">
                </div>
                <button class="btn btn-primary" onclick="adminApp.modules.signatures.applyFilters()">
                    필터 적용
                </button>
                <button class="btn btn-secondary" onclick="adminApp.modules.signatures.resetFilters()">
                    초기화
                </button>
            </div>

            <!-- 서명 테이블 -->
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">서명 목록</h3>
                    <div class="table-actions">
                        <button class="btn btn-secondary" onclick="adminApp.modules.signatures.verifyBulk()">
                            <span>✅</span>
                            <span>일괄 확인</span>
                        </button>
                        <button class="btn btn-primary" onclick="adminApp.modules.signatures.exportData()">
                            <span>📥</span>
                            <span>엑셀 내보내기</span>
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <input type="checkbox" onchange="adminApp.modules.signatures.toggleAll(this)">
                                </th>
                                <th>ID</th>
                                <th>이름</th>
                                <th>지역</th>
                                <th>연락처</th>
                                <th>의견</th>
                                <th>공개</th>
                                <th>연락</th>
                                <th>상태</th>
                                <th>서명일시</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderSignatures()}
                        </tbody>
                    </table>
                </div>
                
                <!-- 페이지네이션 -->
                ${this.renderPagination()}
            </div>
        `;
    }

    renderSignatures() {
        return this.data.signatures.map(sig => {
            const statusBadge = this.getStatusBadge(sig.verificationStatus);
            const publicBadge = sig.isPublic 
                ? '<span class="badge badge-success">예</span>' 
                : '<span class="badge badge-secondary">아니오</span>';
            const contactBadge = sig.allowContact 
                ? '<span class="badge badge-success">예</span>' 
                : '<span class="badge badge-secondary">아니오</span>';

            return `
                <tr>
                    <td>
                        <input type="checkbox" value="${sig.id}" class="signature-check">
                    </td>
                    <td>${sig.id}</td>
                    <td>${sig.name}</td>
                    <td>${sig.region}</td>
                    <td>${sig.phone || '-'}</td>
                    <td class="text-truncate" style="max-width: 200px" title="${sig.comment}">
                        ${sig.comment}
                    </td>
                    <td>${publicBadge}</td>
                    <td>${contactBadge}</td>
                    <td>${statusBadge}</td>
                    <td>${this.app.formatDate(sig.timestamp)}</td>
                    <td>
                        ${this.renderActions(sig)}
                    </td>
                </tr>
            `;
        }).join('');
    }

    getStatusBadge(status) {
        const badges = {
            pending: '<span class="badge badge-warning">대기중</span>',
            verified: '<span class="badge badge-success">확인됨</span>',
            rejected: '<span class="badge badge-danger">거부됨</span>'
        };
        return badges[status] || '<span class="badge">알 수 없음</span>';
    }

    renderActions(signature) {
        if (signature.verificationStatus === 'pending') {
            return `
                <button class="btn btn-sm btn-success" onclick="adminApp.modules.signatures.verify(${signature.id})">
                    확인
                </button>
                <button class="btn btn-sm btn-danger" onclick="adminApp.modules.signatures.reject(${signature.id})">
                    거부
                </button>
            `;
        } else {
            return `
                <button class="btn btn-sm btn-secondary" onclick="adminApp.modules.signatures.viewDetail(${signature.id})">
                    상세
                </button>
            `;
        }
    }

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.itemsPerPage);
        const pages = [];
        
        // 이전 버튼
        pages.push(`
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="adminApp.modules.signatures.goToPage(${this.currentPage - 1})">
                이전
            </button>
        `);

        // 페이지 번호
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            pages.push(`
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="adminApp.modules.signatures.goToPage(${i})">
                    ${i}
                </button>
            `);
        }

        // 다음 버튼
        pages.push(`
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="adminApp.modules.signatures.goToPage(${this.currentPage + 1})">
                다음
            </button>
        `);

        return `
            <div class="pagination">
                ${pages.join('')}
                <span class="pagination-info">
                    총 ${this.app.formatNumber(this.data.total)}개 중 
                    ${(this.currentPage - 1) * this.itemsPerPage + 1}-${Math.min(this.currentPage * this.itemsPerPage, this.data.total)}
                </span>
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

    resetFilters() {
        this.filters = {
            region: '',
            status: '',
            startDate: '',
            endDate: ''
        };
        
        // UI 초기화
        document.getElementById('regionFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        
        this.currentPage = 1;
        this.load();
    }

    goToPage(page) {
        this.currentPage = page;
        this.load();
    }

    toggleAll(checkbox) {
        const checkboxes = document.querySelectorAll('.signature-check');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
    }

    getSelectedIds() {
        const checkboxes = document.querySelectorAll('.signature-check:checked');
        return Array.from(checkboxes).map(cb => cb.value);
    }

    async verify(id) {
        try {
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.updateSignatureStatus(id, 'verified');
            }
            
            this.app.showSuccess('서명이 확인되었습니다.');
            this.load();
        } catch (error) {
            this.app.showError('서명 확인에 실패했습니다.');
        }
    }

    async reject(id) {
        if (!this.app.confirm('이 서명을 거부하시겠습니까?')) return;

        try {
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.updateSignatureStatus(id, 'rejected');
            }
            
            this.app.showSuccess('서명이 거부되었습니다.');
            this.load();
        } catch (error) {
            this.app.showError('서명 거부에 실패했습니다.');
        }
    }

    async verifyBulk() {
        const ids = this.getSelectedIds();
        if (ids.length === 0) {
            this.app.showError('선택된 서명이 없습니다.');
            return;
        }

        if (!this.app.confirm(`선택한 ${ids.length}개의 서명을 확인하시겠습니까?`)) return;

        try {
            // 일괄 처리
            for (const id of ids) {
                if (typeof firebaseAdmin !== 'undefined') {
                    await firebaseAdmin.updateSignatureStatus(id, 'verified');
                }
            }
            
            this.app.showSuccess(`${ids.length}개의 서명이 확인되었습니다.`);
            this.load();
        } catch (error) {
            this.app.showError('일괄 확인에 실패했습니다.');
        }
    }

    viewDetail(id) {
        const signature = this.data.signatures.find(s => s.id === id);
        if (!signature) return;

        const content = `
            <div class="signature-detail">
                <div class="form-group">
                    <label>ID:</label>
                    <p>${signature.id}</p>
                </div>
                <div class="form-group">
                    <label>이름:</label>
                    <p>${signature.name}</p>
                </div>
                <div class="form-group">
                    <label>지역:</label>
                    <p>${signature.region}</p>
                </div>
                <div class="form-group">
                    <label>연락처:</label>
                    <p>${signature.phone || '미제공'}</p>
                </div>
                <div class="form-group">
                    <label>의견:</label>
                    <p>${signature.comment}</p>
                </div>
                <div class="form-group">
                    <label>서명일시:</label>
                    <p>${this.app.formatDate(signature.timestamp)}</p>
                </div>
                <div class="form-group">
                    <label>IP 해시:</label>
                    <p style="font-family: monospace; font-size: 0.875rem;">${signature.ipHash}</p>
                </div>
            </div>
        `;

        this.app.showModal('서명 상세 정보', content);
    }

    async exportData() {
        try {
            this.app.showToast('엑셀 파일을 생성하고 있습니다...', 'info');

            if (typeof firebaseAdmin !== 'undefined') {
                const csv = await firebaseAdmin.exportSignatures('jinan-wooden-tower');
                const filename = `signatures_${new Date().toISOString().split('T')[0]}.csv`;
                firebaseAdmin.downloadCSV(filename, csv);
            } else {
                // 더미 데이터로 CSV 생성
                this.exportDummyData();
            }
            
            this.app.showSuccess('엑셀 파일이 다운로드되었습니다.');
        } catch (error) {
            this.app.showError('내보내기에 실패했습니다.');
        }
    }

    exportDummyData() {
        const headers = ['ID', '이름', '지역', '연락처', '의견', '공개동의', '연락동의', '상태', '서명일시'];
        const rows = this.data.signatures.map(sig => [
            sig.id,
            sig.name,
            sig.region,
            sig.phone || '',
            sig.comment,
            sig.isPublic ? '예' : '아니오',
            sig.allowContact ? '예' : '아니오',
            this.getStatusText(sig.verificationStatus),
            this.app.formatDate(sig.timestamp)
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `signatures_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
    }

    getStatusText(status) {
        const texts = {
            pending: '대기중',
            verified: '확인됨',
            rejected: '거부됨'
        };
        return texts[status] || '알 수 없음';
    }
}