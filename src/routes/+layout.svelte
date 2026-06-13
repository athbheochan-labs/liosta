<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.css';

	type InstallPromptEvent = Event & {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	};

	const INSTALL_DISMISSED_KEY = 'liosta_install_prompt_dismissed';
	const IOS_HINT_SEEN_KEY = 'liosta_ios_install_hint_seen';

	let { children } = $props();
	let isOffline = $state(false);
	let deferredInstallPrompt = $state<InstallPromptEvent | null>(null);
	let showInstallBanner = $state(false);
	let showIosHint = $state(false);
	let installPromptReady = $state(false);
	let installDelayElapsed = $state(false);

	function isStandalone() {
		const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

		return (
			window.matchMedia('(display-mode: standalone)').matches ||
			navigatorWithStandalone.standalone === true
		);
	}

	function isIos() {
		return /iphone|ipad|ipod/i.test(navigator.userAgent);
	}

	function dismissInstallPrompt() {
		showInstallBanner = false;
		showIosHint = false;
		localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
	}

	async function installApp() {
		if (!deferredInstallPrompt) return;

		const promptEvent = deferredInstallPrompt;
		deferredInstallPrompt = null;
		await promptEvent.prompt();
		const choice = await promptEvent.userChoice;

		if (choice.outcome === 'accepted' || choice.outcome === 'dismissed') dismissInstallPrompt();
	}

	onMount(() => {
		function syncNetworkState() {
			isOffline = !navigator.onLine;
		}

		function handleBeforeInstallPrompt(event: Event) {
			if (isStandalone() || localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true') return;

			event.preventDefault();
			deferredInstallPrompt = event as InstallPromptEvent;
			installPromptReady = true;
			if (installDelayElapsed) showInstallBanner = true;
		}

		function handleAppInstalled() {
			dismissInstallPrompt();
		}

		syncNetworkState();
		window.addEventListener('online', syncNetworkState);
		window.addEventListener('offline', syncNetworkState);
		window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
		window.addEventListener('appinstalled', handleAppInstalled);

		const timer = window.setTimeout(() => {
			installDelayElapsed = true;

			if (isStandalone() || localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true') return;

			if (deferredInstallPrompt || installPromptReady) {
				showInstallBanner = true;
				return;
			}

			if (isIos() && localStorage.getItem(IOS_HINT_SEEN_KEY) !== 'true') {
				showIosHint = true;
				localStorage.setItem(IOS_HINT_SEEN_KEY, 'true');
			}
		}, 30000);

		return () => {
			window.clearTimeout(timer);
			window.removeEventListener('online', syncNetworkState);
			window.removeEventListener('offline', syncNetworkState);
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			window.removeEventListener('appinstalled', handleAppInstalled);
		};
	});
</script>

{@render children()}

{#if isOffline || showInstallBanner || showIosHint}
	<div class="fixed inset-x-3 bottom-3 z-50 flex flex-col gap-3 md:left-auto md:right-4 md:w-[340px]">
		{#if isOffline}
			<div
				class="rounded-lg bg-ink px-4 py-3 text-center text-sm font-medium text-bg shadow-lg"
				role="status"
				aria-live="polite"
			>
				Tá tú as líne. Leanann Liosta ag obair.
			</div>
		{/if}

		{#if showInstallBanner || showIosHint}
			<div
				class="rounded-lg bg-ink p-4 text-bg shadow-lg"
				role="dialog"
				aria-live="polite"
				aria-label="Suiteáil Liosta"
			>
				<div class="flex items-start justify-between gap-4">
					<div>
						<p class="font-serif text-xl font-semibold leading-tight">Suiteáil Liosta ar do ghuthán</p>
						{#if showIosHint}
							<p class="mt-1 text-sm text-bg/70">Ar iOS: Share > Add to Home Screen.</p>
						{/if}
					</div>
					<button
						type="button"
						class="rounded-full p-1 text-bg/60 transition-colors hover:bg-bg/10 hover:text-bg"
						aria-label="Ná taispeáin arís"
						onclick={dismissInstallPrompt}
					>
						×
					</button>
				</div>

				{#if showInstallBanner}
					<div class="mt-4 flex gap-2">
						<button
							type="button"
							class="rounded-lg bg-green px-4 py-2 text-sm font-medium text-[#f5f3ee] transition-colors hover:bg-green/85"
							onclick={installApp}
						>
							Suiteáil
						</button>
						<button
							type="button"
							class="rounded-lg px-4 py-2 text-sm text-bg/65 transition-colors hover:bg-bg/10 hover:text-bg"
							onclick={dismissInstallPrompt}
						>
							Níos déanaí
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
