import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	server: {
		host: "::",
		port: 8080,
	},
	plugins: [
		react(),
		VitePWA({
			registerType: 'autoUpdate',
			injectRegister: 'auto',
			includeAssets: ['favicon.svg', 'robots.txt'],
			manifest: {
				name: 'QuickCourt',
				short_name: 'QuickCourt',
				description: 'Real-time sports court booking',
				theme_color: '#0ea5e9',
				background_color: '#ffffff',
				display: 'standalone',
				start_url: '/',
				icons: [
					{
						src: '/placeholder.svg',
						sizes: '192x192',
						type: 'image/svg+xml',
						purpose: 'any'
					}
				]
			},
			workbox: {
				navigateFallback: '/index.html',
				runtimeCaching: [
					{
						urlPattern: ({ request }: any) => request.destination === 'image',
						handler: 'CacheFirst',
						options: {
							cacheName: 'images',
							expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
						},
					},
				],
			},
		}),
	],
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "."),
		},
	},
}));
