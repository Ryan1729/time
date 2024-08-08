const scriptStart = performance.now();
const DEBUG_MODE = location.protocol === "file:"
if (DEBUG_MODE) {
    console.log("DEBUG_MODE = " + DEBUG_MODE)
}
const MEASURE_FRAMES = DEBUG_MODE

// The following gives me an error about time.js not being a module:
// @typedef {import('./time.js').CalendarKind} CalendarKind
// I don't want to change things to be a module, so just dupe the def.
/**
 * @typedef {0|1|2|3} CalendarKind
 */
// REMEBMER TO UPDATE ByCalendarKind IF ADDING TO CalendarKind
/**
 * @template Value
 * @typedef {{ [_key in keyof { [0]: unknown, [1]: unknown, [2]: unknown, [3]: unknown } ]: Value; }} ByCalendarKind<Value>
 * */

/** @typedef {0|1|2} CalendarAppearance */

/** @typedef {0|1|2} BoxSpecKind */

/** @typedef {{text: string|number, kind: BoxSpecKind, linkedTime: Integer}} BoxSpec */

/** @typedef {BoxSpec[]} BoxSpecs */

/** @typedef {{ monthText: string, boxSpecs: BoxSpecs, appearance: CalendarAppearance }} CalendarSpecs */

/** @typedef {string} ElemIdPrefix */
/** @typedef {ElemIdPrefix} ElemId */

/** @typedef {string} ClassName */

/** @typedef {number} Integer */

/** @typedef {1|2|3|4|5|6|7|8|9|10|11|12} Month */
/** @typedef {1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|21|22|23|24|25|26|27|28|29|30|31} DayOfMonth */

/** @typedef {0|1|2|3|4|5|6|7|8|9|10|11} ZeroIndexedMonth */
/** @typedef {0|1|2|3|4|5|6|7|8|9|10|11|12|13} ZeroIndexedIFCMonth */

/** @typedef {Integer} Days */
/** @typedef {Integer} Hours */
/** @typedef {Integer} Minutes */
/** @typedef {Integer} G0Year */
/** @typedef {Integer} J0Year */
/** @typedef {Integer} IFCYear */
/** @typedef {Integer} ZeroIndexedDayOfYear */
/** @typedef {Integer} JulianDaysSinceJulianEpoch */

/** @typedef {0|1|2|3|4|5|6} DayOfWeek */

/** @typedef {0|1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|21|22|23} ZeroIndexedHour */
/** @typedef {1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|21|22|23|24} OneIndexedHour */

/** @typedef {1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|21|22|23|24|25|26|27|28|29|30|31|31|32|33|34|35|36|37|38|39|40|41|41|42|43|44|45|46|47|48|49|50|51|52} PlayingCardNumber */

// TODO: Pull these functions into `Time` and use them everywhere we can
// Return type technically not correct because of NaN, but that only happnens
// for `Date`s with a time value of NaN which we intend to avoid.
/** @type {(date: Date) => ZeroIndexedMonth} */
const zeroIndexedMonthFromDate = (date) => /** @type {ZeroIndexedMonth} */ (date.getUTCMonth());

/** @type {(date: Date) => DayOfMonth} */
const dayOfMonthFromDate = (date) => /** @type {DayOfMonth} */ (date.getUTCDate());

/** @typedef {number} EpochTime */
/** @typedef {Integer} Millis */

/** @typedef {Integer} Index */

/** @typedef {number} Radians */

/** @type {Radians} */
const TAU = 2 * Math.PI

/** @typedef {number} Scale */

/** @typedef {number} X */
/** @typedef {number} Y */

/** @typedef {[X, Y]} XY */

/** @typedef {number} W */
/** @typedef {number} H */

const displayedStep = document.getElementById("displayed-step");
const raw = document.getElementById("raw");
const utcString = document.getElementById("utc-string");
const inputRange = document.getElementById("selected-time");
const inputNumber = document.getElementById("selected-time-number");

const subsetNumber = document.getElementById("subset-number");

const timepieces = document.getElementById("timepieces");

/** @type {ElemId[]} */
const TIMEPIECE_IDS = []

/** @type {(element: HTMLElement, ids?: ElemId[]) => void} */
const appendTimepiece = (element, ids) => {
    ids ||= [element.id]
    ids = ids.filter(x => x)
    if (ids.length <= 0) {
        console.error("No ids for " + element)
        return
    }

    TIMEPIECE_IDS.push(...ids)
    timepieces.appendChild(element);
}

const ALL_TIMEPIECES_SUBSET = (1n << BigInt(TIMEPIECE_IDS.length)) - 1n
subsetNumber.value = ALL_TIMEPIECES_SUBSET

/** @type {(substr: string) => bigint} */
const subsetThatContains = (substr) => {
    let subset = 0n
    let bit = 1n
    for (let id of TIMEPIECE_IDS) {
        if (id.includes(substr)) {
            subset |= bit
        }
        bit <<= 1n
    }
    return subset
}

/** @type {(args: {addID: ElemId, onlyID: ElemId, removeID: ElemId, subset: bigint}) => void} */
const setupCatergoryControls = ({addID, onlyID, removeID, subset}) => {
    const add = document.getElementById(addID);
    const onAdd = () => {
        setSubsetMask(getCurrentSubsetMask() | subset)
    }
    add.onclick = onAdd

    const only = document.getElementById(onlyID);
    const onOnly = () => {
        setSubsetMask(subset)
    }
    only.onclick = onOnly

    const remove = document.getElementById(removeID);
    const onRemove = () => {
        setSubsetMask(getCurrentSubsetMask() & ~subset)
    }
    remove.onclick = onRemove
};

/** @type {(mask: bigint) => void} */
const setSubsetMask = (mask) => {
    subsetNumber.value = mask

    for (let index = 0; index < TIMEPIECE_IDS.length; index += 1) {
        const element = document.getElementById(TIMEPIECE_IDS[index])

        if ((mask & (1n << BigInt(index))) !== 0n) {
            element.style.display = "unset";
        } else {
            element.style.display = "none";
        }
    }
}

/** @type {() => bigint} */
const getCurrentSubsetMask = () => {
    let subset
    try {
        subset = BigInt(subsetNumber.value)
    } catch (e) {
        if (DEBUG_MODE) {
            console.log(e)
        }
        subset = ALL_TIMEPIECES_SUBSET
    }
    return subset
}

/** @type {() => void} */
const onSubsetChange = () => {
    setSubsetMask(getCurrentSubsetMask())
}
subsetNumber.oninput = onSubsetChange

const subsetShiftUp = document.getElementById("subset-shift-up");
/** @type {() => void} */
const onShiftUp = () => {
    setSubsetMask(getCurrentSubsetMask() << 1n)
}
subsetShiftUp.onclick = onShiftUp

const subsetShiftDown = document.getElementById("subset-shift-down");
/** @type {() => void} */
const onShiftDown = () => {
    setSubsetMask(getCurrentSubsetMask() >> 1n)
}
subsetShiftDown.onclick = onShiftDown

const startTime = new Date().getTime()
const TIME_ROUND_TO = 1_000_000_000_000

const defaultLowEdge = Math.floor(startTime / TIME_ROUND_TO) * TIME_ROUND_TO
const defaultHighEdge = Math.ceil(startTime / TIME_ROUND_TO) * TIME_ROUND_TO

inputRange.min = inputNumber.min = defaultLowEdge
inputRange.max = inputNumber.max = defaultHighEdge
/** @type {(step: number) => void} */
const setStep = (step) => {
    inputRange.step = inputNumber.step = step
    if (step === 1) {
        displayedStep.textContent = ''
    } else {
        displayedStep.textContent = "movement ×" + step.toLocaleString() + " " + humanReadableSIDurationFromMillis(step)
    }
}
/** @type {(time: EpochTime) => void} */
const setFromTime = (time) => {
    inputRange.value = inputNumber.value = time
}
setFromTime(startTime)

const RUNNING = "running"
const PAUSED = "paused"

let inputMode = RUNNING
/** @type {() => void} */
const onInput = () => {
    inputMode = PAUSED
    // TODO? Are we gonna want to debounce this?
    const v = event.target.value
    const parsed = parseInt(v)

    const min = parseInt(inputRange.min)
    const max = parseInt(inputRange.max)

    let time
    if (Number.isNaN(parsed) || parsed < min) {
        time = min
    } else if (parsed > max) {
        time = max
    } else {
        time = parsed
    }

    renderAt(new Date(time))
}
inputRange.oninput = inputNumber.oninput = onInput

/** @type number */
let startClientY;
inputRange.addEventListener("pointerdown", (e) => {
    startClientY = e.clientY

    inputRange.addEventListener("pointermove", (e) => {
      const yDelta = Math.abs(startClientY - e.clientY)

      const PIXELS_PER_STEP = 16;
      const rawStep = Math.pow(10, Math.floor(yDelta/PIXELS_PER_STEP))

      const range = parseInt(inputRange.max) - parseInt(inputRange.min)

      setStep(Math.min(rawStep, range))
    });
});
inputRange.addEventListener("pointerup", (e) => {
    // Avoid jittering the input when releasing
    const selectedValue = inputRange.value
    setTimeout(() => setFromTime(selectedValue), 8)
});

const minus = document.getElementById("minus");
minus.onclick = () => {
    inputRange.min = inputNumber.min = parseInt(inputRange.min) - TIME_ROUND_TO
};

const plus = document.getElementById("plus");
plus.onclick = () => {
    inputRange.max = inputNumber.max = parseInt(inputRange.max) + TIME_ROUND_TO
};

/** @type {(args: {prefix: string, outputClass: string, labelText?: string, labelHTML?: string}) => HTMLOutputElement} */
const appendLabelledRow = ({prefix, outputClass, labelText, labelHTML}) => {
    const outer = document.createElement("div");
    outer.id = prefix + "-row";
    outer.className = "labelled-row";

    /** @type HTMLOutputElement */
    const output = document.createElement("output");
    output.id = prefix;
    output.className = outputClass;
    outer.appendChild(output);

    const label = document.createElement("div");
    label.className = "labelled-row-label";
    if (labelText !== undefined) {
        label.innerText = labelText;
    }
    if (labelHTML !== undefined) {
        label.innerHTML = labelHTML;
    }

    outer.appendChild(label);

    appendTimepiece(outer);

    return output;
}

// TODO replace unknown
/** @typedef {{ monthLabel: HTMLDivElement, weekLabels: unknown, boxes: unknown, extraBoxesLabel: unknown, extraBoxes: unknown, outer: unknown }} CalendarElements */

