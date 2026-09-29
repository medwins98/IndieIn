import { html, useEffect, useState, useRef, useCallback } from 'importmap';

export function useDevice()
{
	const [device, setDevice] = useState(() => {
		if (typeof window === 'undefined') return { isMobile: false, isTablet: false, isDesktop: true, isTouch: false, canHover: false };
		
		const width = window.innerWidth;
		const isTouch = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
		const canHover = window.matchMedia?.('(hover: hover)')?.matches ?? false;
		
		return {
			isMobile: width < 640,
			isTablet: width >= 640 && width < 1024,
			isDesktop: width >= 1024,
			isTouch,
			canHover
		};
	});

	useEffect(() => {
		if (typeof window === 'undefined') return;

		const update = () => {
			const width = window.innerWidth;
			setDevice({
				isMobile: width < 640,
				isTablet: width >= 640 && width < 1024,
				isDesktop: width >= 1024,
				isTouch: window.matchMedia?.('(pointer: coarse)')?.matches ?? false,
				canHover: window.matchMedia?.('(hover: hover)')?.matches ?? false
			});
		};

		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, []);

	return device;
}

function Scanner({ onScan, children })
{
	const [logs, setLogs] = useState([]);
	const [isScanning, setIsScanning] = useState(false);

	const videoRef = useRef(null);
	const streamRef = useRef(null);
	const animFrameRef = useRef(null);
	const isMountedRef = useRef(true);

	const addLog = useCallback((msg) => {
		if (isMountedRef.current) {
			setLogs((prev) => [...prev, msg]);
		}
	}, []);

	const stopCamera = useCallback(() => {
		if (animFrameRef.current) {
			cancelAnimationFrame(animFrameRef.current);
			animFrameRef.current = null;
		}
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}
		if (isMountedRef.current) {
			setIsScanning(false);
		}
	}, []);

	const startScanning = useCallback(async () => {
		if (isMountedRef.current) setIsScanning(true);

		const isHttps = window.location.protocol === 'https:';
		const isLocalhost =
			window.location.hostname === 'localhost' ||
			window.location.hostname === '127.0.0.1';

		if (!isHttps && !isLocalhost) {
			addLog('❌ ERROR: Must run under HTTPS or localhost!');
			if (isMountedRef.current) setIsScanning(false);
			return;
		}

		if (!('BarcodeDetector' in window)) {
			addLog('❌ ERROR: BarcodeDetector API is not supported in this browser.');
			if (isMountedRef.current) setIsScanning(false);
			return;
		}

		let stream = null;
		try {
			stream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: { ideal: 'environment' } },
			});
		}
		catch (err) {
			try {
				stream = await navigator.mediaDevices.getUserMedia({ video: true });
			}
			catch (e) {
				addLog('❌ Camera access denied: ' + e.message);
				if (isMountedRef.current) setIsScanning(false);
				return;
			}
		}

		if (!isMountedRef.current) {
			if (stream) stream.getTracks().forEach((track) => track.stop());
			return;
		}

		streamRef.current = stream;
		if (videoRef.current) {
			videoRef.current.srcObject = stream;
		}

		try {
			const formats = await window.BarcodeDetector.getSupportedFormats();
			const detector = new window.BarcodeDetector({ formats });

			function processFrame()
			{
				if (!isMountedRef.current) return;

				const video = videoRef.current;
				if (video && video.readyState === video.HAVE_ENOUGH_DATA)
				{
					detector
						.detect(video)
						.then((barcodes) => {
							if (!isMountedRef.current) return;

							if (barcodes.length > 0) {
								addLog(`✅ Scanned: ${barcodes[0].rawValue}`);
								onScan(barcodes[0].rawValue);
								stopCamera();
								return;
							}
							animFrameRef.current = requestAnimationFrame(processFrame);
						})
						.catch((err) => {
							console.error(err);
							if (isMountedRef.current) {
								animFrameRef.current = requestAnimationFrame(processFrame);
							}
						});
				}
				else {
					animFrameRef.current = requestAnimationFrame(processFrame);
				}
			}

			processFrame();
		}
		catch (err) {
			addLog('❌ Detector init failed: ' + err.message);
			stopCamera();
		}
	}, [addLog, stopCamera, onScan]);

	useEffect(() => {
		isMountedRef.current = true;
		startScanning();

		return () => {
			isMountedRef.current = false;
			stopCamera();
		};
	}, [startScanning, stopCamera]);

	return html`
		<div class="section camera">
			<div class="section-header">
				<div class="section-title">Scan</div>
				${children}
			</div>
			<div class="section-content-wrapper">
				<video ref=${videoRef} autoPlay playsInline muted />
				<pre class="log">${logs.join('')}</pre>
			</div>
		</div>`;
}

export function ToggleScanner({ onScan, className, ...attributes })
{
	const [isOpen, setOpen] = useState(false);
	const dialogRef = useRef(null);
	
	useEffect(() => {
		if (isOpen && dialogRef.current) {
			dialogRef.current.showModal();
		}
	}, [isOpen]);
	
	const scanHandler = useCallback((barcode) => {
		setOpen(false);
		onScan(barcode);
	}, [onScan]);
	
	if (!isOpen) {
		return html`
			<button onClick=${() => setOpen(true)} class="btn btn-icon ${className}" type="button" ...${attributes} aria-label="Open camera">
				<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
					<circle cx="12" cy="13" r="4"/>
				</svg>
			</button>`;
	}
	
	return html`
		<dialog ref=${dialogRef} class="drawer">
			<${Scanner} onScan=${scanHandler} >
				<button onClick=${() => setOpen(false)} class="btn btn-icon ${className}" type="button" aria-label="Close camera">
					<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<line x1="18" y1="6" x2="6" y2="18"/>
						<line x1="6" y1="6" x2="18" y2="18"/>
					</svg>
				</button>
			<//>
		</dialog>`;
}

export async function getCurrentLocation()
{
	if (typeof window === 'undefined' || !('geolocation' in navigator)) {
		console.warn("Browser not support Geolocation API");
		return null;
	}

	return new Promise((resolve) => {
		navigator.geolocation.getCurrentPosition(
			(position) => {
				resolve({
					lat: position.coords.latitude,
					lng: position.coords.longitude,
					accuracy: position.coords.accuracy
				});
			},
			(error) => {
				console.warn("GPS error:", error.message);
				resolve(null);
			},
			{
				enableHighAccuracy: true,
				timeout: 5000,
				maximumAge: 0
			}
		);
	});
}

export function useGeolocation()
{
	const [location, setLocation] = useState(null);
	const [error, setError] = useState(null);

	const getLocation = useCallback(async () => {
		const loc = await getCurrentLocation();
		if (loc) {
			setLocation(loc);
		}
		else {
			setError("GPS error");
		}
		return loc;
	}, []);

	return { location, error, getLocation };
}