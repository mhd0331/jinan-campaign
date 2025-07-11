// admin/js/auth-guard.js 추가
class AuthGuard {
    constructor() {
        this.checkAuth();
    }
    
    async checkAuth() {
        const user = await firebaseAdmin.getCurrentUser();
        if (!user) {
            window.location.href = '/admin/login.html';
            return;
        }
        
        const userData = await firebaseAdmin.getUser(user.uid);
        if (!userData.isAdmin) {
            await firebaseAdmin.signOut();
            window.location.href = '/admin/login.html';
        }
    }
}