/** @type {(prefix: ElemIdPrefix, typeText: string) => CalendarElements} */
const appendCalendarElements = (prefix, typeText) => {
    const outer = document.createElement("div")
    outer.id = prefix
    outer.className = "thin-border calendar"

    const monthLabel = document.createElement("div")
    monthLabel.id = prefix + "-month"
    monthLabel.className = "month-label"
    outer.appendChild(monthLabel)

    const calendarLabel = document.createElement("div")
    calendarLabel.className = "calendar-type-label"
    calendarLabel.innerText = typeText
    outer.appendChild(calendarLabel)

    const weekLabels = document.createElement("div")
    weekLabels.id = prefix + "-week-labels"
    weekLabels.className = "seven-columns thin-border-row"

    for (const weekday of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
        const el = document.createElement("div")
        el.innerText = weekday
        weekLabels.appendChild(el)
    }
    outer.appendChild(weekLabels)

    const boxes = document.createElement("div")
    boxes.id = prefix + "-boxes"
    boxes.className = "seven-columns"
    outer.appendChild(boxes)

    const extraBoxesLabel = document.createElement("div")
    extraBoxesLabel.id = prefix + "-extra-label"
    extraBoxesLabel.className = "thin-border-row center-text"
    extraBoxesLabel.setAttribute("style", "display: none")
    outer.appendChild(extraBoxesLabel)

    const extraBoxes = document.createElement("div")
    extraBoxes.id = prefix + "-extra-boxes"
    extraBoxes.className = "seven-columns"
    extraBoxes.setAttribute("style", "display: none")
    outer.appendChild(extraBoxes)

    return {
        monthLabel,
        weekLabels,
        boxes,
        extraBoxesLabel,
        extraBoxes,
        outer: appendTimepiece(outer),
    };
}

/** @type {(calendar: CalendarKind) => string} */
const calendarName = (calendar) => {
    switch (calendar) {
        default:
            console.error("unhandled calendar kind: " + calendar)
            // fallthrough
        case Time.GREGORIAN0:
            return "Gregorian 0"
        case Time.INTERNATIONAL_FIXED:
            return "International Fixed"
        case Time.JULIAN0:
            return "Julian 0"
        case Time.GREGORIAN1:
            return "Gregorian 1"
    }
}

/** @typedef {{ctx: CanvasRenderingContext2D, scale: number}} AnalogueClockCtx */

/** @type {(id: ElemId, scale?: number) => AnalogueClockCtx}} */
const getAnalogueClockCtx = (id, scale) => { // TODO: Still used?
    scale ||= 1

    const lengths = clockLengths(scale)

    const canvas = document.getElementById(id)
    canvas.width = lengths.clockWidth
    canvas.height = lengths.clockHeight
    return {
        ctx: canvas.getContext("2d"),
        scale,
    };
}

// TODO replace unknown
/** @typedef {unknown} ClockLengths */

/** @type {{[scale: number]: ClockLengths}} */
let clockLengthsMemo = {}

/** @type {(scale: number) => ClockLengths}} */
const clockLengths = (scale) => {
    scale ||= 1

    // TODO? Measure whether memoizing this was actually worth it?
    if (!clockLengthsMemo[scale]) {
        const clockWidth = 100 * scale
        const clockHeight = 100 * scale
        const clockX = clockWidth/2
        const clockY = clockHeight/2
        const clockRadius = clockWidth * 0.45
        const clockNumberRadius = clockWidth * 0.375
        const clockInnerEdgeRadius = clockRadius * 0.95
        const clockSecondRadius = clockInnerEdgeRadius * 0.975
        const clockMinuteRadius = clockInnerEdgeRadius * 0.95
        const clockHourRadius = clockInnerEdgeRadius * 0.65

        clockLengthsMemo[scale] = {
            clockWidth,
            clockHeight,
            clockX,
            clockY,
            clockRadius,
            clockNumberRadius,
            clockInnerEdgeRadius,
            clockSecondRadius,
            clockMinuteRadius,
            clockHourRadius,
        }
    }

    return clockLengthsMemo[scale]
}


/** @typedef {{ ctx: AnalogueClockCtx, verbal: HTMLOutputElement }} VerbalAnaloguePair */

// TODO make these three functions compaosable/less duplicated?
/** @type {(args: {verbalId: ElemId, verbalClass?: ClassName, analogueId: ElemId, analogueDescription: string, analogueScale?: Scale }) => VerbalAnaloguePair} */
const appendVerbalAnaloguePair = ({
    verbalId,
    verbalClass,
    analogueId,
    analogueDescription,
    analogueScale
}) => {
    let scale = analogueScale || 1;

    const outer = document.createElement("div");
    outer.className = "clock-row";

    /** @type HTMLOutputElement */
    const verbal = document.createElement("output");
    verbal.id = verbalId;
    verbal.className = verbalClass || "verbal";
    outer.appendChild(verbal);

    const lengths = clockLengths(scale)

    const canvas = document.createElement("canvas");
    canvas.id = analogueId;
    canvas.innerText = analogueDescription;
    canvas.width = lengths.clockWidth
    canvas.height = lengths.clockHeight

    outer.appendChild(canvas);

    appendTimepiece(outer, [verbal.id, canvas.id]);

    // Reasonable to expect this to always be non-null because:
    // * "2d" is a valid context tpye
    // * This is the first (and only) time we call getContext on this canvas
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));

    return {ctx: { ctx, scale }, verbal};
}

/** @type {(id: ElemId) => HTMLOutputElement} */
const appendVerbalClock = (id) => {
    const outer = document.createElement("div");
    outer.className = "clock-row";

    /** @type HTMLOutputElement */
    const verbal = document.createElement("output");
    verbal.id = id;
    verbal.className = "verbal";
    outer.appendChild(verbal);

    appendTimepiece(outer, [verbal.id]);

    return verbal;
}

/** @type {(args: {id: ElemId, description: string, scale?: Scale}) => AnalogueClockCtx} */
const appendAnalogueClock = ({
    id,
    description,
    scale
}) => {
    scale ||= 1;

    const outer = document.createElement("div");
    outer.className = "clock-row";

    const lengths = clockLengths(scale)

    const canvas = document.createElement("canvas");
    canvas.id = id;
    canvas.innerText = description;
    canvas.width = lengths.clockWidth
    canvas.height = lengths.clockHeight

    outer.appendChild(canvas);

    appendTimepiece(outer, [canvas.id]);

    // Reasonable to expect this to always be non-null because:
    // * "2d" is a valid context tpye
    // * This is the first (and only) time we call getContext on this canvas
    const ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext("2d"));

    return { ctx, scale };
}

const {ctx: analogueClock12Ctx, verbal: digitalClock12} = appendVerbalAnaloguePair({
    verbalId: "digital-clock-12",
    verbalClass: "digital",
    analogueId: "analogue-clock-12",
    analogueDescription: "A standard analogue clock.",
});

const {ctx: analogueClock24Ctx, verbal: digitalClock24} = appendVerbalAnaloguePair({
    verbalId: "digital-clock-24",
    verbalClass: "digital",
    analogueId: "analogue-clock-24",
    analogueDescription: "A 24-hour analogue clock.",
});

const {ctx: analogueClockBase12Ctx, verbal: digitalClockBase12} = appendVerbalAnaloguePair({
    verbalId: "digital-clock-base-12",
    verbalClass: "digital",
    analogueId: "analogue-clock-base-12",
    analogueDescription: "A standard analogue clock with X, E, and 10 instead of 10, 11 and 12 respevtively.",
});

const {ctx: analogueClock24Base12Ctx, verbal: digitalClock24Base12} = appendVerbalAnaloguePair({
    verbalId: "digital-clock-24-base-12",
    verbalClass: "digital",
    analogueId: "analogue-clock-24-base-12",
    analogueDescription: "A 24-hour analogue clock with X, E, and 10 instead of 10, 11 and 12 respevtively, and so on up to 23 being 1E, and 24 being 20.",
});

const {ctx: analogueClockBaseFactorialCtx, verbal: digitalClockBaseFactorial} = appendVerbalAnaloguePair({
    verbalId: "digital-clock-base-factorial",
    verbalClass: "digital",
    analogueId: "analogue-clock-base-factorial",
    analogueDescription: "A standard analogue clock that uses the factorial number system (sans trailing 0) to represent the numbers from 1 to 12",
});

const {ctx: analogueClock24BaseFactorialCtx, verbal: digitalClock24BaseFactorial} = appendVerbalAnaloguePair({
    verbalId: "digital-clock-24-base-factorial",
    verbalClass: "digital",
    analogueId: "analogue-clock-24-base-factorial",
    analogueDescription: "A 24-hour analogue clock that uses the factorial number system (sans trailing 0) to represent the numbers from 1 to 24",
    analogueScale: 2,
});

const {ctx: analogueClockVerbalCtx, verbal: verbalClock} = appendVerbalAnaloguePair({
    verbalId: "verbal-clock",
    analogueId: "analogue-clock-verbal",
    analogueDescription: "A standard analogue clock that uses words instead of numbers",
    analogueScale: 2,
});

const {ctx: analogueClockVerbal24Ctx, verbal: verbalClock24} = appendVerbalAnaloguePair({
    verbalId: "verbal-clock-24",
    analogueId: "analogue-clock-verbal-24",
    analogueDescription: "A 24-hour analogue clock that uses words instead of numbers",
    analogueScale: 2,
});

const verbalTime = appendVerbalClock("verbal-time");

const analogueClock12ZeroOffsetCtx = appendAnalogueClock({
    id: "analogue-clock-12-0-offset",
    description: "A standard analogue clock but rotated so that the 12 is on the far right.",
});

const {ctx: analogueClockEmojiNumbersCtx, verbal: analogueClockEmoji} = appendVerbalAnaloguePair({
    verbalId: "analogue-clock-emoji",
    analogueId: "analogue-clock-emoji-numbers",
    analogueDescription: "A standard analogue clock that uses analogue clock emoji instead of numbers",
    analogueScale: 2,
});

const {ctx: analogueClockChineseTelegraphCtx, verbal: chineseTelegraphMDH} = appendVerbalAnaloguePair({
    verbalId: "chinese-telegraph-month-day-hour",
    analogueId: "analogue-clock-chinese-telegraph",
    analogueDescription: "A standard analogue clock that uses chinese telegraph hour symbols instead of numbers",
    analogueScale: 2,
});

const {ctx: analogueClockChineseTelegraph24Ctx, verbal: chineseTelegraphMDH24} = appendVerbalAnaloguePair({
    verbalId: "chinese-telegraph-month-day-hour-24",
    analogueId: "analogue-clock-chinese-telegraph-24",
    analogueDescription: "A 24-hour analogue clock that uses chinese telegraph hour symbols instead of numbers",
    analogueScale: 2,
});

const chineseTelegraphDigitsMDH = appendLabelledRow({
    prefix: "chinese-telegraph-digits-month-day-hour",
    outputClass: "verbal",
    labelText: "(Chinese Telegraph Month Day Hour digits)",
})

/** @type {ByCalendarKind<HTMLOutputElement>} */
const verbalEnglishWeekdayElements = {
    [Time.GREGORIAN0]: appendLabelledRow({
        prefix: "verbal-english-gregorian-0-weekday",
        outputClass: "verbal",
        labelText: "(Gregorian 0 weekday)",
    }),
    [Time.INTERNATIONAL_FIXED]: appendLabelledRow({
        prefix: "verbal-english-ifc-weekday",
        outputClass: "verbal",
        labelText: "(International Fixed Calendar weekday)",
    }),
    [Time.JULIAN0]: appendLabelledRow({
        prefix: "verbal-english-julian-0-weekday",
        outputClass: "verbal",
        labelText: "(Julian 0 weekday)",
    }),
    [Time.GREGORIAN1]: appendLabelledRow({
        prefix: "verbal-english-gregorian-1-weekday",
        outputClass: "verbal",
        labelText: "(Gregorian 1 weekday)",
    }),
}

