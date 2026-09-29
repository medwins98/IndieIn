async function handleQrisUpload(file)
{
	if(!file) return null;

	if(!('BarcodeDetector' in window)) {
		alert("Browser Anda belum mendukung fitur pemindaian gambar QR native secara langsung.\n\nSilakan paste raw string QRIS secara manual ke dalam teks area.");
		return null;
	}

	try {
		const imageBitmap = await createImageBitmap(file);
		const barcodeDetector = new BarcodeDetector({ formats: ['qr_code'] });
		const barcodes = await barcodeDetector.detect(imageBitmap);

		if(barcodes.length > 0) {
			return parseStaticQRIS(barcodes[0].rawValue);
		} else {
			alert("QR Code tidak terdeteksi pada gambar yang diunggah.");
		}
	}
	catch (err) {
		console.error("Gagal mendecode QR Code:", err);
		alert("Terjadi kesalahan saat memproses gambar.");
	}
}

// --- UTILS: CRC16-CCITT ---
function calcCRC16(str)
{
	let crc = 0xFFFF;
	for (let c = 0; c < str.length; c++) {
		crc ^= str.charCodeAt(c) << 8;
		for (let i = 0; i < 8; i++) {
			if((crc & 0x8000) !== 0) {
				crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
			} else {
				crc = (crc << 1) & 0xFFFF;
			}
		}
	}
	let hex = crc.toString(16).toUpperCase();
	return hex.padStart(4, '0');
}

function pad2(num) {
	return num.toString().padStart(2, '0');
}

function buildTLV(tag, value) {
	if(!value) return '';
	return tag + pad2(value.length) + value;
}

// --- PARSER TLV EMVCo ---
function parseTLV(str) {
	let tags = {};
	let i = 0;
	while (i < str.length) {
		let tag = str.substring(i, i + 2);
		let len = parseInt(str.substring(i + 2, i + 4), 10);
		let val = str.substring(i + 4, i + 4 + len);
		tags[tag] = val;
		i += 4 + len;
	}
	return tags;
}

function parseStaticQRIS(raw) {
	raw = raw.trim();
	if (!raw) {
		alert("Silakan masukkan string atau unggah gambar QRIS terlebih dahulu.");
		return null;
	}

	try {
		parsedTags = parseTLV(raw);
		
		const name = parsedTags['59'] || 'N/A';
		const city = parsedTags['60'] || 'N/A';
		
		let nmid = 'Terdeteksi';
		if (parsedTags['51']) {
			let tag51Data = parseTLV(parsedTags['51']);
			nmid = tag51Data['02'] || 'N/A';
		}
		return { raw, name, city, nmid };
	} catch (e) {
		alert("Format QRIS tidak valid. Pastikan data mengacu pada standar EMVCo/QRIS.");
		return null;
	}
}

function generateDynamicQRIS(baseQR, amount = 0, receiptNo = null, feeType = "", feeValue = "")
{
	if(!amount || parseFloat(amount) <= 0) {
		alert("Masukkan nominal transaksi yang valid.");
		return;
	}
	
	amount = amount.toString();

	const parsedTags = parseTLV(baseQR);
	let newTags = { ...parsedTags };

	newTags['01'] = '12';
	newTags['54'] = amount;
	
	delete newTags['55'];
	delete newTags['56'];
	delete newTags['57'];

	if(feeType && feeValue) {
		newTags['55'] = feeType;
		if(feeType === '02') newTags['56'] = feeValue;
		if(feeType === '03') newTags['57'] = feeValue;
	}

	if(receiptNo) {
		let tag62Sub = buildTLV('01', receiptNo) + buildTLV('07', 'A01');
		newTags['62'] = tag62Sub;
	}

	let keys = Object.keys(newTags).filter(k => k !== '63').sort();
	let payloadWithoutCRC = '';
	
	keys.forEach(k => {
		payloadWithoutCRC += buildTLV(k, newTags[k]);
	});

	payloadWithoutCRC += '6304';

	const crcHex = calcCRC16(payloadWithoutCRC);
	const finalQRIS = payloadWithoutCRC + crcHex;
	const qrisInfo = parseStaticQRIS(baseQR);
	
	return { finalQRIS, qrisInfo };
}