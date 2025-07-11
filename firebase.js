{
 "hosting": [
   {
     "target": "frontend",
     "site": "jinan-campaign",
     "public": "frontend",
     "ignore": [
       "firebase.json",
       "**/.*",
       "**/node_modules/**",
       "**/*.log",
       "**/package.json",
       "**/package-lock.json",
       "**/*.md",
       "**/test/**"
     ],
     "rewrites": [
       {
         "source": "/sw.js",
         "destination": "/js/sw.js"
       },
       {
         "source": "/firebase-messaging-sw.js",
         "destination": "/js/firebase-messaging-sw.js"
       },
       {
         "source": "/api/**",
         "function": "api"
       },
       {
         "source": "**",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=604800, immutable"
           }
         ]
       },
       {
         "source": "**/*.@(js|css)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=86400, immutable"
           }
         ]
       },
       {
         "source": "sw.js",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "no-cache, no-store, must-revalidate"
           },
           {
             "key": "Service-Worker-Allowed",
             "value": "/"
           }
         ]
       },
       {
         "source": "firebase-messaging-sw.js",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "no-cache, no-store, must-revalidate"
           },
           {
             "key": "Service-Worker-Allowed",
             "value": "/"
           }
         ]
       },
       {
         "source": "manifest.json",
         "headers": [
           {
             "key": "Content-Type",
             "value": "application/manifest+json"
           },
           {
             "key": "Cache-Control",
             "value": "no-cache"
           }
         ]
       },
       {
         "source": "**",
         "headers": [
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-Frame-Options",
             "value": "SAMEORIGIN"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin-when-cross-origin"
           },
           {
             "key": "Permissions-Policy",
             "value": "camera=(), microphone=(), geolocation=(*)"
           }
         ]
       }
     ]
   },
   {
     "target": "admin",
     "site": "jinan-campaign-admin",
     "public": "admin",
     "ignore": [
       "firebase.json",
       "**/.*",
       "**/node_modules/**",
       "**/*.log",
       "**/package.json",
       "**/package-lock.json",
       "**/*.md",
       "**/test/**"
     ],
     "rewrites": [
       {
         "source": "/api/**",
         "function": "adminApi"
       },
       {
         "source": "**",
         "destination": "/index.html"
       }
     ],
     "headers": [
       {
         "source": "**/*.@(jpg|jpeg|gif|png|svg|webp|ico)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=604800"
           }
         ]
       },
       {
         "source": "**/*.@(js|css)",
         "headers": [
           {
             "key": "Cache-Control",
             "value": "public, max-age=3600"
           }
         ]
       },
       {
         "source": "**",
         "headers": [
           {
             "key": "X-Frame-Options",
             "value": "DENY"
           },
           {
             "key": "X-Content-Type-Options",
             "value": "nosniff"
           },
           {
             "key": "X-XSS-Protection",
             "value": "1; mode=block"
           },
           {
             "key": "Referrer-Policy",
             "value": "strict-origin"
           },
           {
             "key": "Content-Security-Policy",
             "value": "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://www.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://firestore.googleapis.com https://www.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com"
           },
           {
             "key": "Strict-Transport-Security",
             "value": "max-age=31536000; includeSubDomains"
           }
         ]
       }
     ],
     "redirects": [
       {
         "source": "/",
         "destination": "/index.html",
         "type": 301
       }
     ]
   }
 ],
 "firestore": {
   "rules": "firestore.rules",
   "indexes": "firestore.indexes.json"
 },
 "storage": {
   "rules": "storage.rules"
 },
 "functions": [
   {
     "source": "functions",
     "codebase": "default",
     "ignore": [
       "node_modules",
       ".git",
       "firebase-debug.log",
       "firebase-debug.*.log"
     ],
     "predeploy": [
       "npm --prefix \"$RESOURCE_DIR\" run lint"
     ]
   }
 ],
 "emulators": {
   "auth": {
     "port": 9099,
     "host": "127.0.0.1"
   },
   "functions": {
     "port": 5001,
     "host": "127.0.0.1"
   },
   "firestore": {
     "port": 8080,
     "host": "127.0.0.1"
   },
   "hosting": {
     "port": 5000,
     "host": "127.0.0.1"
   },
   "storage": {
     "port": 9199,
     "host": "127.0.0.1"
   },
   "ui": {
     "enabled": true,
     "port": 4000,
     "host": "127.0.0.1"
   },
   "singleProjectMode": true
 },
 "remoteconfig": {
   "template": "remoteconfig.template.json"
 }
}