const weekNumberFirstFriday = appendLabelledRow({
    prefix: "week-number-first-friday",
    outputClass: "verbal",
    labelText: "(Starts on Saturday before first Friday)",
});

const weekNumberFirstSaturday = appendLabelledRow({
    prefix: "week-number-first-saturday",
    outputClass: "verbal",
    labelText: "(Starts on Sunday before first Saturday)",
});

const weekNumberFirstSunday = appendLabelledRow({
    prefix: "week-number-first-sunday",
    outputClass: "verbal",
    labelText: "(Starts on Monday before first Sunday)",
});

const weekNumberISO8601 = appendLabelledRow({
    prefix: "week-number-iso-8601",
    outputClass: "verbal",
    labelText: "(ISO 8601)",
});

const weekNumberIFC = appendLabelledRow({
    prefix: "week-number-ifc",
    outputClass: "verbal",
    labelText: "(International Fixed Calendar)",
});

/** @type {ByCalendarKind<HTMLOutputElement>} */
const dominicalLettersElements = {
    [Time.GREGORIAN0]: appendLabelledRow({
        prefix: "gregorian-0-dominical-letters",
        outputClass: "verbal",
        labelText: "(Gregorian 0 Dominical Letters for Year)",
    }),
    [Time.INTERNATIONAL_FIXED]: appendLabelledRow({
        prefix: "international-fixed-dominical-letters",
        outputClass: "verbal",
        labelText: "(International Fixed Dominical Letters for Year)",
    }),
    [Time.JULIAN0]: appendLabelledRow({
        prefix: "julian-0-dominical-letters",
        outputClass: "verbal",
        labelText: "(Julian 0 Dominical Letters for Year)",
    }),
    [Time.GREGORIAN1]: appendLabelledRow({
        prefix: "gregorian-1-dominical-letters",
        outputClass: "verbal",
        labelText: "(Gregorian 1 Dominical Letters for Year)",
    }),
};

const weekCardFirstFriday = appendLabelledRow({
    prefix: "week-card-first-friday",
    outputClass: "verbal",
    labelText: "(Starts on Saturday before first Friday)",
});

const weekCardFirstSaturday = appendLabelledRow({
    prefix: "week-card-first-saturday",
    outputClass: "verbal",
    labelText: "(Starts on Sunday before first Saturday)",
});

const weekCardFirstSunday = appendLabelledRow({
    prefix: "week-card-first-sunday",
    outputClass: "verbal",
    labelText: "(Starts on Monday before first Sunday)",
});

const weekCardISO8601 = appendLabelledRow({
    prefix: "week-card-iso-8601",
    outputClass: "verbal",
    labelText: "(ISO 8601)",
});

const weekCardIFC = appendLabelledRow({
    prefix: "week-card-ifc",
    outputClass: "verbal",
    labelText: "(International Fixed Calendar)",
});

/** @typedef {0|1|2} DateMode */

/** @type {DateMode} */
const PLAIN_DATE = 0;
/** @type {DateMode} */
const BASE_DAY_OF_MONTH_PLUS_ONE = 1;
/** @type {DateMode} */
const BASE_FACTORIAL = 2;
const DATE_MODE_COUNT = 3;

// CALENDAR_KIND_COUNT groups of DATE_MODE_COUNT values, starting at 0
/** @typedef {0|1|2|3|4|5|6|7|8} DateKey */

/** @typedef {{ [_key in 0|1|2|3|4|5|6|7|8]: HTMLOutputElement; }} DateElements */

/** @type {(calendar: CalendarKind, mode: DateMode) => DateKey} */
const dateKeyFrom = (calendar, mode) => {
    return /** @type {DateKey} */ ((calendar * DATE_MODE_COUNT) + mode)
}

/** @type {{ [_key in 0|1|2|3|4|5|6|7|8]?: HTMLOutputElement | undefined; }} */
let dateElementsPartial = {}

for (let mode = PLAIN_DATE; mode < DATE_MODE_COUNT; mode += 1) {
    let modeClass;
    let modeName;
    switch (mode) {
        default:
            console.error("unhandled date mode: " + mode)
            // fallthrough
        case PLAIN_DATE:
            modeClass = "date";
            modeName = "";
        break
        case BASE_DAY_OF_MONTH_PLUS_ONE:
            modeClass = "date-base-day-of-month-plus-one";
            modeName = "base day-of-month + 1";
        break
        case BASE_FACTORIAL:
            modeClass = "date-base-factorial";
            modeName = "base factorial";
        break
    }

    for (let calendar = Time.GREGORIAN0; calendar < Time.CALENDAR_KIND_COUNT; calendar += 1) {
        const key = dateKeyFrom(calendar, mode);

        let calendarClass;
        switch (calendar) {
            default:
                console.error("unhandled calendar kind: " + calendar)
                // fallthrough
            case Time.GREGORIAN0:
                calendarClass = "gregorian-0";
            break
            case Time.INTERNATIONAL_FIXED:
                calendarClass = "ifc";
            break
            case Time.JULIAN0:
                calendarClass = "julian-0";
            break
            case Time.GREGORIAN1:
                calendarClass = "gregorian-1";
            break
        }

        dateElementsPartial[key] = appendLabelledRow({
            prefix: `digital-${calendarClass}-${modeClass}`,
            outputClass: "digital",
            labelText: `(${calendarName(calendar)} date ${modeName})`,
        });
    }
}

/** @type {DateElements} */
const dateElements = /** @type {DateElements} */ (dateElementsPartial);

// Variations mainly found on food packaging {
const yyyyddd = appendLabelledRow({
    prefix: "yyyyddd",
    outputClass: "digital",
    labelHTML: `Full year ordinal date (Y...YDDD)`,
});

const yyddd = appendLabelledRow({
    prefix: "yyddd",
    outputClass: "digital",
    labelHTML: `Five digit ordinal date (YYDDD)`,
});

const yddd = appendLabelledRow({
    prefix: "yddd",
    outputClass: "digital",
    labelHTML: `Four digit ordinal date (YDDD)`,
});
// }

// Found on 1960-80's car parts
const dddy = appendLabelledRow({
    prefix: "dddy",
    outputClass: "digital",
    labelHTML: `Four digit ordinal date (DDDY)`,
});

const tenThousandDay = appendLabelledRow({
    prefix: "ten-thousand-day",
    outputClass: "digital",
    labelHTML: "Chrysler's 10,000-Day Calendar",
});

const julianDayJohnWalker = appendLabelledRow({
    prefix: "julian-day-john-walker",
    outputClass: "verbal",
    labelHTML: `(Days since Julian Epoch, <a href="https://web.archive.org/web/20240208062946/https://www.fourmilab.ch/documents/calendar/">John Walker's algorithm</a>)`,
});
const julianDayFliegelAndVanFlandern = appendLabelledRow({
    prefix: "julian-day-fliegel-and-van-flandern",
    outputClass: "verbal",
    labelHTML: `(Days since Julian Epoch, <a href="https://web.archive.org/web/20231016010207/https://dl.acm.org/doi/pdf/10.1145/364096.364097">Fliegel &amp; Van Flandern's algorithm</a>) </div>`,
});

const metrologicalSeasonsNorth = appendLabelledRow({
    prefix: "metrological-seasons-north",
    outputClass: "verbal",
    labelText: "(metrological; northern hemisphere)",
});
const metrologicalSeasonsSouth = appendLabelledRow({
    prefix: "metrological-seasons-south",
    outputClass: "verbal",
    labelText: "(metrological; southern hemisphere)",
});

const synodicMonth = appendLabelledRow({
    prefix: "synodic-month",
    outputClass: "digital-small",
    labelText: "Synodic Months relative to the Epoch",
});

const tropicalMonth = appendLabelledRow({
    prefix: "tropical-month",
    outputClass: "digital-small",
    labelText: "Tropical Months relative to the Epoch",
});

const sideralMonth = appendLabelledRow({
    prefix: "sideral-month",
    outputClass: "digital-small",
    labelText: "Sideral Months relative to the Epoch",
});

const anomalisticMonth = appendLabelledRow({
    prefix: "anomalistic-month",
    outputClass: "digital-small",
    labelText: "Anomalistic Months relative to the Epoch",
});

const dragonicMonth = appendLabelledRow({
    prefix: "dragonic-month",
    outputClass: "digital-small",
    labelText: "Dragonic Months relative to the Epoch",
});

/** @type {ByCalendarKind<CalendarElements>} */
const calendarElements = {
    [Time.GREGORIAN0]: appendCalendarElements("gregorian-0-calendar", "Gregorian 0"),
    [Time.INTERNATIONAL_FIXED]: appendCalendarElements("international-fixed-calendar", "International Fixed"),
    [Time.JULIAN0]: appendCalendarElements("julian-0-calendar", "Julian 0"),
    [Time.GREGORIAN1]: appendCalendarElements("gregorian-1-calendar", "Gregorian 1"),
}

//
// All timepiece's should be appened before this section of the code
//

setupCatergoryControls({
    addID: "add-digital",
    onlyID: "digital-only",
    removeID: "remove-digital",
    subset: subsetThatContains("digital"),
});

setupCatergoryControls({
    addID: "add-analogue",
    onlyID: "analogue-only",
    removeID: "remove-analogue",
    subset: subsetThatContains("analogue"),
});

setupCatergoryControls({
    addID: "add-calendars",
    onlyID: "calendars-only",
    removeID: "remove-calendars",
    subset: subsetThatContains("calendar"),
});

setupCatergoryControls({
    addID: "add-week-numbers",
    onlyID: "week-numbers-only",
    removeID: "remove-week-numbers",
    subset: subsetThatContains("week-number"),
});

setupCatergoryControls({
    addID: "add-week-cards",
    onlyID: "week-cards-only",
    removeID: "remove-week-cards",
    subset: subsetThatContains("week-card"),
});

setupCatergoryControls({
    addID: "add-ordinal-dates",
    onlyID: "ordinal-dates-only",
    removeID: "remove-ordinal-dates",
    subset: subsetThatContains("ddd"),
});

setupCatergoryControls({
    addID: "add-dominical-letters",
    onlyID: "dominical-letters-only",
    removeID: "remove-dominical-letters",
    subset: subsetThatContains("dominical-letter"),
});

// Month durations as written in
// https://archive.org/details/astronomicalalmanac1961/page/n117/mode/1up
const SYNODIC_MONTH_IN_MILLIS =
    29 * Time.DAY_IN_MILLIS
    + 12 * Time.HOUR_IN_MILLIS
    + 44 * Time.MINUTE_IN_MILLIS
    + 2 * Time.SECOND_IN_MILLIS
    + 900

const TROPICAL_MONTH_IN_MILLIS =
    27 * Time.DAY_IN_MILLIS
    + 7 * Time.HOUR_IN_MILLIS
    + 43 * Time.MINUTE_IN_MILLIS
    + 4 * Time.SECOND_IN_MILLIS
    + 700

