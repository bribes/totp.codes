const secret = document.getElementById('secret');
const updatingIn = document.getElementById('updatingIn');
const otpEl = document.getElementById('otp');
const none = "000000";
let secretKey = "";
let currentOtp = none;

const dec2hex = s => s.toString(16).padStart(2, '0');
const hex2dec = s => parseInt(s, 16);

function base32tohex(base32) {
    const base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    return Array.from(base32.toUpperCase())
        .map(char => base32chars.indexOf(char).toString(2).padStart(5, '0'))
        .join('')
        .match(/.{4}/g)
        .map(bin => parseInt(bin, 2).toString(16))
        .join('');
}

function updateOtp() {
    if (secretKey.length < 16 || secretKey.length > 40) return resetOtp();

    try {
        const key = base32tohex(secretKey);
        const epoch = Math.floor(Date.now() / 1000);
        const time = dec2hex(Math.floor(epoch / 30)).padStart(16, '0');

        const shaObj = new jsSHA("SHA-1", "HEX");
        shaObj.setHMACKey(key, "HEX");
        shaObj.update(time);
        const hmac = shaObj.getHMAC("HEX");

        const offset = hex2dec(hmac.slice(-1));
        const otp = (hex2dec(hmac.slice(offset * 2, offset * 2 + 8)) & 0x7fffffff).toString().slice(-6);

        setOtp(otp);
    } catch {
        resetOtp();
    }
}

function setOtp(otp) {
    currentOtp = otp;
    const otpElem = otpEl;
    otpElem.value = otp;
    otpElem.style.opacity = '1';
    otpElem.style.cursor = 'pointer';
}

function resetOtp() {
    currentOtp = none;
    const otpElem = otpEl;
    otpElem.value = none;
    otpElem.style.opacity = '';
    otpElem.style.cursor = '';
    updatingIn.textContent = "30";
}

function timer() {
    const epoch = Math.floor(Date.now() / 1000);
    const countDown = 30 - (epoch % 30);
    updatingIn.textContent = currentOtp !== none ? countDown : "30";
    if (epoch % 30 === 0) updateOtp();
}

secret.addEventListener('input', function () {
    secretKey = secret.value.replace(/ /g, '');
    updateOtp();
    if (secretKey.length === 0) resetOtp();
});

async function copyTextToClipboard(text) {
    if (text === none) return;
    try {
        await navigator.clipboard.writeText(text);
        console.log('Copied!');
    } catch {
        fallbackCopyTextToClipboard(text);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    Object.assign(textArea.style, { top: "0", left: "0", position: "fixed" });

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        document.execCommand('copy');
        console.log('Fallback: Copying text command was successful');
    } catch (err) {
        console.error('Fallback: Unable to copy', err);
    }

    document.body.removeChild(textArea);
}

otpEl.addEventListener('click', () => copyTextToClipboard(currentOtp));

tippy('#otp', {
    content: "Copied!",
    trigger: 'click',
    animation: 'shift-away',
    hideOnClick: false,
    theme: 'translucent',
    offset: [0, -27.5],
    onShow(instance) {
        if (currentOtp === none) return false;
        setTimeout(() => instance.hide(), 500);
    }
});

setInterval(timer, 1000);
window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") updateOtp();
});

window.addEventListener("copy", e => {
    const copiedText = window.getSelection().toString().trim();
    if (/^\d+$/.test(copiedText.replace(/\s/g, ""))) {
        e.clipboardData.setData("text/plain", currentOtp);
        e.preventDefault();
    }
});

const url = new URL(window.location.href);
if (url.searchParams.has('code')) {
    secretKey = url.searchParams.get('code').replace(/\s+/g, '');
    secret.value = secretKey.match(/.{1,4}/g)?.join(' ') || '';
    updateOtp();

    url.searchParams.delete('code');
    window.history.replaceState({}, document.title, url.toString());
}