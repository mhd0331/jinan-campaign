/**
 * 진안 캠페인 관리자 CMS - 게시글 관리 모듈
 */

class PostsModule extends BaseModule {
    constructor(app) {
        super(app);
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.currentCategory = '전체';
    }

    async fetchData() {
        try {
            this.data = await this.app.fetchData('posts', {
                category: this.currentCategory !== '전체' ? this.currentCategory : null,
                page: this.currentPage,
                limit: this.itemsPerPage
            });
        } catch (error) {
            console.error('게시글 데이터 로드 실패:', error);
            this.data = this.getDummyData();
        }
    }

    getDummyData() {
        const posts = [];
        const categories = ['공지사항', '자유토론', '긴급제보', '아이디어', '활동인증', 'Q&A', '의회소식'];
        const titles = [
            '📌 캠페인 참여 안내',
            '목조전망대 반대 이유',
            '긴급! 의회 소집 소식',
            '효과적인 홍보 방법 제안',
            '서명 활동 인증합니다'
        ];
        
        for (let i = 0; i < 30; i++) {
            posts.push({
                id: i + 1,
                title: titles[i % titles.length],
                content: '게시글 내용입니다...',
                authorId: 'user' + (i % 10),
                authorName: '사용자' + (i % 10),
                category: categories[i % categories.length],
                viewCount: Math.floor(Math.random() * 1000),
                commentCount: Math.floor(Math.random() * 50),
                reactions: {
                    like: Math.floor(Math.random() * 100),
                    love: Math.floor(Math.random() * 20),
                    angry: Math.floor(Math.random() * 10)
                },
                isPinned: i === 0,
                isActive: Math.random() > 0.1,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
            });
        }

        return {
            posts: posts.slice((this.currentPage - 1) * this.itemsPerPage, this.currentPage * this.itemsPerPage),
            total: posts.length
        };
    }

    render() {
        const content = this.getContent();
        content.innerHTML = `
            <!-- 카테고리 탭 -->
            <div class="tabs">
                ${this.renderCategoryTabs()}
            </div>

            <div class="table-container">
                <div class="table-header">
                    <h3 class="table-title">게시글 목록</h3>
                    <div class="table-actions">
                        <button class="btn btn-primary" onclick="adminApp.modules.posts.showCreateModal()">
                            <span>➕</span>
                            <span>새 게시글</span>
                        </button>
                    </div>
                </div>
                <div class="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>카테고리</th>
                                <th>제목</th>
                                <th>작성자</th>
                                <th>조회수</th>
                                <th>댓글</th>
                                <th>반응</th>
                                <th>상태</th>
                                <th>작성일</th>
                                <th>액션</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.renderPosts()}
                        </tbody>
                    </table>
                </div>
                ${this.renderPagination()}
            </div>
        `;
    }

    renderCategoryTabs() {
        const categories = ['전체', '공지사항', '자유토론', '긴급제보', '아이디어', '활동인증', 'Q&A', '의회소식'];
        return categories.map(cat => `
            <button class="tab ${cat === this.currentCategory ? 'active' : ''}" 
                    onclick="adminApp.modules.posts.changeCategory('${cat}')">
                ${cat}
            </button>
        `).join('');
    }

    renderPosts() {
        return this.data.posts.map(post => `
            <tr>
                <td>${post.id}</td>
                <td><span class="badge badge-${this.getCategoryBadgeClass(post.category)}">${post.category}</span></td>
                <td>
                    ${post.isPinned ? '📌 ' : ''}
                    ${post.title}
                </td>
                <td>${post.authorName}</td>
                <td>${post.viewCount}</td>
                <td>${post.commentCount}</td>
                <td>
                    👍 ${post.reactions.like} 
                    ❤️ ${post.reactions.love}
                    ${post.reactions.angry > 0 ? `😡 ${post.reactions.angry}` : ''}
                </td>
                <td>
                    <span class="badge badge-${post.isActive ? 'success' : 'secondary'}">
                        ${post.isActive ? '활성' : '숨김'}
                    </span>
                </td>
                <td>${this.app.formatDate(post.createdAt).split(' ')[0]}</td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="adminApp.modules.posts.viewPost(${post.id})">
                        보기
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="adminApp.modules.posts.editPost(${post.id})">
                        수정
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="adminApp.modules.posts.togglePost(${post.id}, ${post.isActive})">
                        ${post.isActive ? '숨기기' : '복원'}
                    </button>
                </td>
            </tr>
        `).join('');
    }