const SIDERAL_MONTH_IN_MILLIS =
    27 * Time.DAY_IN_MILLIS
    + 7 * Time.HOUR_IN_MILLIS
    + 43 * Time.MINUTE_IN_MILLIS
    + 11 * Time.SECOND_IN_MILLIS
    + 500

const ANOMALISTIC_MONTH_IN_MILLIS =
    27 * Time.DAY_IN_MILLIS
    + 13 * Time.HOUR_IN_MILLIS
    + 18 * Time.MINUTE_IN_MILLIS
    + 33 * Time.SECOND_IN_MILLIS
    + 200

const DRAGONIC_MONTH_IN_MILLIS =
    27 * Time.DAY_IN_MILLIS
    +  5 * Time.HOUR_IN_MILLIS
    +  5 * Time.MINUTE_IN_MILLIS
    + 35 * Time.SECOND_IN_MILLIS
    + 800

/** @type {(n: number) => string}} */
const toAtMost10Chars = (n) => {
    if (n > 999_999_999) {
        return ">999999999"
    }
    if (n < -99_999_999) {
        return "<-999999999"
    }

    // Eight to allow for the minus sign and decimal point
    const eightSigFigs = n.toPrecision(8)

    if (eightSigFigs.includes("e")) {
        if (eightSigFigs.endsWith("e-7")) {
            if (n > 0) {
                return "0.000000" + eightSigFigs.substring(0, 1)
            } else {
                return "-0.000000" + eightSigFigs.substring(0, 1)
            }
        }
        if (n > 0) {
            return "0.0000001"
        } else {
            return "-0.0000001"
        }
    }

    if (eightSigFigs.length > 10) {
        return eightSigFigs.substring(0,9)
    }

    return eightSigFigs
}

/** @type {(time: EpochTime) => void} */
const setFromTimeAndRender = (time) => {
    inputMode = PAUSED
    setFromTime(time)
    renderAt(new Date(time))
}

/** @type {(radians: Radians, scale?: Scale, radiusScale?: Scale, xOffset?: W) => XY} */
const clockNumberCenterXYForRadians = (radians, scale, radiusScale, xOffset) => {
    scale ||= 1
    radiusScale ||= 1
    xOffset ||= 1
    const lengths = clockLengths(scale)
    return [
        (lengths.clockX + Math.cos(radians) * lengths.clockNumberRadius * radiusScale) + (xOffset * scale),
        lengths.clockY + Math.sin(radians) * lengths.clockNumberRadius * radiusScale,
    ]
};

/** @type {(x: number) => string} */
function lastBase12Digit(x){
    x = Math.floor(x)
    x %= 12
    switch (x) {
        case 10:
            return 'X'
        case 11:
            return 'E'
        default:
            return String(x)
    }
}

/** @type {(index: Index, divisor: Integer) => string} */
const clockTextForIndex = (index, divisor) => "" + (index === 0 ? divisor : index);

/** @type {(index: Index, divisor: Integer) => string} */
const base12TextForIndex = (index, divisor) => {
    let n = index === 0 ? divisor : index

    let output = ""
    // Takes advantage of n being known to not be 0
    while (n > 0) {
        output = lastBase12Digit(n) + output

        n /= 12
        n = Math.floor(n)
    }

    return output
}

/** @type {(index: Index, divisor: Integer) => string} */
const factorialTextForIndex = (index, divisor) => {
    const n = index === 0 ? divisor : index

    return FactorialBase.stringOf(n)
}

/** @type {(index: Index, divisor: Integer) => string} */
const wordForIndex = (index, divisor) => {
    const n = index === 0 ? divisor : index

    return intToWords(n)
}

/** @type {(args: {index: Index, divisor: Integer, offset?: number, scale?: Scale, radiusScale?: Scale, xOffset?: W}) => XY} */
const clockNumberCenterXYForIndex = ({index, divisor, offset, scale, radiusScale, xOffset}) => {
    // Note that the negatives here do happen to work out
    offset = offset === undefined ? -3 : offset
    return clockNumberCenterXYForRadians(
        ((index + offset) % divisor) * (TAU / divisor),
        scale,
        radiusScale,
        xOffset
    )
}

/** @type {(millis: Millis) => string} */
const humanReadableSIDurationFromMillis = (millis) => {
    if (millis < Time.SECOND_IN_MILLIS) {
        return "less than a second"
    }

    const totalSeconds = Math.floor(millis / Time.SECOND_IN_MILLIS)
    const remainingSeconds = totalSeconds % 60

    const totalMinutes = Math.floor(millis / Time.MINUTE_IN_MILLIS)
    const remainingMinutes = totalMinutes % 60

    const totalHours = Math.floor(millis / Time.HOUR_IN_MILLIS)
    const remainingHours = totalHours % 24

    const totalDays = Math.floor(millis / Time.DAY_IN_MILLIS)
    const remainingDays = totalDays % 365.25

    const totalYears = Math.floor(millis / Time.SI_YEAR_IN_MILLIS)
    const remainingYears = totalYears % 1000

    const totalMillenia = Math.floor(millis / Time.SI_MILLIENUM_IN_MILLIS)
    const remainingMillenia = totalMillenia % 1000

    const totalMegaannus = Math.floor(millis / Time.SI_MEGAANNUM_IN_MILLIS)
    const remainingMegaannus = totalMegaannus % 1000

    const totalGigaannus = Math.floor(millis / Time.SI_GIGAANNUM_IN_MILLIS)
    const remainingGigaannus = totalGigaannus % 1000

    const totalTeraannus = Math.floor(millis / Time.SI_TERAANNUM_IN_MILLIS)
    const remainingTeraannus = totalTeraannus % 1000

    const totalPetaannus = Math.floor(millis / Time.SI_PETAANNUM_IN_MILLIS)
    const remainingPetaannus = totalPetaannus % 1000

    const totalExaannus = Math.floor(millis / Time.SI_EXAANNUM_IN_MILLIS)
    const remainingExaannus = totalExaannus % 1000

    const totalZetaannus = Math.floor(millis / Time.SI_ZETAANNUM_IN_MILLIS)
    const remainingZetaannus = totalZetaannus % 1000

    const totalYottaannus = Math.floor(millis / Time.SI_YOTTAANNUM_IN_MILLIS)

    // Some of these units exceed the integer precision of double precision floating point

    return [
        (totalYottaannus > 0 ? (totalYottaannus === 1 ? "1 yottaannum" : totalYottaannus + " yottaannus") : ""),
        (remainingZetaannus > 0 ? (remainingZetaannus === 1 ? "1 zetaannum" : remainingZetaannus + " zetaannus") : ""),
        (remainingExaannus > 0 ? (remainingExaannus === 1 ? "1 exaannum" : remainingExaannus + " exaannus") : ""),
        (remainingPetaannus > 0 ? (remainingPetaannus === 1 ? "1 teraannum" : remainingPetaannus + " teraannus") : ""),
        (remainingTeraannus > 0 ? (remainingTeraannus === 1 ? "1 teraannum" : remainingTeraannus + " teraannus") : ""),
        (remainingGigaannus > 0 ? (remainingGigaannus === 1 ? "1 gigaannum" : remainingGigaannus + " gigaannus") : ""),
        (remainingMegaannus > 0 ? (remainingMegaannus === 1 ? "1 megaannum" : remainingMegaannus + " megaannus") : ""),
        (remainingMillenia > 0 ? (remainingMillenia === 1 ? "1 millienium" : remainingMillenia + " millienia") : ""),
        (remainingYears > 0 ? (remainingYears === 1 ? "1 year" : remainingYears + " years") : ""),
        (remainingDays > 0 ? (remainingDays === 1 ? "1 day" : remainingDays + " days") : ""),
        (remainingHours > 0 ? (remainingHours === 1 ? "1 hour" : remainingHours + " hours") : ""),
        (remainingMinutes > 0 ? (remainingMinutes === 1 ? "1 minute" : remainingMinutes + " minutes") : ""),
        (remainingSeconds === 1) ? "1 second" : remainingSeconds + " seconds",
    ].filter(x => x) // empty string is falsey
    .join(", ")
}

/** @type {(n: Integer) => Integer[]} */
const range = (n) => {
    let output = new Array(n)

    for (let i = 0; i < n; i += 1) {
        output[i] = i
    }

    return output
}

const range12 = range(12)
const range24 = range(24)

// TODO? Memoize these?
/** @type {(index: Index, scale: Scale) => XY} */
const twelveHourClockNumberXYForIndex = (index, scale) => {
    return clockNumberCenterXYForIndex({index, divisor: 12, scale})
}

/** @type {(index: Index, scale: Scale) => XY} */
const twelveHourZeroOffsetClockNumberXYForIndex = (index, scale) => {
    return clockNumberCenterXYForIndex({index, divisor: 12, offset: 0, scale})
}

/** @type {(index: Index, scale: Scale) => XY} */
const twentyFourHourClockNumberXYForIndex = (index, scale) => {
    return clockNumberCenterXYForIndex({index, divisor: 24, offset: -6, scale})
}

/** @type {(index: Index, scale: Scale) => XY} */
const twentyFourHourClockVerbalXYForIndex = (index, scale) => {
    let radiusScale
    switch (index) {
        case 0:
        case 12:
            radiusScale = 1
        break
        case 1:
        case 11:
        case 13:
        case 23:
            radiusScale = 0.9
        break
        case 3:
            radiusScale = 0.825
        break
        case 14:
        case 22:
            radiusScale = 0.8
        break
        case 15:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 21:
            radiusScale = 0.75
        break
        default:
            radiusScale = 0.85
        break
    }
    let xOffset;
    switch (index) {
        case 1:
            xOffset = 12
        break
        default:
            xOffset = 0
        break
    }
    return clockNumberCenterXYForIndex({index, divisor: 24, offset: -6, scale, radiusScale, xOffset})
}

/** @type {(scale: Scale) => XY[]} */
const twelveHourClockNumberXYs = (scale) => range12.map(n => twelveHourClockNumberXYForIndex(n, scale))
/** @type {(scale: Scale) => XY[]} */
const twelveHourZeroOffsetClockNumberXYs = (scale) => range12.map(n => twelveHourZeroOffsetClockNumberXYForIndex(n, scale))

/** @type {(scale: Scale) => XY[]} */
const twentyFourHourClockNumberXYs = (scale) => range24.map(n => twentyFourHourClockNumberXYForIndex(n, scale))
/** @type {(scale: Scale) => XY[]} */
const twentyFourHourClockVerbalNumberXYs = (scale) => range24.map(n => twentyFourHourClockVerbalXYForIndex(n, scale))

/** @type {(year: G0Year) => DayOfWeek} */
const getDayOfWeekOfLastDayOfYear = (year) => /** @type {DayOfWeek} */ ((year + Math.floor(year/4) - Math.floor(year/100) + Math.floor(year/400)) % 7);

