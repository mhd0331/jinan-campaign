/**
 * 진안군 목조전망대 반대 캠페인 앱 - Service Worker
 */

const CACHE_NAME = 'jinan-campaign-v1.0.0';
const DATA_CACHE_NAME = 'jinan-campaign-data-v1.0.0';

// 캐시할 정적 자원들
const STATIC_FILES = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/js/firebase-config.js',
    '/manifest.json',
    
    // 외부 라이브러리
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700&display=swap',
    
    // Firebase SDKs
    'https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth-compat.js',
    'https://www.gstatic.com/firebasejs/9.0.0/firebase-storage-compat.js'
];

// API 엔드포인트
const API_ENDPOINTS = [
    '/api/campaigns/',
    '/api/signatures/',
    '/api/posts/',
    '/api/polls/'
];

// ==========================================================================
// Service Worker 설치
// ==========================================================================

self.addEventListener('install', (event) => {
    console.log('[SW] 설치 중...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] 정적 파일 캐싱 중...');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('[SW] 설치 완료');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] 설치 실패:', error);
            })
    );
});

// ==========================================================================
// Service Worker 활성화
// ==========================================================================

self.addEventListener('activate', (event) => {
    console.log('[SW] 활성화 중...');
    
    event.waitUntil(
        Promise.all([
            // 오래된 캐시 정리
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
                            console.log('[SW] 오래된 캐시 삭제:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // 모든 클라이언트 제어
            self.clients.claim()
        ]).then(() => {
            console.log('[SW] 활성화 완료');
        })
    );
});

// ==========================================================================
// Fetch 이벤트 처리
// ==========================================================================

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // POST 요청은 캐시하지 않음
    if (request.method !== 'GET') {
        return;
    }
    
    // API 요청 처리
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }
    
    // 정적 자원 처리
    event.respondWith(cacheFirst(request));
});

// ==========================================================================
// 캐시 전략
// ==========================================================================

// Cache First: 캐시 우선, 네트워크 대체
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return offlineResponse();
    }
}

// Network First: 네트워크 우선, 캐시 대체
async function networkFirst(request) {
    const cache = await caches.open(DATA_CACHE_NAME);
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cached = await cache.match(request);
        return cached || offlineResponse();
    }
}

// 오프라인 응답
function offlineResponse() {
    return new Response(
        `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>오프라인 - 진안 캠페인</title>
            <style>
                body {
                    font-family: 'Noto Sans KR', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background: #f3f4f6;
                }
                .offline-container {
                    text-align: center;
                    max-width: 400px;
                    padding: 2rem;
                }
                .offline-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }
                h1 {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: #1f2937;
                }
                p {
                    color: #6b7280;
                    margin-bottom: 1.5rem;
                }
                .retry-btn {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-size: 1rem;
                    cursor: pointer;
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <div class="offline-icon">📡</div>
                <h1>오프라인 상태입니다</h1>
                <p>인터넷 연결을 확인하고 다시 시도해주세요.</p>
                <button class="retry-btn" onclick="window.location.reload()">
                    다시 시도
                </button>
            </div>
        </body>
        </html>
        `,
        {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        }
    );
}

// ==========================================================================
// 백그라운드 동기화
// ==========================================================================

self.addEventListener('sync', (event) => {
    console.log('[SW] 백그라운드 동기화:', event.tag);
    
    if (event.tag === 'sync-signatures') {
        event.waitUntil(syncOfflineSignatures());
    }
});

async function syncOfflineSignatures() {
    const cache = await caches.open(DATA_CACHE_NAME);
    const requests = await cache.keys();
    
    for (const request of requests) {
        if (request.url.includes('/api/signatures/offline')) {
            try {
                const cachedResponse = await cache.match(request);
                const data = await cachedResponse.json();
                
                // 서버에 전송
                const response = await fetch('/api/signatures', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                
                if (response.ok) {
                    await cache.delete(request);
                    console.log('[SW] 오프라인 서명 동기화 성공');
                }
            } catch (error) {
                console.error('[SW] 동기화 실패:', error);
            }
        }
    }
}

// ==========================================================================
// 푸시 알림
// ==========================================================================

self.addEventListener('push', (event) => {
    console.log('[SW] 푸시 알림 수신');
    
    const options = {
        body: event.data ? event.data.text() : '새로운 소식이 있습니다.',
        icon: '/images/icons/icon-192.png',
        badge: '/images/icons/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    
    event.waitUntil(
        self.registration.showNotification('진안 캠페인', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    console.log('[SW] 알림 클릭');
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

// ==========================================================================
// 메시지 처리
// ==========================================================================

self.addEventListener('message', (event) => {
    console.log('[SW] 메시지 수신:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('[SW] Service Worker 로드 완료');