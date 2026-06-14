<script lang="ts">
	import { onMount, setContext, tick } from 'svelte';
	import '../app.css';

	type InstallPromptEvent = Event & {
		prompt: () => Promise<void>;
		userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
	};

	type TourStep = {
		title: string;
		body: string;
		selector?: string;
		fallbackSelector?: string;
	};

	type TourRect = {
		top: number;
		left: number;
		width: number;
		height: number;
	};

	type Theme = 'light' | 'dark';

	const INSTALL_DISMISSED_KEY = 'liosta_install_prompt_dismissed';
	const IOS_HINT_SEEN_KEY = 'liosta_ios_install_hint_seen';
	const TOUR_STORAGE_KEY = 'liosta_toured';
	const THEME_STORAGE_KEY = 'liosta_theme';
	const THEME_COLOR = {
		light: '#0F6E56',
		dark: '#151715'
	};

	const tourSteps: TourStep[] = [
		{
			title: 'Seo do liostaí',
			body: 'Seo an áit a roghnaíonn tú idir liostaí. Fanann an liosta gníomhach aibhsithe le dath glas.',
			selector: '[data-tour="list-nav"]',
			fallbackSelector: '[data-tour="open-lists"]'
		},
		{
			title: 'Cruthaigh liosta nua',
			body: 'Brúigh “Liosta nua” chun liosta eile a chruthú. Osclaítear an t-ainm láithreach le hathrú.',
			selector: '[data-tour="new-list"]',
			fallbackSelector: '[data-tour="open-lists"]'
		},
		{
			title: 'Cuir liosta in eagar',
			body: 'Ar ríomhaire, cuir an luch thar ainm liosta chun é a athainmniú nó a scriosadh. Ar fhón, oscail an roghnóir liostaí ar dtús.',
			selector: '[data-tour="active-list"]',
			fallbackSelector: '[data-tour="open-lists"]'
		},
		{
			title: 'Cuir míreanna leis',
			body: 'Scríobh mír anseo agus brúigh an eochair iontrála nó an cnaipe cuir leis.',
			selector: '[data-tour="add-item"]'
		},
		{
			title: 'Comharthaigh nó scrios',
			body: 'Brúigh mír chun í a chríochnú. Úsáid an cnaipe scriosta nó sleamhnaigh ar chlé chun mír a bhaint.',
			selector: '[data-tour="item-actions"]'
		},
		{
			title: 'Glan míreanna críochnaithe',
			body: 'Nuair atá mír amháin críochnaithe, feicfidh tú cnaipe anseo chun na míreanna críochnaithe a ghlanadh le deimhniú.',
			selector: '[data-tour="clear-done"]',
			fallbackSelector: '[data-tour="add-item"]'
		}
	];

	let { children } = $props();
	let isOffline = $state(false);
	let deferredInstallPrompt = $state<InstallPromptEvent | null>(null);
	let showInstallBanner = $state(false);
	let showIosHint = $state(false);
	let installPromptReady = $state(false);
	let installDelayElapsed = $state(false);
	let showTour = $state(false);
	let tourStepIndex = $state(0);
	let tourTargetRect = $state<TourRect | null>(null);
	let tourPopoverStyle = $state('');
	let tourCardWidth = $state(360);
	let theme = $state<Theme>('light');

	let activeTourStep = $derived(tourSteps[tourStepIndex]);
	let isLastTourStep = $derived(tourStepIndex === tourSteps.length - 1);

	setContext('liosta-tour', {
		get active() {
			return showTour;
		}
	});

	setContext('liosta-theme', {
		get theme() {
			return theme;
		},
		toggleTheme
	});

	function applyTheme(nextTheme: Theme) {
		theme = nextTheme;
		document.documentElement.dataset.theme = nextTheme;
		document
			.querySelector('meta[name="theme-color"]')
			?.setAttribute('content', THEME_COLOR[nextTheme]);
	}

	function storedOrPreferredTheme(): Theme {
		const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
		if (storedTheme === 'light' || storedTheme === 'dark') return storedTheme;
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}

	function toggleTheme() {
		const nextTheme = theme === 'dark' ? 'light' : 'dark';
		applyTheme(nextTheme);
		localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
	}

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

	function finishTour() {
		showTour = false;
		localStorage.setItem(TOUR_STORAGE_KEY, 'true');
	}

	function nextTourStep() {
		if (isLastTourStep) {
			finishTour();
			return;
		}

		tourStepIndex += 1;
	}

	function clamp(value: number, min: number, max: number) {
		return Math.min(Math.max(value, min), max);
	}

	function visibleTourTarget(selector?: string): HTMLElement | null {
		if (!selector) return null;
		const target = document.querySelector<HTMLElement>(selector);
		if (!target) return null;

		const rect = target.getBoundingClientRect();
		const style = window.getComputedStyle(target);
		const isVisible =
			rect.width > 0 &&
			rect.height > 0 &&
			rect.right > 0 &&
			rect.bottom > 0 &&
			rect.left < window.innerWidth &&
			rect.top < window.innerHeight &&
			style.display !== 'none' &&
			style.visibility !== 'hidden';

		return isVisible ? target : null;
	}

	async function updateTourTarget() {
		if (!showTour) return;

		await tick();

		const target =
			visibleTourTarget(activeTourStep.selector) ??
			visibleTourTarget(activeTourStep.fallbackSelector);

		if (!target) {
			tourTargetRect = null;
			tourCardWidth = Math.min(360, window.innerWidth - 32);
			tourPopoverStyle = `left: ${Math.max(16, (window.innerWidth - tourCardWidth) / 2)}px; top: ${Math.max(16, (window.innerHeight - 260) / 2)}px; width: ${tourCardWidth}px;`;
			return;
		}

		target.scrollIntoView({ block: 'nearest', inline: 'nearest' });

		const rect = target.getBoundingClientRect();
		const pad = 8;
		const margin = 16;
		const width = Math.min(360, window.innerWidth - 32);
		const heightEstimate = 260;
		let left = rect.right + margin;
		let top = clamp(rect.top, margin, window.innerHeight - heightEstimate - margin);

		if (left + width > window.innerWidth - margin) {
			left = rect.left - width - margin;
		}

		if (left < margin) {
			left = clamp(rect.left, margin, window.innerWidth - width - margin);
			top = rect.bottom + margin;
		}

		if (top + heightEstimate > window.innerHeight - margin) {
			top = rect.top - heightEstimate - margin;
		}

		if (top < margin) {
			top = margin;
		}

		tourTargetRect = {
			top: Math.max(0, rect.top - pad),
			left: Math.max(0, rect.left - pad),
			width: Math.min(window.innerWidth, rect.width + pad * 2),
			height: Math.min(window.innerHeight, rect.height + pad * 2)
		};
		tourCardWidth = width;
		tourPopoverStyle = `left: ${left}px; top: ${top}px; width: ${width}px;`;
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

		function handleTourLayoutChange() {
			void updateTourTarget();
		}

		applyTheme(storedOrPreferredTheme());
		syncNetworkState();
		showTour = localStorage.getItem(TOUR_STORAGE_KEY) !== 'true';
		window.addEventListener('online', syncNetworkState);
		window.addEventListener('offline', syncNetworkState);
		window.addEventListener('resize', handleTourLayoutChange);
		window.addEventListener('scroll', handleTourLayoutChange, true);
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
			window.removeEventListener('resize', handleTourLayoutChange);
			window.removeEventListener('scroll', handleTourLayoutChange, true);
			window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
			window.removeEventListener('appinstalled', handleAppInstalled);
		};
	});

	$effect(() => {
		if (showTour) {
			tourStepIndex;
			void updateTourTarget();
		}
	});