/** @type {(year: G0Year) => number} */
const getISO8601WeekCount = (year) => {
    const hasExtra = getDayOfWeekOfLastDayOfYear(year) === 4 || getDayOfWeekOfLastDayOfYear(year - 1) === 3
    return 52 + (hasExtra ? 1 : 0)
}

/** @type {(weekNumber: DayOfWeek) => DayOfWeek} */
const sundayStartWeekNumberToMondayStart = (weekNumber) => {
    // + 6 is - 1 mod 7, and this keeps us on the positive side of 0
    return /** @type {DayOfWeek} */ ((weekNumber + 6) % 7);
}

/** @typedef {Integer} Iso8601WeekNumber */

/** @type {(date: Date) => {iso8601WeekNumber: Iso8601WeekNumber, yearOfISO8601Week: G0Year}} */
const getISO8601WeekNumber = (date) => {
    const year = date.getUTCFullYear()
    const sundayWeekdayNumber = Time.weekFromDate(date);
    const weekdayNumber = sundayStartWeekNumberToMondayStart(sundayWeekdayNumber)

    const provisionalWeekNumber = Math.floor((10 + Time.get0IndexedDayOfYear(date) - weekdayNumber) / 7)

    if (provisionalWeekNumber < 1) {
        return {iso8601WeekNumber: getISO8601WeekCount(year - 1), yearOfISO8601Week: year - 1}
    } else if (provisionalWeekNumber > getISO8601WeekCount(year)) {
        return {iso8601WeekNumber: 1, yearOfISO8601Week: year + 1}
    } else {
        return {iso8601WeekNumber: provisionalWeekNumber, yearOfISO8601Week: year}
    }
}

const TEN_THOUSAND_DAY_BASE_TIME = Date.UTC(1961, 7 - 1, 28);

