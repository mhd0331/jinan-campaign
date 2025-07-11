#!/bin/bash

echo "🚀 진안 캠페인 프로젝트 설정 시작..."

# 의존성 설치
echo "📦 의존성 설치 중..."
npm run install:all

# 환경 변수 설정
echo "⚙️ 환경 변수 설정..."
cp .env.example .env
echo "⚠️ .env 파일에 실제 값을 입력해주세요!"

# Firebase 초기화
echo "🔥 Firebase 초기화..."
firebase login
firebase use --add

# Git hooks 설정
echo "🔗 Git hooks 설정..."
npx husky install

echo "✅ 설정 완료!"
echo "📝 다음 명령어로 개발을 시작하세요: npm run dev"