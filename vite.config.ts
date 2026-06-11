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
				theme_color: '#0f6e56',
				background_color: '#f5f3ee',
				display: 'standalone',
				start_url: '/',
				icons: [
					{
						src: '/icon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any'
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