/** @type {(date: Date) => void} */
const renderAt = (date) => {
    const time = date.getTime()
    setFromTime(time)
    raw.textContent = time.toLocaleString()
    utcString.textContent = date.toUTCString()

    for (let kind = Time.GREGORIAN0; kind < Time.CALENDAR_KIND_COUNT; kind += 1) {
        const specs = Time.calculateCalendarSpecs(kind, date);

        const elements = calendarElements[kind];
        // A guard against one being missing due to achange bein in
        // progress
        if (!elements) { continue }
        applyCalendarSpecs(elements, specs)
    }

    const hours = /** @type ZeroIndexedHour */ (date.getUTCHours()); // 0 - 23
    const hours12 = /** @type ZeroIndexedHour */ (hours % 12); // 0 - 11
    const minutes = date.getUTCMinutes(); // 0 - 59
    const seconds = date.getUTCSeconds(); // 0 - 59

    let h = padToTwoDigits(hours);
    let h12 = padToTwoDigits(hours12 === 0 ? 12 : hours12);
    let m = padToTwoDigits(minutes);
    let s = padToTwoDigits(seconds);

    digitalClock12.innerHTML = (hours >= 12 ? "˙" : "&nbsp;") + h12 + ":" + m + ":" + s
    digitalClock24.innerHTML = "&nbsp;" + h + ":" + m + ":" + s
    digitalClockBase12.innerHTML = (hours >= 12 ? "˙" : "&nbsp;") + padToTwoDigitsBase12(hours12 === 0 ? 12 : hours12) + ":" + padToTwoDigitsBase12(minutes) + ":" + padToTwoDigitsBase12(seconds)
    digitalClock24Base12.innerHTML = "&nbsp;" + padToTwoDigitsBase12(hours) + ":" + padToTwoDigitsBase12(minutes) + ":" + padToTwoDigitsBase12(seconds)
    digitalClockBaseFactorial.innerHTML = (hours >= 12 ? "˙" : "&nbsp;") + padToNDigitsBaseFactorial(3, hours12) + ":" + padToNDigitsBaseFactorial(4, minutes) + ":" + padToNDigitsBaseFactorial(4, seconds)
    digitalClock24BaseFactorial.innerHTML = "&nbsp;" + padToNDigitsBaseFactorial(3, hours) + ":" + padToNDigitsBaseFactorial(4, minutes) + ":" + padToNDigitsBaseFactorial(4, seconds)

    analogueClockEmoji.textContent = analogueClockEmojiForHoursAndMinutes(hours12, minutes)

    const zeroIndexedMonth = zeroIndexedMonthFromDate(date);
    const dayOfMonth = dayOfMonthFromDate(date);

    chineseTelegraphMDH.innerHTML = chineseTelegraphSymbolForZeroIndexedMonth(zeroIndexedMonth)
        + chineseTelegraphSymbolForDayOfMonth(dayOfMonth)
        + (hours >= 12 ? "˙" : "&nbsp;") + chineseTelegraphSymbolForHour(hours12)

    chineseTelegraphMDH24.innerHTML = chineseTelegraphSymbolForZeroIndexedMonth(zeroIndexedMonth)
        + chineseTelegraphSymbolForDayOfMonth(dayOfMonth)
        + "&nbsp;" + chineseTelegraphSymbolForHour(hours)

    chineseTelegraphDigitsMDH.textContent = chineseTelegraphDigitsForZeroIndexedMonth(zeroIndexedMonth)
        + " "
        + chineseTelegraphDigitsForDayOfMonth(dayOfMonth)
        + " "
        + chineseTelegraphDigitsForHour(hours)

    const nextHours12 = (hours12 + 1) % 12
    const nextHours24 = (hours + 1) % 24

    const signedFiveMinutesRounded = Math.round((((time % Time.HOUR_IN_MILLIS)/Time.HOUR_IN_MILLIS) * (60 / 5))) * 5

    let fiveMinutesRounded;
    if (signedFiveMinutesRounded > 0) {
        fiveMinutesRounded = signedFiveMinutesRounded
    } else {
        fiveMinutesRounded = 60 + signedFiveMinutesRounded
    }
    // For -0
    fiveMinutesRounded = Math.abs(fiveMinutesRounded)

    /** @type {(currentHours: Hours, nextHours: Hours, divisor: Integer) => string} */
    const getTimePhrase = (currentHours, nextHours, divisor) => {
        let timePhrase
        switch (fiveMinutesRounded) {
            default:
                console.error("Got unexpected value for fiveMinutesRounded: "+ fiveMinutesRounded)
                timePhrase = "Uh... half past a freckle"
            break
            case 0:
                timePhrase = hoursToWord(currentHours, divisor) + (divisor === 24 ? " hundred" : " o'clock")
            break
            case 5:
                timePhrase = "Five past " + hoursToWord(currentHours, divisor)
            break
            case 10:
                timePhrase = "Ten past " + hoursToWord(currentHours, divisor)
            break
            case 15:
                timePhrase = "Quarter past " + hoursToWord(currentHours, divisor)
            break
            case 20:
                timePhrase = "Twenty past " + hoursToWord(currentHours, divisor)
            break
            case 25:
                timePhrase = "Twenty-Five past " + hoursToWord(currentHours, divisor)
            break
            case 30:
                timePhrase = "Half past " + hoursToWord(currentHours, divisor)
            break
            case 35:
                timePhrase = "Twenty-Five to " + hoursToWord(nextHours, divisor)
            break
            case 40:
                timePhrase = "Twenty to " + hoursToWord(nextHours, divisor)
            break
            case 45:
                timePhrase = "Quarter to " + hoursToWord(nextHours, divisor)
            break
            case 50:
                timePhrase = "Ten to " + hoursToWord(nextHours, divisor)
            break
            case 55:
                timePhrase = "Five to " + hoursToWord(nextHours, divisor)
            break
            case 60:
                timePhrase = hoursToWord(nextHours, divisor) + " o'clock"
            break
        }

        return timePhrase
    }

    verbalClock.textContent = getTimePhrase(hours12, nextHours12, 12)
    verbalClock24.textContent = getTimePhrase(hours, nextHours24, 24)
    verbalTime.textContent = intToWords(time)
    // This keeps the height at its maximum value so far
    verbalTime.style.minHeight = verbalTime.scrollHeight + "px"

    renderClock({time, ctx: analogueClock12Ctx})
    renderClock({time, ctx: analogueClock24Ctx, numberXYs: twentyFourHourClockNumberXYs, divisor: 24})
    renderClock({time, ctx: analogueClockBase12Ctx, textForIndex: base12TextForIndex})
    renderClock({time, ctx: analogueClock24Base12Ctx, textForIndex: base12TextForIndex, numberXYs: twentyFourHourClockNumberXYs, divisor: 24})
    renderClock({time, ctx: analogueClockBaseFactorialCtx, textForIndex: factorialTextForIndex})
    renderClock({
        time,
        ctx: analogueClock24BaseFactorialCtx,
        textForIndex: factorialTextForIndex,
        numberXYs: twentyFourHourClockNumberXYs,
        divisor: 24,
        rotationForIndex: /** @type {RotationForIndex} */ ((i) =>
            i === 23 || i === 0 || i === 1 || i === 11 || i === 12 || i === 13 ? TAU/4 : 0
        ),
    })
    renderClock({
        time,
        ctx: analogueClockVerbalCtx,
        textForIndex: wordForIndex,
        rotationForIndex: /** @type {RotationForIndex} */ (i) => {
            switch (i) {
                case 3:
                    return TAU/4;
                case 8:
                    return TAU/8;
                case 11:
                    return -TAU/8;
                default:
                    return 0;
            }
        },
    })
    renderClock({
        time,
        ctx: analogueClockVerbal24Ctx,
        textForIndex: wordForIndex,
        numberXYs: twentyFourHourClockVerbalNumberXYs,
        rotationForIndex: /** @type {RotationForIndex} */ (i) => {
            switch (i) {
                case 11:
                    return TAU/8;
                default:
                    return 0;
            }
        },
        divisor: 24
    })
    renderClock({time, ctx: analogueClock12ZeroOffsetCtx, numberXYs: twelveHourZeroOffsetClockNumberXYs, topOfClockShift: 0})
    /** @type {TextForIndex} */
    const emojiTextForIndex = i => analogueClockEmojiForHoursAndMinutes(i == 0 ? 12 : i, 0);
    renderClock({time, ctx: analogueClockEmojiNumbersCtx, textForIndex: emojiTextForIndex })
    renderClock({time, ctx: analogueClockChineseTelegraphCtx, textForIndex: /** @type {TextForIndex} */ (i => chineseTelegraphSymbolForHour(i === 0 ? 12 : Time.modToZeroIndexedHour(i)))})
    renderClock({time, ctx: analogueClockChineseTelegraph24Ctx, textForIndex: /** @type {TextForIndex} */ (i => chineseTelegraphSymbolForHour(i === 0 ? 24 : Time.modToZeroIndexedHour(i))), numberXYs: twentyFourHourClockNumberXYs, divisor: 24})

    const julian0YMD = Time.julian0YMD(date)
    const ifcMAndD = Time.ifcZeroIndexedMonthAndDay(date);

    const year = date.getUTCFullYear()
    const isLeap = Time.isGregorian0LeapYear(year)

    const startOfYear = Time.getStartOfYear(date)

    const gregorian0WeekdayNumberOfFirstDay = Time.weekFromDate(startOfYear);

    const DOMINICAL_LETTER_BY_WEEKDAY_NUMBER = ['A', 'G', 'F', 'E', 'D', 'C', 'B']

    for (let calendar = Time.GREGORIAN0; calendar < Time.CALENDAR_KIND_COUNT; calendar += 1) {
        verbalEnglishWeekdayElements[calendar].textContent = Time.weekdayWordFromDateForCalendar(date, calendar);

        const dominicalLettersElement = dominicalLettersElements[calendar]

        switch (calendar) {
            case Time.GREGORIAN0:
                let g0DominicalLetters = DOMINICAL_LETTER_BY_WEEKDAY_NUMBER[gregorian0WeekdayNumberOfFirstDay]
                if (isLeap) {
                    const octoberFirst = Time.getGregorianOctoberFirst(date)
                    const octoberFirstWeekdayNumber = Time.weekFromDate(octoberFirst)
                    g0DominicalLetters += DOMINICAL_LETTER_BY_WEEKDAY_NUMBER[octoberFirstWeekdayNumber]
                }
                dominicalLettersElement.textContent = g0DominicalLetters;
            break
            case Time.JULIAN0:
                dominicalLettersElement.textContent = Time.julian0DominicalLetters(julian0YMD);
            break
            case Time.INTERNATIONAL_FIXED:
                // This is an extension of the concept of dominical letters to the IFC invented for this program
                // The reasoning goes something like if the kind of person that would invent the IFC heard about
                // there being letters for representing which kinds of years there are, and that they count up
                // from A, and then they just do the clearly sensible thing, somewhat smugly.
                dominicalLettersElement.textContent = isLeap ? "B" : "A";
            break
            case Time.GREGORIAN1:
                // This is makes a bit of an odd assumption, namely that we don't need to adjust anything for gregorian 1
                // calculations besides the year number, implying that the year -3 is a leap year. We have a TODO
                // elsewhere about fixing that
                const gregorian1WeekdayNumberOfFirstDay = gregorian0WeekdayNumberOfFirstDay;

                let g1DominicalLetters = DOMINICAL_LETTER_BY_WEEKDAY_NUMBER[gregorian1WeekdayNumberOfFirstDay]
                if (isLeap) {
                    const octoberFirst = Time.getGregorianOctoberFirst(date)
                    const octoberFirstWeekdayNumber = Time.weekFromDate(octoberFirst)
                    g1DominicalLetters += DOMINICAL_LETTER_BY_WEEKDAY_NUMBER[octoberFirstWeekdayNumber]
                }
                dominicalLettersElement.textContent = g1DominicalLetters;
            break
        }
    }

    ; // defensive semicolon because it happened more than once
    // here and took longer that I'd have liked to debug it.

    // TODO pull these week number calculations into a single,
    // pure, Time function, so we can then paramterize it on
    // calendar type, once we have enough calendars where that
    // would be interesting

    // IIFE for a fresh scope
    (() => {
        const firstDayOfFirstWeekTime = startOfYear.getTime() - (Time.DAY_IN_MILLIS * gregorian0WeekdayNumberOfFirstDay);

        let weekNumberCounter = 0;
        let weekNumberTime = firstDayOfFirstWeekTime;
        while (weekNumberTime <= time) {
            weekNumberCounter += 1;
            weekNumberTime += Time.WEEK_IN_MILLIS;
        }

        let yearOfWeek = year;
        if (weekNumberCounter > 52) {
            weekNumberCounter = 1;
            yearOfWeek += 1;
        }

        weekNumberFirstSaturday.textContent = "Week " + weekNumberCounter + " of " + yearOfWeek;
        weekCardFirstSaturday.textContent = unicodePlayingCardForNumber(weekNumberCounter) + " of " + yearOfWeek
    })();

    // IIFE for a fresh scope
    (() => {
        const saturdayStartWeekdayNumberOfFirstDay = (gregorian0WeekdayNumberOfFirstDay + 1) % 7;

        const firstDayOfFirstWeekTime = startOfYear.getTime() - (Time.DAY_IN_MILLIS * saturdayStartWeekdayNumberOfFirstDay);

        let weekNumberCounter = 0;
        let weekNumberTime = firstDayOfFirstWeekTime;
        while (weekNumberTime <= time) {
            weekNumberCounter += 1;
            weekNumberTime += Time.WEEK_IN_MILLIS;
        }

        let yearOfWeek = year;
        if (weekNumberCounter > 52) {
            weekNumberCounter = 1;
            yearOfWeek += 1;
        }

        weekNumberFirstFriday.textContent = "Week " + weekNumberCounter + " of " + yearOfWeek;
        weekCardFirstFriday.textContent = unicodePlayingCardForNumber(weekNumberCounter) + " of " + yearOfWeek
    })();

    // IIFE for a fresh scope
    (() => {
        const mondayStartWeekdayNumberOfFirstDay = sundayStartWeekNumberToMondayStart(gregorian0WeekdayNumberOfFirstDay);

        const firstDayOfFirstWeekTime = startOfYear.getTime() - (Time.DAY_IN_MILLIS * mondayStartWeekdayNumberOfFirstDay);

        let weekNumberCounter = 0;
        let weekNumberTime = firstDayOfFirstWeekTime;
        while (weekNumberTime <= time) {
            weekNumberCounter += 1;
            weekNumberTime += Time.WEEK_IN_MILLIS;
        }

        let yearOfWeek = year;
        if (weekNumberCounter > 52) {
            weekNumberCounter = 1;
            yearOfWeek += 1;
        }

        weekNumberFirstSunday.textContent = "Week " + weekNumberCounter + " of " + yearOfWeek;
        weekCardFirstSunday.textContent = unicodePlayingCardForNumber(weekNumberCounter) + " of " + yearOfWeek
    })();

    const {iso8601WeekNumber, yearOfISO8601Week} = getISO8601WeekNumber(date);

    weekNumberISO8601.textContent = "Week " + iso8601WeekNumber + " of " + yearOfISO8601Week;
    weekCardISO8601.textContent = unicodePlayingCardForNumber(iso8601WeekNumber) + " of " + yearOfISO8601Week

    const YEAR_DAY_CARD_NUMBER = 53
    const LEAP_DAY_CARD_NUMBER = 54
    let weekCardNumberIFC
    switch (ifcMAndD.zeroIndexedMonthNumber) {
        case Time.IFC_ZERO_INDEXED_LEAP_MONTH:
            if (ifcMAndD.dayOfMonth > Time.IFC_NORMAL_DAYS_PER_MONTH) {
                weekCardNumberIFC = LEAP_DAY_CARD_NUMBER
                break
            }
            // fallthrough
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
        case 11:
        case 12:
            weekCardNumberIFC = ifcMAndD.zeroIndexedMonthNumber * 4 + Math.floor((ifcMAndD.dayOfMonth - 1) / 7) + 1;
        break
        default:
        case Time.IFC_ZERO_INDEXED_YEAR_DAY_MONTH:
            weekCardNumberIFC = YEAR_DAY_CARD_NUMBER
        break

    }

    weekNumberIFC.textContent =
        (weekCardNumberIFC == YEAR_DAY_CARD_NUMBER)
            ? "Year day"
            : (weekCardNumberIFC == LEAP_DAY_CARD_NUMBER)
                ? "Leap day"
                : "Week " + weekCardNumberIFC + " of " + year;
    weekCardIFC.textContent = unicodePlayingCardForNumber(weekCardNumberIFC) + " of " + year

    /** @type {Month} */
    const oneIndexedMonth = /** @type {Month} */ (zeroIndexedMonth + 1);

    const ifcOneIndexedMonth = ifcMAndD.zeroIndexedMonthNumber + 1

    for (let mode = PLAIN_DATE; mode < DATE_MODE_COUNT; mode += 1) {
        for (let calendar = Time.GREGORIAN0; calendar < Time.CALENDAR_KIND_COUNT; calendar += 1) {
            const key = dateKeyFrom(calendar, mode);

            const element = dateElements[key];

            switch (mode) {
                default:
                    console.error("unhandled date mode: " + mode)
                    // fallthrough
                case PLAIN_DATE:
                    switch (calendar) {
                        default:
                            console.error("unhandled calendar kind: " + calendar)
                            // fallthrough
                        case Time.GREGORIAN0:
                            element.textContent = `${year}-${padToTwoDigits(oneIndexedMonth)}-${padToTwoDigits(dayOfMonth)}`
                        break
                        case Time.INTERNATIONAL_FIXED:
                            element.textContent = `${year}-${padToTwoDigits(ifcOneIndexedMonth)}-${padToTwoDigits(ifcMAndD.dayOfMonth)}`
                        break
                        case Time.JULIAN0:
                            element.textContent = `${julian0YMD.j0Year}-${padToTwoDigits(julian0YMD.j0Month)}-${padToTwoDigits(julian0YMD.j0DayOfMonth)}`
                        break
                        case Time.GREGORIAN1:
                            element.textContent = `${Time.gregorian1YearFromGregorian0Year(year)}-${padToTwoDigits(oneIndexedMonth)}-${padToTwoDigits(dayOfMonth)}`
                        break
                    }
                break
                case BASE_DAY_OF_MONTH_PLUS_ONE:
                    const base = dayOfMonth + 1

                    const ifcBase = ifcMAndD.dayOfMonth + 1

                    switch (calendar) {
                        default:
                            console.error("unhandled calendar kind: " + calendar)
                            // fallthrough
                        case Time.GREGORIAN0:
                            element.textContent = `${year.toString(base)}-${padStringToTwoDigits(oneIndexedMonth.toString(base))}-${padStringToTwoDigits(dayOfMonth.toString(base))}`
                        break
                        case Time.INTERNATIONAL_FIXED:
                            element.textContent = `${year.toString(ifcBase)}-${padStringToTwoDigits((ifcOneIndexedMonth).toString(ifcBase))}-${padStringToTwoDigits(ifcMAndD.dayOfMonth.toString(ifcBase))}`
                        break
                        case Time.JULIAN0:
                            element.textContent = `${julian0YMD.j0Year.toString(base)}-${padStringToTwoDigits(julian0YMD.j0Month.toString(base))}-${padStringToTwoDigits(julian0YMD.j0DayOfMonth.toString(base))}`
                        break
                        case Time.GREGORIAN1:
                            element.textContent = `${Time.gregorian1YearFromGregorian0Year(year).toString(base)}-${padStringToTwoDigits(oneIndexedMonth.toString(base))}-${padStringToTwoDigits(dayOfMonth.toString(base))}`
                        break
                    }
                break
                case BASE_FACTORIAL:
                    switch (calendar) {
                        default:
                            console.error("unhandled calendar kind: " + calendar)
                            // fallthrough
                        case Time.GREGORIAN0:
                            element.textContent = `${FactorialBase.stringOf(year)}-${padToNDigitsBaseFactorial(3, oneIndexedMonth)}-${padToNDigitsBaseFactorial(5, dayOfMonth)}`
                        break
                        case Time.INTERNATIONAL_FIXED:
                            element.textContent = `${FactorialBase.stringOf(year)}-${padToNDigitsBaseFactorial(3, ifcOneIndexedMonth)}-${padToNDigitsBaseFactorial(5, ifcMAndD.dayOfMonth)}`
                        break
                        case Time.JULIAN0:
                            element.textContent = `${FactorialBase.stringOf(julian0YMD.j0Year)}-${padToNDigitsBaseFactorial(3, julian0YMD.j0Month)}-${padToNDigitsBaseFactorial(5, julian0YMD.j0DayOfMonth)}`
                        break
                        case Time.GREGORIAN1:
                            element.textContent = `${FactorialBase.stringOf(Time.gregorian1YearFromGregorian0Year(year))}-${padToNDigitsBaseFactorial(3, oneIndexedMonth)}-${padToNDigitsBaseFactorial(5, dayOfMonth)}`
                        break
                    }
                break
            }
        }
    }

    const g0YMD = Time.G0.ymd(year, oneIndexedMonth, dayOfMonth)

    const dayOfYear = (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - Date.UTC(date.getUTCFullYear(), 0, 0)) / 24 / 60 / 60 / 1000;
    // TODO? timepice for this on its own? That is, without padding.

    const dayOfYear3Digits = padToNDigits(3, dayOfYear);

    yyyyddd.textContent = g0YMD.g0Year + dayOfYear3Digits;
    yyddd.textContent = (padToNDigits(2, g0YMD.g0Year).slice(-2)) + dayOfYear3Digits;

    const lastDigitOfYear = (g0YMD.g0Year + "").slice(-1);
    yddd.textContent = lastDigitOfYear + dayOfYear3Digits;
    dddy.textContent = dayOfYear3Digits + lastDigitOfYear;

    tenThousandDay.textContent = Math.floor((time - TEN_THOUSAND_DAY_BASE_TIME) / Time.DAY_IN_MILLIS)

    julianDayJohnWalker.textContent = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(g0YMD, Time.JOHN_WALKER) + ""
    julianDayFliegelAndVanFlandern.textContent = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(g0YMD, Time.FLIEGEL_AND_VAN_FLANDERN) + ""

    let northernMetrologicalSeason
    let southernMetrologicalSeason
    switch(zeroIndexedMonth) {
        default:
            console.error("unexpected month for metrological seasons: " + zeroIndexedMonth)
        case 0: // Jan
        case 1: // Feb
        case 11: // December
            northernMetrologicalSeason = "Winter"
            southernMetrologicalSeason = "Summer"
        break
        case 2:
        case 3:
        case 4:
            northernMetrologicalSeason = "Spring"
            southernMetrologicalSeason = "Fall (Autumn)"
        break
        case 5:
        case 6:
        case 7:
            northernMetrologicalSeason = "Summer"
            southernMetrologicalSeason = "Winter"
        break
        case 8:
        case 9:
        case 10:
            northernMetrologicalSeason = "Fall (Autumn)"
            southernMetrologicalSeason = "Spring"
        break

    }

    metrologicalSeasonsNorth.textContent = northernMetrologicalSeason
    metrologicalSeasonsSouth.textContent = southernMetrologicalSeason

    // TODO align to conjunctions and use that to count and display the number of conjunctions
    synodicMonth.textContent = toAtMost10Chars(time / SYNODIC_MONTH_IN_MILLIS)

    // TODO align to equinoxes and use that to count and display the number of equinoxes
    tropicalMonth.textContent = toAtMost10Chars(time / TROPICAL_MONTH_IN_MILLIS)

    // TODO align to fixed star points and use that to count and display the number of fixed star points
    sideralMonth.textContent = toAtMost10Chars(time / SIDERAL_MONTH_IN_MILLIS)

    // TODO align to perigrees and use that to count and display the number of perigrees
    anomalisticMonth.textContent = toAtMost10Chars(time / ANOMALISTIC_MONTH_IN_MILLIS)

    // TODO align to node events and use that to count and display the number of node events
    dragonicMonth.textContent = toAtMost10Chars(time / DRAGONIC_MONTH_IN_MILLIS)
}

