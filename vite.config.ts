import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({
				fallback: 'index.html'
			})
		}),
		VitePWA({
			strategies: 'generateSW',
			registerType: 'autoUpdate',
			manifest: {
				name: 'Liosta',
				short_name: 'Liosta',
				description: 'Feidhmchlár liosta siopadóireachta / tasc i nGaeilge',
				lang: 'ga',
				theme_color: '#0F6E56',
				background_color: '#f5f3ee',
				display: 'standalone',
				start_url: '/',
				scope: '/',
				orientation: 'portrait',
				icons: [
					{
						src: '/icons/icon-192.png',
						sizes: '192x192',
						type: 'image/png'
					},
					{
						src: '/icons/icon-512.png',
						sizes: '512x512',
						type: 'image/png'
					},
					{
						src: '/icons/icon-maskable.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'maskable'
					}
				]
			},
			workbox: {
				cleanupOutdatedCaches: true,
				clientsClaim: true,
				navigateFallback: '/index.html',
				globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff,woff2,json,webmanifest,txt}']
			}
		})
	]
});
