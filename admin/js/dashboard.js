/**
 * 진안 캠페인 관리자 CMS - 대시보드 모듈
 */

class DashboardModule extends BaseModule {
    constructor(app) {
        super(app);
        this.charts = {};
        this.updateInterval = null;
    }

    async fetchData() {
        try {
            // 통계 데이터 로드
            this.data.stats = await this.app.fetchData('campaigns/stats');
            this.data.recentSignatures = await this.app.fetchData('signatures/recent');
            this.data.recentActivities = await this.app.fetchData('activities/recent');
            this.data.dailyStats = await this.app.fetchData('statistics/daily');
            this.data.regionStats = await this.app.fetchData('statistics/region');
        } catch (error) {
            console.error('대시보드 데이터 로드 실패:', error);
            // 더미 데이터 사용
            this.loadDummyData();
        }
    }

    loadDummyData() {
        this.data = {
            stats: {
                totalSignatures: 1247,
                signatureGrowth: 12.3,
                activeUsers: 89,
                userGrowth: 5.2,
                totalPosts: 234,
                postGrowth: 8.7,
                voteParticipation: 78,
                voteGrowth: -2.1
            },
            recentSignatures: [
                { id: 1, name: '김민수', region: '진안읍', timestamp: new Date() },
                { id: 2, name: '이영희', region: '마령면', timestamp: new Date(Date.now() - 300000) },
                { id: 3, name: '박철수', region: '백운면', timestamp: new Date(Date.now() - 600000) }
            ],
            recentActivities: [
                { id: 1, type: 'signature', user: '김민수', content: '새로운 서명 참여', timestamp: new Date(Date.now() - 300000) },
                { id: 2, type: 'post', user: '이영희', content: '새 게시글 작성: "목조전망대 반대 이유"', timestamp: new Date(Date.now() - 720000) },
                { id: 3, type: 'vote', user: '박철수', content: '투표 참여: "목조전망대 사업 최종 의견"', timestamp: new Date(Date.now() - 1380000) }
            ],
            dailyStats: {
                labels: ['12/1', '12/2', '12/3', '12/4', '12/5', '12/6', '12/7'],
                signatures: [45, 52, 78, 95, 102, 125, 143],
                posts: [12, 15, 23, 28, 31, 38, 45],
                users: [5, 8, 12, 15, 18, 20, 23]
            },
            regionStats: {
                labels: ['진안읍', '마령면', '백운면', '성수면', '기타'],
                data: [456, 234, 178, 145, 234]
            }
        };
    }

    render() {
        const content = this.getContent();
        content.innerHTML = `
            <!-- 통계 카드 -->
            <div class="stats-grid">
                ${this.renderStatCard('총 서명 수', this.data.stats.totalSignatures, this.data.stats.signatureGrowth, '✍️')}
                ${this.renderStatCard('활성 사용자', this.data.stats.activeUsers, this.data.stats.userGrowth, '👥')}
                ${this.renderStatCard('총 게시글', this.data.stats.totalPosts, this.data.stats.postGrowth, '📝')}
                ${this.renderStatCard('투표 참여율', this.data.stats.voteParticipation + '%', this.data.stats.voteGrowth, '🗳️')}
            </div>

            <!-- 차트 섹션 -->
            <div class="chart-grid">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">일별 활동 추이</h3>
                        <div class="chart-actions">
                            <select class="form-control" onchange="adminApp.modules.dashboard.changePeriod(this.value)">
                                <option value="7">최근 7일</option>
                                <option value="30">최근 30일</option>
                                <option value="90">최근 90일</option>
                            </select>
                        </div>
                    </div>
                    <canvas id="activityChart" height="100"></canvas>
                </div>

                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">지역별 서명 분포</h3>
                    </div>
                    <canvas id="regionChart" height="100"></canvas>
                </div>
            </div>

            <!-- 실시간 서명 -->
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">실시간 서명 현황</h3>
                    <div class="table-actions">
                        <span class="badge badge-success">실시간</span>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>시간</th>
                            <th>이름</th>
                            <th>지역</th>
                            <th>상태</th>
                        </tr>
                    </thead>
                    <tbody id="realtimeSignatures">
                        ${this.renderRealtimeSignatures()}
                    </tbody>
                </table>
            </div>

            <!-- 최근 활동 -->
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">최근 활동</h3>
                    <div class="table-actions">
                        <button class="btn btn-sm btn-secondary" onclick="adminApp.modules.dashboard.viewAllActivities()">
                            전체 보기
                        </button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>시간</th>
                            <th>유형</th>
                            <th>사용자</th>
                            <th>내용</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderRecentActivities()}
                    </tbody>
                </table>
            </div>
        `;

        // 차트 초기화
        setTimeout(() => {
            this.initializeCharts();
        }, 100);

        // 실시간 업데이트 시작
        this.startRealtimeUpdates();
    }

    renderStatCard(title, value, change, icon) {
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const changeIcon = change >= 0 ? '↑' : '↓';
        
        return `
            <div class="stat-card fade-in">
                <div class="stat-info">
                    <h3>${title}</h3>
                    <div class="stat-value">${this.app.formatNumber(value)}</div>
                    <div class="stat-change ${changeClass}">
                        <span>${changeIcon}</span>
                        <span>${Math.abs(change)}% 증가</span>
                    </div>
                </div>
                <div class="stat-icon">${icon}</div>
            </div>
        `;
    }

    renderRealtimeSignatures() {
        return this.data.recentSignatures.map(sig => `
            <tr>
                <td>${this.getRelativeTime(sig.timestamp)}</td>
                <td>${sig.name}</td>
                <td>${sig.region}</td>
                <td><span class="badge badge-success">신규</span></td>
            </tr>
        `).join('');
    }

