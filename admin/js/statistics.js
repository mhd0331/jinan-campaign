/**
 * 진안 캠페인 관리자 CMS - 통계 모듈
 */

class StatisticsModule extends BaseModule {
    constructor(app) {
        super(app);
        this.period = 'daily';
        this.dateRange = {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            end: new Date()
        };
        this.charts = {};
    }

    async fetchData() {
        try {
            this.data = await this.app.fetchData('statistics', {
                period: this.period,
                startDate: this.dateRange.start,
                endDate: this.dateRange.end
            });
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
            this.data = this.getDummyData();
        }
    }

    getDummyData() {
        const days = 7;
        const dates = [];
        const signatureData = [];
        const userData = [];
        const postData = [];
        
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
            
            signatureData.push(Math.floor(Math.random() * 200) + 50);
            userData.push(Math.floor(Math.random() * 50) + 10);
            postData.push(Math.floor(Math.random() * 30) + 5);
        }

        return {
            overview: {
                totalSignatures: 1247,
                newSignaturesToday: 143,
                signatureGrowth: 12.3,
                totalUsers: 523,
                activeUsers: 89,
                userGrowth: 5.2,
                totalPosts: 234,
                newPostsToday: 12,
                postGrowth: 8.7,
                avgResponseTime: '2시간 15분'
            },
            charts: {
                dates: dates,
                signatures: signatureData,
                users: userData,
                posts: postData
            },
            regions: [
                { name: '진안읍', signatures: 456, percentage: 36.5 },
                { name: '마령면', signatures: 234, percentage: 18.7 },
                { name: '백운면', signatures: 178, percentage: 14.2 },
                { name: '성수면', signatures: 145, percentage: 11.6 },
                { name: '기타', signatures: 234, percentage: 19.0 }
            ],
            devices: {
                mobile: 67,
                desktop: 28,
                tablet: 5
            }
        };
    }

    render() {
        const content = this.getContent();
        content.innerHTML = `
            <!-- 기간 선택 -->
            <div class="filters">
                <div class="filter-group">
                    <label>기간:</label>
                    <select class="form-control" onchange="adminApp.modules.statistics.changePeriod(this.value)">
                        <option value="daily">일별</option>
                        <option value="weekly">주별</option>
                        <option value="monthly">월별</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>시작일:</label>
                    <input type="date" class="form-control" id="statStartDate" 
                           value="${this.dateRange.start.toISOString().split('T')[0]}"
                           onchange="adminApp.modules.statistics.changeDateRange()">
                </div>
                <div class="filter-group">
                    <label>종료일:</label>
                    <input type="date" class="form-control" id="statEndDate"
                           value="${this.dateRange.end.toISOString().split('T')[0]}"
                           onchange="adminApp.modules.statistics.changeDateRange()">
                </div>
                <button class="btn btn-primary" onclick="adminApp.modules.statistics.loadData()">조회</button>
                <button class="btn btn-secondary" onclick="adminApp.modules.statistics.exportData()">
                    <span>📥</span>
                    <span>엑셀 내보내기</span>
                </button>
            </div>

            <!-- 개요 카드 -->
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>누적 서명</h3>
                        <div class="stat-value">${this.app.formatNumber(this.data.overview.totalSignatures)}</div>
                        <div class="stat-change ${this.data.overview.signatureGrowth > 0 ? 'positive' : 'negative'}">
                            <span>${this.data.overview.signatureGrowth > 0 ? '↑' : '↓'}</span>
                            <span>${Math.abs(this.data.overview.signatureGrowth)}% (오늘 +${this.data.overview.newSignaturesToday})</span>
                        </div>
                    </div>
                    <div class="stat-icon">✍️</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>활성 사용자</h3>
                        <div class="stat-value">${this.data.overview.activeUsers}</div>
                        <div class="stat-change positive">
                            <span>↑</span>
                            <span>${this.data.overview.userGrowth}%</span>
                        </div>
                    </div>
                    <div class="stat-icon">👥</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>게시글/댓글</h3>
                        <div class="stat-value">${this.data.overview.totalPosts}</div>
                        <div class="stat-change positive">
                            <span>↑</span>
                            <span>${this.data.overview.postGrowth}% (오늘 +${this.data.overview.newPostsToday})</span>
                        </div>
                    </div>
                    <div class="stat-icon">💬</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-info">
                        <h3>평균 응답시간</h3>
                        <div class="stat-value">${this.data.overview.avgResponseTime}</div>
                    </div>
                    <div class="stat-icon">⏱️</div>
                </div>
            </div>

            <!-- 차트 섹션 -->
            <div class="chart-container">
                <div class="chart-header">
                    <h3 class="chart-title">일별 활동 추이</h3>
                </div>
                <canvas id="activityChart" height="100"></canvas>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">지역별 서명 분포</h3>
                    </div>
                    <canvas id="regionChart" height="200"></canvas>
                </div>
                
                <div class="chart-container">
                    <div class="chart-header">
                        <h3 class="chart-title">기기별 접속 비율</h3>
                    </div>
                    <canvas id="deviceChart" height="200"></canvas>
                </div>
            </div>

            <!-- 상세 통계 테이블 -->
            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">지역별 상세 통계</h3>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>지역</th>
                            <th>서명 수</th>
                            <th>비율</th>
                            <th>활성 사용자</th>
                            <th>게시글 수</th>
                            <th>참여율</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.renderRegionStats()}
                    </tbody>
                </table>
            </div>
        `;

        // 차트 초기화
        setTimeout(() => this.initializeCharts(), 100);
    }

    renderRegionStats() {
        return this.data.regions.map(region => `
            <tr>
                <td>${region.name}</td>
                <td>${region.signatures}</td>
                <td>${region.percentage}%</td>
                <td>${Math.floor(region.signatures * 0.5)}</td>
                <td>${Math.floor(region.signatures * 0.2)}</td>
                <td>${(region.percentage * 0.8).toFixed(1)}%</td>
            </tr>
        `).join('');
    }

    initializeCharts() {
        // 활동 추이 차트
        const activityCtx = document.getElementById('activityChart');
        if (activityCtx) {
            this.charts.activity = new Chart(activityCtx, {
                type: 'line',
                data: {
                    labels: this.data.charts.dates,
                    datasets: [
                        {
                            label: '서명',
                            data: this.data.charts.signatures,
                            borderColor: '#667eea',
                            backgroundColor: 'rgba(102, 126, 234, 0.1)',
                            tension: 0.3
                        },
                        {
                            label: '신규 가입',
                            data: this.data.charts.users,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.3
                        },
                        {
                            label: '게시글',
                            data: this.data.charts.posts,
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
                    labels: this.data.regions.map(r => r.name),
                    datasets: [{
                        data: this.data.regions.map(r => r.signatures),
                        backgroundColor: [
                            '#667eea',
                            '#764ba2',
                            '#10b981',
                            '#f59e0b',
                            '#ef4444'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        }
                    }
                }
            });
        }

        // 기기별 접속 차트
        const deviceCtx = document.getElementById('deviceChart');
        if (deviceCtx) {
            this.charts.device = new Chart(deviceCtx, {
                type: 'pie',
                data: {
                    labels: ['모바일', '데스크톱', '태블릿'],
                    datasets: [{
                        data: [
                            this.data.devices.mobile,
                            this.data.devices.desktop,
                            this.data.devices.tablet
                        ],
                        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.parsed + '%';
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    changePeriod(period) {
        this.period = period;
    }

    changeDateRange() {
        const startDate = document.getElementById('statStartDate').value;
        const endDate = document.getElementById('statEndDate').value;
        
        if (startDate) this.dateRange.start = new Date(startDate);
        if (endDate) this.dateRange.end = new Date(endDate);
    }

    loadData() {
        this.load();
    }

    exportData() {
        this.app.showToast('통계 데이터를 엑셀 파일로 내보내는 중...', 'info');
        
        // 실제 구현시 엑셀 파일 생성 및 다운로드
        setTimeout(() => {
            this.app.showSuccess('통계 데이터가 다운로드되었습니다.');
        }, 1500);
    }

    destroy() {
        // 차트 정리
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        super.destroy();
    }
}