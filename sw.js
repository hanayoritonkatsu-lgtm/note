// キャッシュ名定義（バージョン管理用）
const CACHE_NAME = 'pjt-note-cache-v1';

// オフライン起動に必要な静的アセット一覧
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png',
  './logo.png'
];

// サービスワーカーのインストール処理（プリキャッシュ）
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// サービスワーカーのアクティベート処理（古いキャッシュの削除と即時有効化）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// リクエスト取得処理：ネットワーク優先（Network First）
self.addEventListener('fetch', (event) => {
  // GETリクエスト以外、またはHTTP/HTTPSプロトコル以外はキャッシュ対象外
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    // 1. まずネットワーク通信を試みる（最新のコードを優先反映）
    fetch(event.request)
      .then((networkResponse) => {
        // 正常なレスポンスであればキャッシュを最新状態に更新
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // 2. オフラインなどでネットワーク接続に失敗した場合、キャッシュから返却
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // HTMLのページ遷移リクエストでキャッシュが見つからない場合は index.html を返す
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }

        return new Response('ネットワークエラー：オフラインです', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      })
  );
});