    getCategoryBadgeClass(category) {
        const classes = {
            '공지사항': 'danger',
            '자유토론': 'info',
            '긴급제보': 'warning',
            '아이디어': 'success',
            '활동인증': 'primary',
            'Q&A': 'secondary',
            '의회소식': 'info'
        };
        return classes[category] || 'secondary';
    }

    renderPagination() {
        const totalPages = Math.ceil(this.data.total / this.itemsPerPage);
        return `
            <div class="pagination">
                <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                        onclick="adminApp.modules.posts.goToPage(${this.currentPage - 1})">
                    이전
                </button>
                ${this.renderPageNumbers(totalPages)}
                <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                        onclick="adminApp.modules.posts.goToPage(${this.currentPage + 1})">
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
                        onclick="adminApp.modules.posts.goToPage(${i})">
                    ${i}
                </button>
            `);
        }
        return pages.join('');
    }

    changeCategory(category) {
        this.currentCategory = category;
        this.currentPage = 1;
        this.load();
    }

    goToPage(page) {
        this.currentPage = page;
        this.load();
    }

    showCreateModal() {
        const content = `
            <form id="postForm">
                <div class="form-group">
                    <label class="form-label">카테고리</label>
                    <select name="category" class="form-control" required>
                        <option value="">선택</option>
                        <option value="공지사항">공지사항</option>
                        <option value="자유토론">자유토론</option>
                        <option value="긴급제보">긴급제보</option>
                        <option value="아이디어">아이디어</option>
                        <option value="활동인증">활동인증</option>
                        <option value="Q&A">Q&A</option>
                        <option value="의회소식">의회소식</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">제목</label>
                    <input type="text" name="title" class="form-control" required>
                </div>
                <div class="form-group">
                    <label class="form-label">내용</label>
                    <textarea name="content" rows="10" class="form-control" required></textarea>
                </div>
                <div class="form-group">
                    <label class="form-label">해시태그 (쉼표로 구분)</label>
                    <input type="text" name="hashtags" class="form-control" placeholder="#목조전망대반대, #445억낭비">
                </div>
                <div class="form-group">
                    <label class="form-check">
                        <input type="checkbox" name="isPinned" class="form-check-input">
                        <span>고정 게시글로 설정</span>
                    </label>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="adminApp.closeModal()">취소</button>
            <button class="btn btn-primary" onclick="adminApp.modules.posts.createPost()">작성</button>
        `;

        this.app.showModal('새 게시글 작성', content, footer);
    }

    async createPost() {
        const form = document.getElementById('postForm');
        const formData = new FormData(form);
        
        try {
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.createPost(Object.fromEntries(formData));
            }
            
            this.app.showSuccess('게시글이 작성되었습니다.');
            this.app.closeModal();
            this.load();
        } catch (error) {
            this.app.showError('게시글 작성에 실패했습니다.');
        }
    }

    viewPost(id) {
        // 게시글 상세 보기
        window.open(`/post/${id}`, '_blank');
    }

    editPost(id) {
        // 게시글 수정 모달
        console.log('게시글 수정:', id);
    }

    async togglePost(id, currentStatus) {
        const action = currentStatus ? '숨기기' : '복원';
        if (!this.app.confirm(`이 게시글을 ${action}하시겠습니까?`)) return;

        try {
            if (typeof firebaseAdmin !== 'undefined') {
                await firebaseAdmin.updatePost(id, { isActive: !currentStatus });
            }
            
            this.app.showSuccess(`게시글이 ${action}되었습니다.`);
            this.load();
        } catch (error) {
            this.app.showError(`게시글 ${action}에 실패했습니다.`);
        }
    }
}