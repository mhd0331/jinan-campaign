# .env.example
# Firebase 프로젝트별 환경 변수 설정 예제
# 이 파일을 .env로 복사하고 실제 값을 입력하세요

# Firebase Configuration
FIREBASE_API_KEY=AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN=jinan-campaign.firebaseapp.com
FIREBASE_PROJECT_ID=jinan-campaign
FIREBASE_STORAGE_BUCKET=jinan-campaign.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxxxxxxxxxx
FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Firebase Admin SDK (Functions용)
FIREBASE_ADMIN_SDK_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_SDK_CLIENT_EMAIL=firebase-adminsdk-xxxxx@jinan-campaign.iam.gserviceaccount.com

# FCM (Push Notifications)
FCM_SERVER_KEY=AAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FCM_VAPID_KEY=BKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# App URLs
FRONTEND_URL=https://jinan-campaign.web.app
ADMIN_URL=https://jinan-campaign-admin.web.app
API_URL=https://asia-northeast3-jinan-campaign.cloudfunctions.net/api

# Admin Settings
ADMIN_EMAIL=admin@jinan.kr
ADMIN_INITIAL_PASSWORD=change_this_password_immediately

# Campaign Settings
CAMPAIGN_ID=jinan-wooden-tower
TARGET_SIGNATURES=10000
VOTE_DATE=2024-12-20

# Security
SESSION_TIMEOUT=3600000  # 1 hour in milliseconds
ENABLE_2FA=true
JWT_SECRET=your_jwt_secret_key_here

# Export Settings
EXPORT_MAX_ROWS=10000
EXPORT_RATE_LIMIT=10  # exports per hour

# Email Settings (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Development
NODE_ENV=production
ENABLE_DEBUG_LOGGING=false
USE_EMULATOR=false

# Rate Limiting
SIGNATURE_RATE_LIMIT=5  # signatures per IP per hour
API_RATE_LIMIT=100  # API calls per user per hour

# Google Analytics
GA_TRACKING_ID=UA-XXXXXXXXX-X

# Sentry (Error Tracking)
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx

# Cloud Functions Region
FUNCTIONS_REGION=asia-northeast3

# Backup Settings
BACKUP_BUCKET=jinan-campaign-backups
BACKUP_SCHEDULE=0 2 * * *  # Daily at 2 AM

# Feature Flags
ENABLE_ANONYMOUS_SIGNATURES=true
ENABLE_SOCIAL_LOGIN=false
ENABLE_OFFLINE_MODE=true
ENABLE_PUSH_NOTIFICATIONS=true

# Maintenance Mode
MAINTENANCE_MODE=false
MAINTENANCE_MESSAGE=시스템 점검 중입니다. 잠시 후 다시 시도해주세요.