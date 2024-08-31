const inputs = [...document.getElementsByClassName("otp-number-input")];

const getSecret = (_inputs = inputs) => {
    return _inputs.map(a => a.value).join('');
}

inputs.forEach((e) => {
    e.addEventListener('keydown', function (ev) {
        if (ev.keyCode == 17 || ev.keyCode == 86 && ev.ctrlKey) {
        } else {
            otp_val = ev.target.value;
            if (ev.keyCode == 37) {
                ev.target.previousElementSibling.focus();
                ev.preventDefault();
            } else if (ev.keyCode == 39) {
                if (ev.target.nextElementSibling) ev.target.nextElementSibling.focus();
                ev.preventDefault();
            } else if (otp_val.length == 1 && ev.keyCode != 8 && ev.keyCode != 46) {
                otp_next_number = ev.target.nextElementSibling;
                if (otp_next_number.length == 1 && otp_next_number.value.length == 0) {
                    otp_next_number.focus();
                }
            } else if (otp_val.length == 0 && ev.keyCode == 8) {
                if (ev.target.previousElementSibling) {
                    ev.target.previousElementSibling.value = "";
                    ev.target.previousElementSibling.focus();
                }
            } else if (otp_val.length == 1 && ev.keyCode == 8) {
                ev.target.value = "";
            } else if (otp_val.length == 0 && ev.keyCode == 46) {
                next_input = ev.target.nextElementSibling;
                next_input.value = "";
                while (next_input.nextElementSibling.length > 0) {
                    next_input.value = next_input.nextElementSibling.value;
                    next_input = next_input.nextElementSibling;
                    if (next_input.nextElementSibling.length == 0) {
                        next_input.value = "";
                        break;
                    }
                }
            }
        }
    });


    e.addEventListener('focus', function (ev) {
        ev.target.select();
    });

    e.addEventListener('input', function (ev) {
        if (ev.keyCode == 17 || ev.keyCode == 86 && ev.ctrlKey) {
        } else {
            otpCodeTemp = "";
            [...document.querySelectorAll('input.otp-number-input')].forEach(function (el) {
                if (el.value.length != 0) {
                    el.classList.add("otp-filled-active");
                } else {
                    el.classList.remove("otp-filled-active");
                }
                otpCodeTemp += el.value;
            });

            if (ev.target.value.length == 1 && ![37, 39].includes(ev.keyCode)) {
                if (ev.target.nextElementSibling) ev.target.nextElementSibling.focus();
                ev.preventDefault();
            }
        }
    });
});

inputs.forEach(e => e.addEventListener("click", function (e) {
    otp_val = document.getElementById("otp-number-input-1").value;
    if (otp_val === "") {
        document.getElementById("otp-number-input-1").focus();
    }
}));

inputs.forEach(e => e.addEventListener("paste", function (e) {
    e.stopPropagation();
    e.preventDefault();

    var clipboardData = e.clipboardData || window.clipboardData;
    var pastedData = clipboardData.getData('Text');

    pastedData = pastedData.split(' ').join('');

    var active = document.activeElement;
    if (active && active.classList.contains('otp-number-input')) {
        var startFrom = Number(active.id.split('-').slice(-1)[0]);
        var fullData = getSecret(inputs.slice(0, startFrom-1)) + pastedData;
        console.log(fullData)
        
        if (fullData.length <= 16) {
            pastedData.split('').forEach((letter, i, arr) => {
                var el = document.getElementById('otp-number-input-' + (i + startFrom));
                el.value = letter;
                if ((i + startFrom) == 16) updateOtp();
                if (arr.length - 1 == i) el.focus();
            })
        } else {
            alert('Secret too long')
        }
    }
}));

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
    if (getSecret().length == 16) {
        var key = base32tohex(getSecret());
        var epoch = Math.round(new Date().getTime() / 1000);
        var time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');

        // updated for jsSHA v2.0.0 - http://caligatio.github.io/jsSHA/
        var shaObj = new jsSHA("SHA-1", "HEX");
        shaObj.setHMACKey(key, "HEX");
        shaObj.update(time);
        var hmac = shaObj.getHMAC("HEX");
        var offset = hex2dec(hmac.substring(hmac.length - 1));

        var otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
        otp = otp.substring(otp.length - 6);

        document.getElementById('otp').innerHTML = otp;
    }
}

function timer() {
    if (getSecret().length == 16) {
        var epoch = Math.round(new Date().getTime() / 1000);
        var countDown = 30 - (epoch % 30);
        if (epoch % 30 == 0) updateOtp();
        document.getElementById('updatingIn').innerHTML = countDown;
    } else {
        document.getElementById('updatingIn').innerHTML = "0";
        document.getElementById('otp').innerHTML = "000000";
    }
}

document.getElementById('otp-number-input-16').addEventListener('input', function () {
    updateOtp();
});

setInterval(timer, 1000);