/** @type {(n: Hours, divisor: Integer) => string} */
const hoursToWord = (n, divisor) => {
    n = n % divisor
    if (n === 0) {
        n = divisor
    }
    return intToWords(n)
}

/** @typedef {(index: Index, divisor: Integer) => string} TextForIndex */
/** @typedef {(index: Index) => Radians} RotationForIndex */

/** @type {(args: {time: EpochTime, ctx: AnalogueClockCtx, divisor?: Integer, numberXYs?: (scale: Scale) => XY[], topOfClockShift?: number, textForIndex?: TextForIndex, rotationForIndex?: RotationForIndex) => void} */
const renderClock = ({time, ctx: ctxIn, divisor, numberXYs: numberXYsIn, topOfClockShift, textForIndex: textForIndexIn, rotationForIndex}) => {
    divisor ||= 12
    /** @type {(scale: Scale) => XY[]} */
    let numberXYs = numberXYsIn || twelveHourClockNumberXYs
    topOfClockShift = topOfClockShift === undefined ? -0.25 : topOfClockShift
    let textForIndex = textForIndexIn || clockTextForIndex
    rotationForIndex ||= () => 0;

    const scale = ctxIn.scale
    let ctx = ctxIn.ctx

    const lengths = clockLengths(scale)

    ctx.clearRect(0, 0, lengths.clockWidth, lengths.clockHeight)

    ctx.fillStyle = "#eee"
    ctx.beginPath();
    ctx.arc(lengths.clockX, lengths.clockY, lengths.clockRadius, 0, 2 * Math.PI)
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#5a7d8b';
    ctx.stroke();

    ctx.fillStyle = "#222"
    ctx.font = (6 * scale) + "px sans-serif";
    const numberXYsArray = numberXYs(scale)
    for (let i = 0; i < numberXYsArray.length; i += 1) {
        const [baseX, baseY] = numberXYsArray[i]

        const text = textForIndex(i, divisor)
        const metrics = ctx.measureText(text)

        const angle = rotationForIndex(i)

        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.rotate(angle);
        ctx.fillText(text, -metrics.width / 2, metrics.fontBoundingBoxDescent);
        ctx.restore();
    }

    const hourDivisor = 24 / divisor

    const hourFrac = (time % (Time.DAY_IN_MILLIS / hourDivisor)) / (Time.DAY_IN_MILLIS / hourDivisor)
    const minuteFrac = (time % Time.HOUR_IN_MILLIS) / Time.HOUR_IN_MILLIS
    const secondFrac = (time % Time.MINUTE_IN_MILLIS) / Time.MINUTE_IN_MILLIS

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3352e1';
    ctx.beginPath()
    ctx.moveTo(lengths.clockX, lengths.clockY)
    const hourAngle = (hourFrac + topOfClockShift) * TAU
    ctx.lineTo(lengths.clockX + Math.cos(hourAngle) * lengths.clockHourRadius, lengths.clockY + Math.sin(hourAngle) * lengths.clockHourRadius)
    ctx.stroke()

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#5a7d8b';
    ctx.beginPath()
    ctx.moveTo(lengths.clockX, lengths.clockY)
    const minuteAngle = (minuteFrac + topOfClockShift) * TAU
    ctx.lineTo(lengths.clockX + Math.cos(minuteAngle) * lengths.clockMinuteRadius, lengths.clockY + Math.sin(minuteAngle) * lengths.clockMinuteRadius)
    ctx.stroke()

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#de4949';
    ctx.beginPath()
    ctx.moveTo(lengths.clockX, lengths.clockY)
    const secondAngle = (secondFrac + topOfClockShift) * TAU
    ctx.lineTo(lengths.clockX + Math.cos(secondAngle) * lengths.clockSecondRadius, lengths.clockY + Math.sin(secondAngle) * lengths.clockSecondRadius)
    ctx.stroke()
}

/** @type {(n: Integer) => string} */
const intToWords = (n) => {
    let output = ""

    if (n < 0) {
        output += "Minus "
    }

    n = Math.abs(n)

    for (let [roundValue, word] of [
        // This covers up to Number.MAX_SAFE_INTEGER, which seems as good a place to stop as any
        [1_000_000_000_000_000_000, "Quintillion"],
        [1_000_000_000_000_000, "Quadrillion"],
        [1_000_000_000_000, "Trillion"],
        [1_000_000_000, "Billion"],
        [1_000_000, "Million"],
        [1000, "Thousand"],
        [100, "Hundred"]
    ]) {
        if (n === roundValue) {
            output += intToWords(1) + " " + word
            return output
        } else if (n > roundValue) {
            const leadingDigits = Math.floor(n / roundValue)
            output += intToWords(leadingDigits) + " " + word + " "
            n -= leadingDigits * roundValue
            if (n === 0) {
                return output
            }
        }
    }

    /** @type {[number, string][]} */
    const tensTuples = [[90, "Ninety"], [80, "Eighty"], [70, "Seventy"], [60, "Sixty"], [50, "Fifty"], [40, "Forty"], [30, "Thirty"], [20, "Twenty"]];

    for (let [multipleOfTen, word] of tensTuples) {
        if (n === multipleOfTen) {
            output += word
            return output
        } else if (n > multipleOfTen) {
            output += intToWords(multipleOfTen) + '-' + intToWords(n % multipleOfTen)
            return output
        }
    }
    switch (n) {
        default:
            console.error("Unhandled case in intToWords: " + n)
            return "" + n
        case 0:
            output += "Zero"
        break
        case 1:
            output += "One"
        break
        case 2:
            output += "Two"
        break
        case 3:
            output += "Three"
        break
        case 4:
            output += "Four"
        break
        case 5:
            output += "Five"
        break
        case 6:
            output += "Six"
        break
        case 7:
            output += "Seven"
        break
        case 8:
            output += "Eight"
        break
        case 9:
            output += "Nine"
        break
        case 10:
            output += "Ten"
        break
        case 11:
            output += "Eleven"
        break
        case 12:
            output += "Twelve"
        break
        case 13:
            output += "Thirteen"
        break
        case 14:
            output += "Fourteen"
        break
        case 15:
            output += "Fifteen"
        break
        case 16:
            output += "Sixteen"
        break
        case 17:
            output +="Seventeen"
        break
        case 18:
            output += "Eighteen"
        break
        case 19:
            output += "Nineteen"
        break
    }

    return output
}

/** @type {(n: Integer) => string} */
const padToTwoDigits = (n) => {
    return (n < 10 ? "0" : "") + n
}

/** @type {(n: Integer) => string} */
const padToTwoDigitsBase12 = (n) => {
    return (n < 12 ? "0" : lastBase12Digit(n/12)) + lastBase12Digit(n)
}

/** @type {(digits: Integer, toPad: Integer) => string} */
const padToNDigits = (digits, toPad) => {
    let output = toPad + "";

    while (output.length < digits) {
        output = "0" + output
    }

    return output
}

/** @type {(digits: Integer, toPad: Integer) => string} */
const padToNDigitsBaseFactorial = (digits, toPad) => {
    let output = FactorialBase.stringOf(toPad)

    while (output.length < digits) {
        output = "0" + output
    }

    return output
}

/** @type {(s: string) => string} */
const padStringToTwoDigits = (s) => {
    return (s.length === 0 ? "00" : (s.length === 1 ? "0" : "")) + s
}

