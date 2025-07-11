// frontend/firebase-messaging-sw.js
/**
 * Firebase Cloud Messaging Service Worker
 * 백그라운드 푸시 알림 처리
 */

// Firebase SDK 임포트
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase 설정 (공통 설정과 동일하게 유지)
const firebaseConfig = {
    apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    authDomain: "jinan-campaign.firebaseapp.com",
    projectId: "jinan-campaign",
    storageBucket: "jinan-campaign.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:xxxxxxxxxxxxxxxxxxxxx"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// 백그라운드 메시지 수신
messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] 백그라운드 메시지 수신:', payload);
    
    const notificationTitle = payload.notification?.title || '진안 캠페인';
    const notificationOptions = {
        body: payload.notification?.body || '새로운 소식이 있습니다.',
        icon: '/images/icons/icon-192.png',
        badge: '/images/icons/icon-72.png',
        tag: payload.data?.tag || 'jinan-campaign-notification',
        data: payload.data || {},
        requireInteraction: payload.data?.requireInteraction === 'true',
        actions: []
    };

    // 알림 타입에 따른 액션 추가
    const notificationType = payload.data?.type;
    
    switch (notificationType) {
        case 'new_signature':
            notificationOptions.actions = [
                { action: 'view', title: '확인하기' },
                { action: 'close', title: '닫기' }
            ];
            break;
        case 'campaign_update':
            notificationOptions.actions = [
                { action: 'open', title: '자세히 보기' },
                { action: 'close', title: '나중에' }
            ];
            break;
        case 'urgent':
            notificationOptions.requireInteraction = true;
            notificationOptions.actions = [
                { action: 'participate', title: '참여하기' },
                { action: 'share', title: '공유하기' }
            ];
            break;
        default:
            notificationOptions.actions = [
                { action: 'open', title: '열기' },
                { action: 'close', title: '닫기' }
            ];
    }
    
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener('notificationclick', (event) => {
    console.log('[FCM SW] 알림 클릭:', event.action);
    
    event.notification.close();
    
    // 액션별 처리
    let targetUrl = '/';
    
    switch (event.action) {
        case 'view':
        case 'open':
            targetUrl = event.notification.data?.url || '/';
            break;
        case 'participate':
            targetUrl = '/?tab=sign';
            break;
        case 'share':
            // 공유 기능은 메인 앱에서 처리
            targetUrl = '/?action=share';
            break;
        case 'close':
            return; // 아무 작업도 하지 않음
    }
    
    // 알림 데이터에 URL이 있으면 우선 사용
    if (event.notification.data?.url) {
        targetUrl = event.notification.data.url;
    }
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // 이미 열린 탭이 있는지 확인
            for (const client of clientList) {
                if (client.url.includes(self.registration.scope) && 'focus' in client) {
                    client.focus();
                    
                    // 클라이언트에 메시지 전송
                    client.postMessage({
                        type: 'notification-click',
                        action: event.action,
                        data: event.notification.data
                    });
                    
                    return;
                }
            }
            
            // 새 탭 열기
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});

// 푸시 이벤트 처리 (데이터 전용 메시지)
self.addEventListener('push', (event) => {
    console.log('[FCM SW] 푸시 이벤트 수신');
    
    if (event.data) {
        try {
            const data = event.data.json();
            
            // 데이터 전용 메시지 처리
            if (!data.notification) {
                const notificationTitle = data.data?.title || '진안 캠페인';
                const notificationOptions = {
                    body: data.data?.body || '새로운 알림이 있습니다.',
                    icon: '/images/icons/icon-192.png',
                    badge: '/images/icons/icon-72.png',
                    data: data.data || {}
                };
                
                event.waitUntil(
                    self.registration.showNotification(notificationTitle, notificationOptions)
                );
            }
        } catch (error) {
            console.error('[FCM SW] 푸시 데이터 파싱 실패:', error);
        }
    }
});

console.log('[FCM SW] Firebase Messaging Service Worker 로드 완료');