</script>

{@render children()}

{#if showTour}
	<div class="fixed inset-0 z-[60] bg-ink/45">
		{#if tourTargetRect}
			<div
				class="pointer-events-none fixed rounded-xl border-2 border-green bg-bg/10 shadow-[0_0_0_9999px_rgba(28,28,26,0.36)]"
				style:top={`${tourTargetRect.top}px`}
				style:left={`${tourTargetRect.left}px`}
				style:width={`${tourTargetRect.width}px`}
				style:height={`${tourTargetRect.height}px`}
				aria-hidden="true"
			></div>
		{/if}

		<div
			class="fixed rounded-lg bg-bg p-5 text-ink shadow-2xl"
			style={tourPopoverStyle}
			role="dialog"
			aria-modal="true"
			aria-labelledby="tour-title"
		>
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-xs font-medium uppercase tracking-[0.18em] text-green">
						Céim {tourStepIndex + 1} de {tourSteps.length}
					</p>
					<h2 id="tour-title" class="mt-2 font-serif text-[28px] font-semibold leading-tight">
						{activeTourStep.title}
					</h2>
				</div>
				<button
					type="button"
					class="rounded-full p-1 text-ink/40 transition-colors hover:bg-ink/8 hover:text-ink"
					aria-label="Dún an turas"
					onclick={finishTour}
				>
					×
				</button>
			</div>

			<p class="mt-4 text-[15px] leading-6 text-ink/65">{activeTourStep.body}</p>

			<div class="mt-6 flex items-center justify-between gap-3">
				<button
					type="button"
					class="text-sm text-ink/45 transition-colors hover:text-ink/70"
					onclick={finishTour}
				>
					Scipeáil
				</button>

				<div class="flex items-center gap-3">
					<div class="flex gap-1.5" aria-hidden="true">
						{#each tourSteps as _, index}
							<span
								class="h-1.5 w-1.5 rounded-full {index === tourStepIndex ? 'bg-green' : 'bg-ink/15'}"
							></span>
						{/each}
					</div>

					<button
						type="button"
						class="rounded-lg bg-green px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-green/85"
						onclick={nextTourStep}
					>
						{isLastTourStep ? 'Críochnaigh' : 'Ar aghaidh'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}

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
							class="rounded-lg bg-green px-4 py-2 text-sm font-medium text-bg transition-colors hover:bg-green/85"
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
