// HELPER

window.hasRolledInt = false;

function htmlEscape(string) {
    return string
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function html(strings, ...args) {
    return strings
        .map((str, i) =>
            i < args.length ?
            str +
            (args[i].__html ?
                [].concat(args[i].__html).join("") :
                htmlEscape(String(args[i]))) :
            str
        )
        .join("")
        .trim();
}

function toDigits(num, size = 0) {
    const result = num.split("");
    const padSize = Math.max(0, size - result.length);
    return [...Array(padSize).fill("0"), ...result];
}

function toSize(num) {
    if (typeof window.minimumIntLen == 'number') return window.minimumIntLen;
    return num.length;
}

// STYLES

function renderStyles() {
    return html`
      <style>
        :host {
          --roll-duration: 1s;
        }
        .digit {
          width: 1ch;
          overflow: hidden;
          display: inline-flex;
          position: relative;
        }
        .value {
          color: transparent;
          position: relative;
        }
        .scale {
          user-select: none;
          position: absolute;
          left: 0;
          display: inline-flex
          align-items: center;
          justify-content: center;
          flex-direction: column;
          transition: transform var(--roll-duration);
        }
        .scale span:last-child { /* the minus (-) */
          position: absolute;
          bottom: -10%;
          left: 0;
        }
        [data-value="​"] .scale { transform: translatey(10%); }
        [data-value="0"] .scale { transform: translatey(0); }
        [data-value="1"] .scale { transform: translatey(-5.25%); }
        [data-value="2"] .scale { transform: translatey(-10.55%); }
        [data-value="3"] .scale { transform: translatey(-15.75%); }
        [data-value="4"] .scale { transform: translatey(-21%); }
        [data-value="5"] .scale { transform: translatey(-26.25%); }
        [data-value="6"] .scale { transform: translatey(-31.55%); }
        [data-value="7"] .scale { transform: translatey(-36.75%); }
        [data-value="8"] .scale { transform: translatey(-42.15%); }
        [data-value="9"] .scale { transform: translatey(-47.35%); }
        [data-value="00"] .scale { transform: translatey(-52.65%); }
        [data-value="11"] .scale { transform: translatey(-57.85%); }
        [data-value="22"] .scale { transform: translatey(-63.15%); }
        [data-value="33"] .scale { transform: translatey(-68.35%); }
        [data-value="44"] .scale { transform: translatey(-73.65%); }
        [data-value="55"] .scale { transform: translatey(-78.85%); }
        [data-value="66"] .scale { transform: translatey(-84.25%); }
        [data-value="77"] .scale { transform: translatey(-89.45%); }
        [data-value="88"] .scale { transform: translatey(-94.75%); }
        [data-value="99"] .scale { transform: translatey(-104.75%); }
      </style>
    `;
}

// RENDER HELPER

function renderDigit(value, index) {
    return html`
      <span class="digit" data-value="${value}" id="digit${index}">
        <span class="scale" aria-hidden="true">
          <span>0</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
          <span>8</span>
          <span>9</span>
          <span>0</span>
          <span>1</span>
          <span>2</span>
          <span>3</span>
          <span>4</span>
          <span>5</span>
          <span>6</span>
          <span>7</span>
          <span>8</span>
          <span>9</span>
        </span>
        <span class="value">${value[0]}</span>
      </span>
    `;
}

function renderRoot() {
    return html`
      ${{ __html: renderStyles() }}
      <span id="wrapper"> </span>
    `;
}

function render($wrapper, nextState, prevState) {
    const {
        value,
        size
    } = nextState;
    if (size > prevState.size) {
        $wrapper.innerHTML = toDigits("", size).map(renderDigit).join("");
        setTimeout(() => {
            render($wrapper, nextState, {
                ...prevState,
                size
            });
        }, 23);
    } else {
        toDigits(value, size).forEach((digit, index, arr) => {
            const $digit = $wrapper.querySelector(`#digit${index}`);
            if (index == 0) window.$prevAll = [...$wrapper.children].map(a=>a.getAttribute('data-value')[0]).join('');
            window["prevInt" + index] = $digit.getAttribute('data-value');

            if ($digit && $prevAll != arr.join('')) {
                if (parseInt(window["prevInt" + index]) == parseInt(digit) && window.hasRolledInt) {
                    $digit.querySelector(".value").textContent = digit;
                    if (window["prevInt" + index].length == 2) {
                        $digit.dataset.value = digit;
                    } else {
                        $digit.dataset.value = String(digit).repeat(2);
                    }
                } else {
                    $digit.dataset.value = digit;
                    $digit.querySelector(".value").textContent = digit;
                }
            }
        });
    }
}

// WEB COMPONENT

const INTERNAL = Symbol("INTERNAL");

class RollingNumber extends HTMLElement {
    static get observedAttributes() {
            return ["value"];
        }
        [INTERNAL] = {
            $wrapper: null,
            state: {
                value: "",
                size: 0
            },
            update(payload) {
                if ("value" in payload) {
                    const {
                        value
                    } = payload;
                    const size = toSize(value);
                    const state = {
                        ...this.state,
                        value
                    };
                    const nextState = size > this.state.size ? {
                        ...state,
                        size
                    } : state;
                    render(this.$wrapper, nextState, this.state);
                    this.state = nextState;
                }
            },
        };
    constructor() {
        super();
        const shadow = this.attachShadow({
            mode: "open"
        });
        shadow.innerHTML = renderRoot();
        this[INTERNAL].$wrapper = shadow.getElementById("wrapper");
    }
    get value() {
        return this[INTERNAL].state.value;
    }
    set value(value) {
        window.hasRolledInt = true;
        this[INTERNAL].update({
            value: value
        });
    }
    attributeChangedCallback(name, _, newValue) {
        if (name === "value") {
            this.value = newValue;
        }
    }
    connectedCallback() {
        if (this.isConnected) {
            const input = this.getAttribute("value") || this.textContent;
            try {
                if (typeof this.getAttribute('data-minimum') == 'string') window.minimumIntLen = parseInt(this.getAttribute('data-minimum'));
            } catch {}
            const value = input;
            this[INTERNAL].update({
                value
            });
        }
    }
}

customElements.define("layflags-rolling-number", RollingNumber);

export {
    RollingNumber
};