const PLAYING_CARD_CHARS = [
    "🂡", "🂢", "🂣", "🂤", "🂥", "🂦", "🂧", "🂨", "🂩", "🂪", "🂫", "🂭", "🂮",
    "🂱", "🂲", "🂳", "🂴", "🂵", "🂶", "🂷", "🂸", "🂹", "🂺", "🂻", "🂽", "🂾",
    "🃁", "🃂", "🃃", "🃄", "🃅", "🃆", "🃇", "🃈", "🃉", "🃊", "🃋", "🃍", "🃎",
    "🃑", "🃒", "🃓", "🃔", "🃕", "🃖", "🃗", "🃘", "🃙", "🃚", "🃛", "🃝", "🃞",
    "🃏", "🂠"
]

const JOKER_INDEX = 52

/** @type {(n: number) => string} */
const unicodePlayingCardForNumber = (n) => {
    return PLAYING_CARD_CHARS[n - 1] || PLAYING_CARD_CHARS[JOKER_INDEX]
}

const ANALOGUE_CLOCK_CHARS = [
    "🕛",
    "🕧",
    "🕐",
    "🕜",
    "🕑",
    "🕝",
    "🕒",
    "🕞",
    "🕓",
    "🕟",
    "🕔",
    "🕠",
    "🕕",
    "🕡",
    "🕖",
    "🕢",
    "🕗",
    "🕣",
    "🕘",
    "🕤",
    "🕙",
    "🕥",
    "🕚",
    "🕦",
]

/** @type {(hours: Hours, minutes: Minutes) => string} */
const analogueClockEmojiForHoursAndMinutes = (hours, minutes) => {
    let thirty
    if (minutes < 15) {
        thirty = 0
    } else if (minutes >= 15 && minutes < 45) {
        thirty = 1
    } else {
        hours += 1
        thirty = 0
    }
    hours %= 12

    return ANALOGUE_CLOCK_CHARS[(hours * 2) + thirty]
}

const CHINESE_TELEGRAPH_MONTH_CHARS = [
    "㋀",
    "㋁",
    "㋂",
    "㋃",
    "㋄",
    "㋅",
    "㋆",
    "㋇",
    "㋈",
    "㋉",
    "㋊",
    "㋋"
]

/** @type {(month: ZeroIndexedMonth) => string} */
const chineseTelegraphSymbolForZeroIndexedMonth = (month) => {
    return CHINESE_TELEGRAPH_MONTH_CHARS[month]
}

/** @type {(month: ZeroIndexedMonth) => number} */
const chineseTelegraphDigitsForZeroIndexedMonth = (month) => {
    return 9701 + month
}

const CHINESE_TELEGRAPH_DAY_CHARS = [
    "㏠",
    "㏡",
    "㏢",
    "㏣",
    "㏤",
    "㏥",
    "㏦",
    "㏧",
    "㏨",
    "㏩",
    "㏪",
    "㏫",
    "㏬",
    "㏭",
    "㏮",
    "㏯",
    "㏰",
    "㏱",
    "㏲",
    "㏳",
    "㏴",
    "㏵",
    "㏶",
    "㏷",
    "㏸",
    "㏹",
    "㏺",
    "㏻",
    "㏼",
    "㏽",
    "㏾"
]

/** @type {(dayOfMonth: DayOfMonth) => string} */
const chineseTelegraphSymbolForDayOfMonth = (dayOfMonth) => {
    return CHINESE_TELEGRAPH_DAY_CHARS[dayOfMonth - 1]
}

/** @type {(dayOfMonth: DayOfMonth) => number} */
const chineseTelegraphDigitsForDayOfMonth = (dayOfMonth) => {
    return 9900 + dayOfMonth
}

const CHINESE_TELEGRAPH_HOUR_CHARS = [
    "㍘",
    "㍙",
    "㍚",
    "㍛",
    "㍜",
    "㍝",
    "㍞",
    "㍟",
    "㍠",
    "㍡",
    "㍢",
    "㍣",
    "㍤",
    "㍥",
    "㍦",
    "㍧",
    "㍨",
    "㍩",
    "㍪",
    "㍫",
    "㍬",
    "㍭",
    "㍮",
    "㍯",
    "㍰",
]

/** @type {(hour: ZeroIndexedHour|OneIndexedHour) => string} */
const chineseTelegraphSymbolForHour = (hour) => {
    return CHINESE_TELEGRAPH_HOUR_CHARS[hour]
}

/** @type {(hour: ZeroIndexedHour|OneIndexedHour) => number} */
const chineseTelegraphDigitsForHour = (hour) => {
    return 9800 + hour
}

const playPause = document.getElementById("play-pause");
playPause.onclick = () => {
    switch (inputMode) {
        case RUNNING:
            inputMode = PAUSED
        break
        case PAUSED:
            inputMode = RUNNING
            renderStep()
        break
    }
};

/** @type {(elements: CalendarElements, specs: CalendarSpecs) => void} */
const applyCalendarSpecs = (
    {
        monthLabel,
        weekLabels,
        boxes,
        extraBoxesLabel,
        extraBoxes,
    },
    {
        monthText,
        boxSpecs,
        appearance,
    }
) => {
    monthLabel.innerHTML = monthText

    if (appearance === Time.HIDE_WEEK_ROW) {
        weekLabels.style.display = "none"
    }

    let len = boxSpecs.length
    if (appearance === Time.LAST_DAY_OUTSIDE_WEEK) {
        len -= 1
    }

    let newBoxes = ''
    for (let i = 0; i < len; i += 1) {
        newBoxes += boxHtml(boxSpecs[i])
    }
    boxes.innerHTML = newBoxes

    if (appearance === Time.LAST_DAY_OUTSIDE_WEEK) {
        extraBoxesLabel.style.display = "block"
        extraBoxesLabel.textContent = "No Week Day"
        extraBoxes.style.display = "block"
        extraBoxes.innerHTML = boxHtml(boxSpecs[boxSpecs.length - 1])
    } else {
        extraBoxesLabel.style.display = "none"
        extraBoxes.style.display = "none"
    }
}



/** @type {(args: BoxSpec) => string} */
const boxHtml = (
    {text, kind, linkedTime}
) => {
    let className;
    switch (kind) {
        default:
            console.error("No classname for spec kind: " + kind)
            // fallthrough
        case Time.OTHER_MONTH:
            className = "other-month"
        break
        case Time.CURRENT_MONTH:
            className = "current-month"
        break
        case Time.CURRENT_DAY:
            className = "current-day"
        break
    }

    return `<div class="${className}" onclick="setFromTimeAndRender(${linkedTime})">
        ${text}
    </div>`
}

/** @type {() => void} */
const renderStep = () => {
    const renderStart = MEASURE_FRAMES ? performance.now() : 0
    renderAt(new Date())

    if (MEASURE_FRAMES) {
        console.debug("Render: ", performance.now() - renderStart, "ms")
    }

    switch (inputMode) {
        case RUNNING:
            requestAnimationFrame(renderStep)
        break
        case PAUSED:
            // don't do another frame
        break
    }

}
renderStep()


console.log("Init: ", performance.now() - scriptStart, "ms")

// TODO? Add 12 and 24 hour variations for time paired with yyyyddd, yddd etc?
// TODO? Add days since UNIX epoch?
//  If so, might as well add seconds, minutes etc.
//  Y2038 value as 32 bits?
// TODO? Add two and three leter month abbreviations? Maybe "YYYY mm DD"?
// TODO Have all four of gregorian with and without year 0, and julian with and without year 0, and clearly labelled
// TODO? Make more variations of leap years
// TODO? Make a collapsible glossary of abbreviations and use them in the displayed text
// TODO? Have IFC but without a year 0?
// TODO show a calendar if no leap days were ever added, starting at time 0 for convenice
//    Check if there isn't a name for this calendar, possibly with a different starting point
// TODO show a calendar if leap days were always added, starting at time 0 for convenice
// TODO show a calendar if leap days were added to december instead, like would be sensible given we start at January
//    Maybe do a roman calendar starting at March first?
//    Seems like the actual roman calendar is more complciated than that
// TODO Is there a calendar that fits with the tarot deck including the major arcana? If not, invent one.
//   78 cards total, 22 major arcana, 56 minor arcana of 4 suits of 14 cards each
//       A positive diophatine solver reveals that 3*56 + 9*22 = 366, but no solutions for a*56 + b*22 = 365 exist
//           So a repeating pattern of minor arcana, waxing major arcana, full major arcana, waning major arcana, and back around to minor arcana?
//   One way to invent it would be to make weeks different lengths until all the days are accounted for
//   Fool's day should be April 1st, or maybe Feb 29th?
// TODO show a gregorian calendar using a subset of the years that covers the possible years
//   Maybe show 14 whole year calendars and show a dot jumping from day to day
// TODO? The different types of whole year calendar thing but for the IFC? Or is that too boring?
// TODO show the day of the Pawukon as described in the article mentioned below. Apparently a particular date in the Julian calendar is a traditional base.
//    https://en.wikipedia.org/wiki/Pawukon_calendar
// TODO show French Republican decimal time
// TODO show French Republican Calendar
// TODO show Swatch Internet time
// TODO show a version of the clock on xkcd.com/now
// TODO show a "digital analogue" clock that merely prints the angle of the hands
//  I guess a analogue digital clock would be one of those ones where the digits are shown on cards that flip over?
// TODO add a analogue clock that has second, minute, hour, day, and week hands
// TODO add a analogue clock that has a minute hand, a millenium hand, and an eon hand.
//   Can probably call an eon the average length of a geologic eon, or since wikipedia says "half a billion years or more", just use a nice round number close to half a billion years
// TODO? invent and show an "analogue date"?
//     I guess numbers for the months? Maybe this would only make sense for a calandar with truly fixed length months? What if a "year" is 4 years to bake in leap year stuff?
// TODO show phases of the moon with symbols, as seen in northern and southern hemispheres (This is apparently hard to do accurately!)
// TODO show position in the Sexagenary cycle/ganzhi
//    Doing this properly depends on the lunar new year, which in turn depends on the phases of the moon
//    Any other similar cycles like this? Mayan calendar maybe?
// TODO? show if the current day or other time period is mildy interesting in a different calendar than usual?
//    For example, IFC April fool's day, King of hearts week
//    But is there enough of these to be worth it? There are more of these if there's more calendars
// TODO? Find a random generator of something, say names, and define a total order to its output and thus map the output to some appropriate time period with a repeating cycle, e.g. name of the day or hour

// TODO? add labels to more of the timepieces, maybe making them optional?
//    The labels that is.

// TODO Make the creation of the HTML elements based on some JS constants, making the defintions less spread out?
// TODO Make the TIMEPIECE_IDS array be filled automatically when appending timepiece HTML elements
// TODO? Abstract over having both 12 and 24 hour versions of clocks?
// TODO? Make it so we can just define some sets of things like { Gregorian 0, IFC, Julian 0 } and {default, base date, base factorial } and render the cross product of them
//    Do we actually want all the possibilities there? Maybe hide some by default?

// TODO Consider adding more controllable categories
