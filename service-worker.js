const CACHE_NAME = 'firstpwa-syaiful';
const urlsToCache = [
    '/',
    '/icon.png',
    '/icon32.png',
	'/nav.html',
	'/index.html',
	'/pages/home.html',
	'/pages/author.html',
    '/pages/bookStore.html',
    '/pages/catalogue.html',
    '/css/materialize.min.css',
    '/css/custom.css',
	'/js/materialize.min.js',
    '/js/nav.js',
    '/js/sw-reg.js',
    '/manifest.json',
    '/img/author/andrea-hirata.jpg',
    '/img/author/habiburrahman-el-shirazy.jpg',
    '/img/author/hanum-1.jpg',
    '/img/book-cover/api-tauhid.jpg',
    '/img/book-cover/bidadari-bermata-bening.jpg',
    '/img/book-cover/bumi-cinta-habiburahman-el-shirazy.jpg',
    '/img/book-cover/IAS_dpn.jpg',
    '/img/book-cover/orang-orang-biasa.jpg',
    '/img/book-cover/sang-pemimpi.jpg',
    '/img/book-store/Gramedia_logo.jpg',
    '/img/book-store/toko-gunung-agung.jpg',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v55/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2'
];

self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(CACHE_NAME).then(cache => {
			return cache.addAll(urlsToCache);
		})
	);
})

self.addEventListener('activate', function(event){
	event.waitUntil(
		caches.keys()
		.then(function(cacheNames) {
			return Promise.all(
				cacheNames.map(function(cacheName){
					if(cacheName != CACHE_NAME){	
						console.log("ServiceWorker: cache " + cacheName + " dihapus");
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
})

self.addEventListener('fetch', function(event) {
	event.respondWith(
		caches.match(event.request, {cacheName:CACHE_NAME})
		.then(function(response) {
			if(response){
				console.log("ServiceWorker: Gunakan aset dari cache: ", response.url);
				return response;
			}
			
			console.log("ServiceWorker: Memuat aset dari server: ", event.request.url);
			return fetch(event.request);
		})
	);
});