    renderRecentActivities() {
        return this.data.recentActivities.map(activity => {
            const badge = this.getActivityBadge(activity.type);
            return `
                <tr>
                    <td>${this.getRelativeTime(activity.timestamp)}</td>
                    <td>${badge}</td>
                    <td>${activity.user}</td>
                    <td>${activity.content}</td>
                </tr>
            `;
        }).join('');
    }

    getActivityBadge(type) {
        const badges = {
            signature: '<span class="badge badge-success">서명</span>',
            post: '<span class="badge badge-info">게시글</span>',
            vote: '<span class="badge badge-warning">투표</span>',
            comment: '<span class="badge badge-secondary">댓글</span>'
        };
        return badges[type] || '<span class="badge">기타</span>';
    }

    getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '방금 전';
        if (minutes < 60) return `${minutes}분 전`;
        if (hours < 24) return `${hours}시간 전`;
        if (days < 7) return `${days}일 전`;
        
        return new Date(date).toLocaleDateString('ko-KR');
    }

    initializeCharts() {
        // 활동 추이 차트
        const activityCtx = document.getElementById('activityChart');
        if (activityCtx) {
            this.charts.activity = new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: this.data.dailyStats.labels,
                    datasets: [
                        {
                            label: '서명',
                            data: this.data.dailyStats.signatures,
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.3
                        },
                        {
                            label: '게시글',
                            data: this.data.dailyStats.posts,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.3
                        },
                        {
                            label: '신규 사용자',
                            data: this.data.dailyStats.users,
                            borderColor: '#f59e0b',
                            backgroundColor: 'rgba(245, 158, 11, 0.1)',
                            tension: 0.3
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            padding: 12,
                            cornerRadius: 8
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.05)'
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            }
                        }
                    }
                }
            });
        }

        // 지역별 분포 차트
        const regionCtx = document.getElementById('regionChart');
        if (regionCtx) {
            this.charts.region = new Chart(regionCtx, {
                type: 'doughnut',
                data: {
                    labels: this.data.regionStats.labels,
                    datasets: [{
                        data: this.data.regionStats.data,
                        backgroundColor: [
                            '#667eea',
                            '#764ba2',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const label = context.label || '';
                                    const value = context.parsed || 0;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value}명 (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // 차트 저장
        this.app.state.charts = this.charts;
    }

    startRealtimeUpdates() {
        // 5초마다 업데이트
        this.updateInterval = setInterval(() => {
            this.updateRealtimeData();
        }, 5000);

        // 인터벌 저장
        if (!this.app.state.intervals) {
            this.app.state.intervals = {};
        }
        this.app.state.intervals.dashboard = this.updateInterval;
    }

    updateRealtimeData() {
        // 서명 수 업데이트 시뮬레이션
        if (Math.random() < 0.3) {
            const increment = Math.floor(Math.random() * 3) + 1;
            this.data.stats.totalSignatures += increment;
            
            // 통계 카드 업데이트
            const statCard = document.querySelector('.stat-card .stat-value');
            if (statCard) {
                statCard.textContent = this.app.formatNumber(this.data.stats.totalSignatures);
                statCard.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    statCard.style.animation = '';
                }, 500);
            }

            // 실시간 서명 추가
            this.addRealtimeSignature();
        }
    }

    addRealtimeSignature() {
        const names = ['김민수', '이영희', '박철수', '정수연', '최준호'];
        const regions = ['진안읍', '마령면', '백운면', '성수면', '동향면'];
        
        const newSignature = {
            id: Date.now(),
            name: names[Math.floor(Math.random() * names.length)],
            region: regions[Math.floor(Math.random() * regions.length)],
            timestamp: new Date()
        };

        // 배열 업데이트
        this.data.recentSignatures.unshift(newSignature);
        this.data.recentSignatures = this.data.recentSignatures.slice(0, 5);

        // DOM 업데이트
        const tbody = document.getElementById('realtimeSignatures');
        if (tbody) {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${this.getRelativeTime(newSignature.timestamp)}</td>
                <td>${newSignature.name}</td>
                <td>${newSignature.region}</td>
                <td><span class="badge badge-success">신규</span></td>
            `;
            newRow.style.animation = 'slideIn 0.5s ease';
            
            tbody.insertBefore(newRow, tbody.firstChild);
            
            // 오래된 행 제거
            if (tbody.children.length > 5) {
                tbody.removeChild(tbody.lastChild);
            }
        }
    }

    changePeriod(days) {
        console.log('기간 변경:', days);
        // 새로운 기간의 데이터 로드 및 차트 업데이트
        this.updateChartData(days);
    }

    updateChartData(days) {
        // 실제로는 서버에서 새 데이터 로드
        // 여기서는 시뮬레이션
        const labels = [];
        const signatures = [];
        const posts = [];
        const users = [];

        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
            
            signatures.push(Math.floor(Math.random() * 150) + 50);
            posts.push(Math.floor(Math.random() * 50) + 10);
            users.push(Math.floor(Math.random() * 30) + 5);
        }

        // 차트 업데이트
        if (this.charts.activity) {
            this.charts.activity.data.labels = labels;
            this.charts.activity.data.datasets[0].data = signatures;
            this.charts.activity.data.datasets[1].data = posts;
            this.charts.activity.data.datasets[2].data = users;
            this.charts.activity.update();
        }
    }

    viewAllActivities() {
        this.app.showModal('전체 활동 내역', '<p>전체 활동 내역 페이지로 이동합니다.</p>');
    }

    destroy() {
        // 인터벌 정리
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // 차트 정리
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
    }
}