const secretInput = document.getElementById('secret');
const updatingIn = document.getElementById('updatingIn');
const otpEl = document.getElementById('otp');

const none = "000000";
let secretKey = "";
let currentOtp = none;
let totp = null;

function updateOtp() {
    try {
        if (!totp) return resetOtp();

        const otp = totp.generate();
        setOtp(otp);
    } catch {
        resetOtp();
    }
}

function setOtp(otp) {
    currentOtp = otp;
    otpEl.value = otp;
    otpEl.style.opacity = '1';
    otpEl.style.cursor = 'pointer';
}

function resetOtp() {
    currentOtp = none;
    otpEl.value = none;
    otpEl.style.opacity = '';
    otpEl.style.cursor = '';
    updatingIn.textContent = "30";
}

function timer() {
    const epoch = Math.floor(Date.now() / 1000);
    const countDown = 30 - (epoch % 30);
    updatingIn.textContent = currentOtp !== none ? countDown : "30";

    if (epoch % 30 === 0) updateOtp();
}

secretInput.addEventListener('input', function () {
    secretKey = secretInput.value.replace(/ /g, '');
    if (secretKey.length === 0) {
        totp = null;
        return resetOtp();
    }
    totp = new OTPAuth.TOTP({
        secret: secretKey,
        algorithm: 'SHA1',
        digits: 6,
        period: 30
    });

    updateOtp();
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

setInterval(timer, 1000);
window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") updateOtp();
});

window.addEventListener("DOMContentLoaded", () => {
    otpEl.addEventListener('click', () => copyTextToClipboard(currentOtp));

    if (typeof tippy === 'function') {
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
    }

    const url = new URL(window.location.href);
    if (url.searchParams.has('code')) {
        secretKey = url.searchParams.get('code').replace(/\s+/g, '');
        secretInput.value = secretKey.match(/.{1,4}/g)?.join(' ') || '';
        url.searchParams.delete('code');
        window.history.replaceState({}, document.title, url.toString());

        setTimeout(() => {
            totp = new OTPAuth.TOTP({
                secret: secretKey,
                algorithm: 'SHA1',
                digits: 6,
                period: 30
            });
            updateOtp();
        }, 50);
    }
});