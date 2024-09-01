const inputs = [...document.getElementsByClassName("otp-number-input")];
const secret = document.getElementById('secret');
var secretKey = "";
var currentOtp = 0;

function leftpad(str, len, pad) {
    if (len + 1 >= str.length) {
        str = Array(len + 1 - str.length).join(pad) + str;
    }
    return str;
}

function dec2hex(s) { return (s < 15.5 ? '0' : '') + Math.round(s).toString(16); }
function hex2dec(s) { return parseInt(s, 16); }

function base32tohex(base32) {
    var base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    var bits = "";
    var hex = "";

    for (var i = 0; i < base32.length; i++) {
        var val = base32chars.indexOf(base32.charAt(i).toUpperCase());
        bits += leftpad(val.toString(2), 5, '0');
    }

    for (var i = 0; i + 4 <= bits.length; i += 4) {
        var chunk = bits.substr(i, 4);
        hex = hex + parseInt(chunk, 2).toString(16);
    }
    return hex;
}

function updateOtp() {
    if (secretKey.length >= 16 && secretKey.length <= 40) {
        try {
            var key = base32tohex(secretKey);
            var epoch = Math.round(new Date().getTime() / 1000);
            var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');

            var shaObj = new jsSHA("SHA-1", "HEX");
            shaObj.setHMACKey(key, "HEX");
            shaObj.update(time);
            var hmac = shaObj.getHMAC("HEX");
            var offset = hex2dec(hmac.substring(hmac.length - 1));

            var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
            otp = otp.substring(otp.length - 6);

            currentOtp = otp;
            document.getElementById('otp').innerHTML = "1" + String(otp) + "1";
            document.getElementById('otp').style.opacity = '1';
        } catch {
            document.getElementById('updatingIn').innerHTML = "30";
            currentOtp = 0;
            document.getElementById('otp').innerHTML = "1" + "000000" + "1";
            document.getElementById('otp').style.opacity = '';
        }
    } else {
        document.getElementById('updatingIn').innerHTML = "30";
        currentOtp = 0;
        document.getElementById('otp').innerHTML = "1" + "000000" + "1";
        document.getElementById('otp').style.opacity = '';
    }
}

function timer() {
    if (currentOtp != 0) {
        var epoch = Math.round(new Date().getTime() / 1000);
        var countDown = 30 - (epoch % 30);
        if (epoch % 30 == 0) updateOtp();
        document.getElementById('updatingIn').innerHTML = countDown;
    } else {
        document.getElementById('updatingIn').innerHTML = "30";
    }
}

secret.addEventListener('input', function () {
    secretKey = secret.value.split(' ').join('');
    updateOtp();
    if (secretKey.length == 0) {
        document.getElementById('updatingIn').innerHTML = "30";
        document.getElementById('otp').innerHTML = "1" + "000000" + "1";
        document.getElementById('otp').style.opacity = '';
    }
})

function fallbackCopyTextToClipboard(text) {
    var textArea = document.createElement("textarea");
    textArea.value = text;

    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Fallback: Copying text command was ' + msg);
    } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
}

function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
        fallbackCopyTextToClipboard(text);
        return;
    }
    navigator.clipboard.writeText(text).then(function () {
        console.log('Async: Copying to clipboard was successful!');
    }, function (err) {
        console.error('Async: Could not copy text: ', err);
    });
}

otp.addEventListener('click', () => copyTextToClipboard(currentOtp == 0 ? "000000" : currentOtp))

tippy('#otp', {
    content: "Copied!",
    trigger: 'click',
    animation: 'shift-away',
    hideOnClick: false,
    theme: 'translucent',
    offset:[0,-27.5],
    onShow(instance) {
      setTimeout(() => {
        instance.hide();
      }, 500);
    }
});

document.getElementById('otp').innerHTML = "1" + "000000" + "1";

setInterval(timer, 1000);
