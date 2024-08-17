"use strict";

const scriptStart = performance.now()

const fs = require('fs');

global.Time = eval(fs.readFileSync('./time.js')+'; Time;')
global.FactorialBase = eval(fs.readFileSync('./factorialBase.js')+'; FactorialBase;')

//
// assertion framework
//

/**
 *  @param {boolean} bool
 *  @param {string} message
 */
const assert = (bool, message) => {
    if (bool) {
        return
    }

    throw new Error(message || "Assertion failed")
}
/**
 *  @param {*[]} a
 *  @param {*[]} b
 */
const arrayEqual = (a, b) => {
    if (!Array.isArray(a)) {
        throw new Error("arrayEqual was passed non-array: " + a)
    }
    if (!Array.isArray(b)) {
        throw new Error("arrayEqual was passed non-array: " + b)
    }

    if (a === b) {
        return true
    }
    if (a.length !== b.length) {
        return false
    }

    for (var i = 0; i < a.length; i += 1) {
         // TODO? make this function recursive and remove array restrictions?
        if (a[i] !== b[i]) {
            return false
        }
    }
    return true
}

//
// test framework
//

/**
 * @typedef {() => unknown} Test
 */

/** @type {Test[]} */
let allTests = []
/** @type {(test: Test) => void} */
const it = (test) => { allTests.push(test) }
/** @type {(test: *) => void} */
const skipit = (test) => {}

//
// test helpers
//

/** `start` is expected to be less than or equal to `end`
  * @type {(start: number, end: number) => number[]}
  */
const range = (start, end) => {
    let output = []
    let i = 0
    for (let current = start; current < end; current += 1) {
        output[i] = current
        i += 1;
    }
    return output
}

/** @typedef {number} Integer */
/** @typedef {1|2|3|4|5|6|7|8|9|10|11|12} Month */
/** @typedef {1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|21|22|23|24|25|26|27|28|29|30|31} DayOfMonth */


/** @typedef {{g0Year: Integer, g0Month: Month, g0DayOfMonth: DayOfMonth}} G0YMD */

/** @type {(g0YMD: G0YMD) => Date} */
const getDateForG0YMD = ({g0Year, g0Month, g0DayOfMonth}) => {
    const output = new Date(0);
    output.setUTCFullYear(g0Year)
    output.setUTCMonth(g0Month - 1)
    output.setUTCDate(g0DayOfMonth)
    return output
}

/** @type {(n: unknown) => boolean} */
const isNormalEnoughNumber = (n) => {
    return !Number.isNaN(n) && n !== (1/0) && n !== -(1/0)
}

//
//  config/hackery
//

(/** @type {{[key in string]: boolean}} */ (global).DEBUG_MODE = true);

// tests
it(() => {
    const date = new Date(1700000000000)
    for (let kind = Time.GREGORIAN0; kind < Time.CALENDAR_KIND_COUNT; kind += 1) {
        const {boxSpecs: specs} = Time.calculateCalendarSpecs(kind, date)
        // We mostly care that we got here without throwing an error
        // but if we can think of better asserts that are easy to write
        // then we shoudl write them!
        assert(specs.length > 0, "Specs was empty!")
    }
})

it(() => {
    const expected = range(0, 365)
    for (let i = 0; i < expected.length; i += 1) {
        const actual = Time.get0IndexedDayOfYear(new Date(1970, 0, 1 + i))
        assert(actual === expected[i], "day of year did not match: " + actual + " != " + expected[i])
    }
})

it(() => {
    const expected = range(0, 366)
    for (let i = 0; i < expected.length; i += 1) {
        const actual = Time.get0IndexedDayOfYear(new Date(2000, 0, 1 + i))
        assert(actual === expected[i], "day of year number did not match in leap year: " + actual + " != " + expected[i])
    }
})

it(() => {
    const jan29G = new Date(1970, 0, 29)
    const {boxSpecs: specs, monthText} = Time.calculateCalendarSpecs(Time.INTERNATIONAL_FIXED, jan29G)

    assert(monthText === "February", "monthText did not match: " + monthText + " != February")

    const expected = range(1, 28 + 1)
    for (let i = 0; i < expected.length; i += 1) {
        assert(specs[i].text == expected[i], "text did not match")
    }
})

it(() => {
    // 1970 is not a leap year
    const june18G = new Date(1970, 5, 18)

    const dayOfYear = Time.get0IndexedDayOfYear(june18G)
    assert(dayOfYear === Time.IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR, "dayOfYear did not match: " + dayOfYear + " != " + Time.IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR)

    const {boxSpecs: specs, monthText} = Time.calculateCalendarSpecs(Time.INTERNATIONAL_FIXED, june18G)

    assert(monthText === "Sol", "monthText did not match: " + monthText + " != Sol")

    const expected = range(1, 28 + 1)
    for (let i = 0; i < expected.length; i += 1) {
        assert(specs[i].text == expected[i], "text did not match")
    }
})

it(() => {
    // 1972 is a leap year
    const june17G = new Date(1972, 5, 17)

    const dayOfYear = Time.get0IndexedDayOfYear(june17G)
    assert(dayOfYear === Time.IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR, "dayOfYear did not match: " + dayOfYear + " != " + Time.IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR)

    const {boxSpecs: specs, monthText} = Time.calculateCalendarSpecs(Time.INTERNATIONAL_FIXED, june17G)

    assert(monthText === "June", "monthText did not match: " + monthText + " != June")

    const expected = range(1, 29 + 1)
    for (let i = 0; i < expected.length; i += 1) {
        assert(specs[i].text === expected[i], "text did not match")
    }
})

it(() => {
    const allExpected = [
        [0,  28,  56,  84, 112, 140, 168, 196, 224, 252, 280, 308, 336, 364],
        [0,  28,  56,  84, 112, 140, 169, 197, 225, 253, 281, 309, 337, 365],
    ]

    /** @typedef {0|1|2|3|4|5|6|7|8|9|10|11|12|13} ZeroIndexedIFCMonth */

    // 1972 is a leap year
    for (let year = 1971; year <= 1972; year += 1) {
        const expected = allExpected[year - 1971]

        for (let zeroIndexedMonthNumber = 0; zeroIndexedMonthNumber <= Time.IFC_ZERO_INDEXED_YEAR_DAY_MONTH; zeroIndexedMonthNumber += 1) {
            const zeroIndexedFirstDayOfYearInMonth = Time.ifcZeroIndexedMonthToZeroIndexedFirstDayOfYearInMonth({
                zeroIndexedMonthNumber: /** @type ZeroIndexedIFCMonth */ (zeroIndexedMonthNumber),
                year,
            })

            assert(zeroIndexedFirstDayOfYearInMonth === expected[zeroIndexedMonthNumber], "zeroIndexedFirstDayOfYearInMonth did not match: " + zeroIndexedFirstDayOfYearInMonth + " != " + expected[zeroIndexedMonthNumber])
        }
    }
})

it(() => {
    // 1972 is a leap year
    const jan1G = new Date(1972, 0, 1)

    const startOfJune = new Date(Time.gregorian0LinkedTimeFromDayOfMonth(jan1G, 5, 1))
    const startOfJuly = new Date(Time.gregorian0LinkedTimeFromDayOfMonth(jan1G, 6, 1))

    const shouldBeStartOfJulyTime = Time.gregorian0LinkedTimeFromDayOfMonth(startOfJune, 1, 1)

    const startOfJulyTime = startOfJuly.getTime()

    assert(shouldBeStartOfJulyTime === startOfJulyTime, "shouldBeStartOfJulyTime did not match: " + shouldBeStartOfJulyTime + " != " + startOfJulyTime)
})

it(() => {
    // 1972 is a leap year
    const jan1G = new Date(1972, 0, 1)
    const time1 = Time.ifcLinkedTimeFromDayOfMonth(jan1G, 5, 1)

    const startOfJune = new Date(time1)

    const startOfJuneTime = Time.ifcLinkedTimeFromDayOfMonth(startOfJune, 0, 1)

    const shouldBeStartOfJune = new Date(startOfJuneTime)

    const shouldBeStartOfJuneTime = Time.ifcLinkedTimeFromDayOfMonth(shouldBeStartOfJune, 0, 1)

    assert(shouldBeStartOfJuneTime === startOfJuneTime, "shouldBeStartOfJuneTime did not match: " + shouldBeStartOfJuneTime + " != " + startOfJuneTime)
})

it(() => {
    for (let dayOfYear = 1; dayOfYear <= 366; dayOfYear += 1) {
        // 1972 is a leap year
        const {
            zeroIndexedMonthNumber,
            dayOfMonth,
        } = Time.ifcZeroIndexedMonthAndDay(new Date(1972, 0, dayOfYear))

        assert(zeroIndexedMonthNumber >= 0, "zeroIndexedMonthNumber was too low on day " + dayOfYear + ": " + zeroIndexedMonthNumber)
        assert(zeroIndexedMonthNumber < 14, "zeroIndexedMonthNumber was too high on day " + dayOfYear + ": " + zeroIndexedMonthNumber)

        assert(dayOfMonth >= 1, "zeroIndexedMonthNumber was too low on day " + dayOfYear + ": " + dayOfMonth)
        assert(dayOfMonth <= 29, "zeroIndexedMonthNumber was too high on day " + dayOfYear + ": " + dayOfMonth)
    }
})

it(() => {
    /** @type {[[Integer, Month, DayOfMonth, number], [Integer, Month, DayOfMonth]][]} GREGORIAN_JULIAN_PAIRS */
    const inputOutputPairs = [
        // Input         Output
        [[1900,  2, 28, -12], [1900,  2, 16]],
        [[1900,  2, 13, -12], [1900,  2,  1]],
        [[1900,  2, 13, -13], [1900,  1, 31]],
        [[1900,  3,  1,  -1], [1900,  2, 29]], // Julian so yes leap year
        [[1900,  5,  1,  -1], [1900,  4, 30]],
        [[1900,  1,  1,  -1], [1899, 12, 31]],
        [[1900,  1,  1, 366], [1901,  1,  1]],
        [[1901,  1,  1, 365], [1902,  1,  1]],
        [[1900,  1,  1, 731], [1902,  1,  1]],
        [[1900,  1,  1, 400], [1901,  2,  4]] // 400 = 366 + 31 + 3
    ]
    for (let i = 0; i < inputOutputPairs.length; i += 1) {
        const [[inY, inM, inD, daysOffset], [outY, outM, outD]] = inputOutputPairs[i];

        (() => {
            const {j0Year: year, j0Month: month, j0DayOfMonth: dayOfMonth} = Time.rollJulian0YMDByDays(Time.J0.ymd(inY, inM, inD), daysOffset)
            assert(
                year === outY && month === outM && dayOfMonth === outD,
                "rollJulian0YMDByDays mismatch for " + [inY, inM, inD] + ", expected " + [outY, outM, outD] + " got " + [year, month, dayOfMonth]
            )
        })();

        (() => {
            const {j0Year: year, j0Month: month, j0DayOfMonth: dayOfMonth} = Time.rollJulian0YMDByDays(Time.J0.ymd(outY, outM, outD), -daysOffset)
            assert(
                year === inY && month === inM && dayOfMonth === inD,
                "rollJulian0YMDByDays reverse mismatch for " + [outY, outM, outD] + ", expected " + [inY, inM, inD] + " got " + [year, month, dayOfMonth]
            )
        })();
    }
})

it(() => {
    /** @type {[[Integer, Month, DayOfMonth], number][]} GREGORIAN_EXAMPLES */
    const GREGORIAN_EXAMPLES = [
        [[300, 2, 28], 0],
        [[300, 3,  1], 1],
        [[500, 3,  1], 2],
    ]

    for (let i = 0; i < GREGORIAN_EXAMPLES.length; i += 1) {
        const [[gY, gM, gD], expected] = GREGORIAN_EXAMPLES[i];

        const actual = Time.julian0DaysDifferenceFromGregorian0YMD(Time.G0.ymd(gY, gM, gD))

        assert(
            actual === expected,
            "julian0DaysDifferenceFromGregorian0YMD mismatch for " + [gY, gM, gD] + ", expected " + expected + " got " + actual
        )
    }
})

it(() => {
    /** @type {[[Integer, Month, DayOfMonth], number][]} JULIAN_EXAMPLES */
    const JULIAN_EXAMPLES = [
        [[300, 2, 28], 0],
        [[300, 2, 29], 0],
        [[500, 3,  1], 2],
    ]

    for (let i = 0; i < JULIAN_EXAMPLES.length; i += 1) {
        const [[jY, jM, jD], expected] = JULIAN_EXAMPLES[i];
        const actual = Time.gregorian0DaysDifferenceFromJulian0YMD(Time.J0.ymd(jY, jM, jD))

        assert(
            actual === expected,
            "gregorian0DaysDifferenceFromJulian0YMD mismatch for " + [jY, jM, jD] + ", expected " + expected + " got " + actual
        )
    }
})

/** @typedef {[Integer, Month, DayOfMonth]} YMDTuple */

/** @type {[YMDTuple, YMDTuple, YMDTuple][]} GREGORIAN_JULIAN_PAIRS */
const GREGORIAN_JULIAN_PAIRS = [
    // This uses the (non-standard) convention that both Gregorian and
    // Julian calendars have a year 0
    // Gregorian 0   Julian 0        Gregorian 1        Julian 1
    [[-4712,11, 24], [-4711, 1,  1], [-4713,11, 24]/*, [-4712, 1,  1]*/],
    [[-500,  2, 28], [-500,  3,  5], [-501,  2, 28]],
    [[-500,  3,  1], [-500,  3,  6], [-501,  3,  1]],
    [[-300,  2, 27], [-300,  3,  3], [-301,  2, 27]],
    [[-300,  2, 28], [-300,  3,  4], [-301,  2, 28]],
    [[-300,  3,  1], [-300,  3,  5], [-301,  3,  1]],
    [[-200,  2, 27], [-200,  3,  2], [-201,  2, 27]],
    [[-200,  2, 28], [-200,  3,  3], [-201,  2, 28]],
    [[-200,  3,  1], [-200,  3,  4], [-201,  3,  1]],
    [[-100,  2, 27], [-100,  3,  1], [-101,  2, 27]],
    [[-100,  2, 28], [-100,  3,  2], [-101,  2, 28]],
    [[-100,  3,  1], [-100,  3,  3], [-101,  3,  1]],
    [[   0,  3,  1], [   0,  3,  3], [  -1,  3,  1]],
    [[ 100,  2, 27], [ 100,  2, 29], [ 100,  2, 27]],
    [[ 100,  2, 28], [ 100,  3,  1], [ 100,  2, 28]],
    [[ 100,  3,  1], [  100,  3, 2], [ 100,  3,  1]],
    [[ 200,  2, 27], [ 200,  2, 28], [ 200,  2, 27]],
    [[ 200,  2, 28], [ 200,  2, 29], [ 200,  2, 28]],
    [[ 200,  3,  1], [ 200,  3,  1], [ 200,  3,  1]],
    [[ 300,  2, 28], [ 300,  2, 28], [ 300,  2, 28]],
    [[ 300,  3,  1], [ 300,  2, 29], [ 300,  3,  1]],
    [[ 300,  3,  2], [ 300,  3,  1], [ 300,  3,  2]],
    [[ 500,  3,  1], [ 500,  2, 28], [ 500,  3,  1]],
    [[ 500,  3,  2], [ 500,  2, 29], [ 500,  3,  2]],
    [[ 500,  3,  3], [ 500,  3,  1], [ 500,  3,  3]],
    [[ 600,  3,  2], [ 600,  2, 28], [ 600,  3,  2]],
    [[ 600,  3,  3], [ 600,  2, 29], [ 600,  3,  3]],
    [[ 600,  3,  4], [ 600,  3,  1], [ 600,  3,  4]],
    [[ 700,  3,  3], [ 700,  2, 28], [ 700,  3,  3]],
    [[ 700,  3,  4], [ 700,  2, 29], [ 700,  3,  4]],
    [[ 700,  3,  5], [ 700,  3,  1], [ 700,  3,  5]],
    [[ 900,  3,  4], [ 900,  2, 28], [ 900,  3,  4]],
    [[ 900,  3,  5], [ 900,  2, 29], [ 900,  3,  5]],
    [[ 900,  3,  6], [ 900,  3,  1], [ 900,  3,  6]],
    [[1000,  3,  5], [1000,  2, 28], [1000,  3,  5]],
    [[1000,  3,  6], [1000,  2, 29], [1000,  3,  6]],
    [[1000,  3,  7], [1000,  3,  1], [1000,  3,  7]],
    [[1100,  3,  6], [1100,  2, 28], [1100,  3,  6]],
    [[1100,  3,  7], [1100,  2, 29], [1100,  3,  7]],
    [[1100,  3,  8], [1100,  3,  1], [1100,  3,  8]],
    [[1300,  3,  7], [1300,  2, 28], [1300,  3,  7]],
    [[1300,  3,  8], [1300,  2, 29], [1300,  3,  8]],
    [[1300,  3,  9], [1300,  3,  1], [1300,  3,  9]],
    [[1400,  3,  8], [1400,  2, 28], [1400,  3,  8]],
    [[1400,  3,  9], [1400,  2, 29], [1400,  3,  9]],
    [[1400,  3, 10], [1400,  3,  1], [1400,  3, 10]],
    [[1500,  3,  9], [1500,  2, 28], [1500,  3,  9]],
    [[1500,  3, 10], [1500,  2, 29], [1500,  3, 10]],
    [[1500,  3, 11], [1500,  3,  1], [1500,  3, 11]],
    [[1500,  3, 11], [1500,  3,  1], [1500,  3, 11]],
    [[1582, 10, 14], [1582, 10,  4], [1582, 10, 14]],
    [[1582, 10, 15], [1582, 10,  5], [1582, 10, 15]],
    [[1582, 10, 16], [1582, 10,  6], [1582, 10, 16]],
    [[1700,  2, 28], [1700,  2, 18], [1700,  2, 28]],
    [[1700,  3,  1], [1700,  2, 19], [1700,  3,  1]],
    [[1700,  3, 10], [1700,  2, 28], [1700,  3, 10]],
    [[1700,  3, 11], [1700,  2, 29], [1700,  3, 11]],
    [[1700,  3, 12], [1700,  3,  1], [1700,  3, 12]],
    [[1800,  2, 28], [1800,  2, 17], [1800,  2, 28]],
    [[1800,  3,  1], [1800,  2, 18], [1800,  3,  1]],
    [[1800,  3, 11], [1800,  2, 28], [1800,  3, 11]],
    [[1800,  3, 12], [1800,  2, 29], [1800,  3, 12]],
    [[1800,  3, 13], [1800,  3,  1], [1800,  3, 13]],
    [[1900,  2, 28], [1900,  2, 16], [1900,  2, 28]],
    [[1900,  3,  1], [1900,  2, 17], [1900,  3,  1]],
    [[1900,  3, 12], [1900,  2, 28], [1900,  3, 12]],
    [[1900,  3, 13], [1900,  2, 29], [1900,  3, 13]],
    [[1900,  3, 14], [1900,  3,  1], [1900,  3, 14]],
    [[1900,  3, 15], [1900,  3,  2], [1900,  3, 15]],
    [[1900,  3, 16], [1900,  3,  3], [1900,  3, 16]],
    [[1900,  3, 17], [1900,  3,  4], [1900,  3, 17]],
    [[1900,  3, 18], [1900,  3,  5], [1900,  3, 18]],
    [[1900,  3, 28], [1900,  3, 15], [1900,  3, 28]],
    [[1900,  3, 29], [1900,  3, 16], [1900,  3, 29]],
    [[1900,  3, 30], [1900,  3, 17], [1900,  3, 30]],
    [[1900,  3, 31], [1900,  3, 18], [1900,  3, 31]],
    [[1900,  4,  1], [1900,  3, 19], [1900,  4,  1]],
    [[1900,  4,  2], [1900,  3, 20], [1900,  4,  2]],
    [[1900,  4, 12], [1900,  3, 30], [1900,  4, 12]],
    [[1900,  4, 13], [1900,  3, 31], [1900,  4, 13]],
    [[1900,  4, 14], [1900,  4,  1], [1900,  4, 14]],
    [[1970,  1,  1], [1969, 12, 19], [1970,  1,  1]],
    [[2001,  9,  9], [2001,  8, 27], [2001,  9,  9]],
    [[2023, 10, 31], [2023, 10, 18], [2023, 10, 31]],
    [[2100,  2, 28], [2100,  2, 15], [2100,  2, 28]],
    [[2100,  3,  1], [2100,  2, 16], [2100,  3,  1]],
    [[2100,  3, 13], [2100,  2, 28], [2100,  3, 13]],
    [[2100,  3, 14], [2100,  2, 29], [2100,  3, 14]],
]


////////////////////////////////////////////////////////////////////////
// Begin G0 <-> J0 section
// We have gregorian0YMDToJulian0 and julian0YMDToGregorian0 and we further
// have gregorian0YMDToJulian0DaysSinceJulianEpoch and
// julian0YMDToJulianDaysSinceJulianEpoch. These functions are related
// in the following way:
// Call gregorian0YMDToJulian0 A, julian0YMDToGregorian0 B,
// gregorian0YMDToJulianDaysSinceJulianEpoch C, and
// julian0YMDToJulianDaysSinceJulianEpoch D
//
// gymd--A-->jymd
// jymd--B-->gymd
// gymd--C-->jd
// jymd--D-->jd
//
// gymd
// *<---->* jymd
// |  A/B |
// |C     |D
// |      |
// |      V
// ------>* JD
//
// We want it to be the case that when a value starts anywhere and takes
// both of any pair of paths, ithe value is transformed to the same
// final value in both paths.

// This tests checks that C and D above have the right codomains
it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[gY, gM, gD], [jY, jM, jD]] = GREGORIAN_JULIAN_PAIRS[i]

        const g0YMD = Time.G0.ymd(gY, gM, gD);
        const j0YMD = Time.J0.ymd(jY, jM, jD);

        const gJD = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(g0YMD)
        assert(
            isNormalEnoughNumber(gJD),
            "gJD is not in the expected range: " + gJD
        )

        const jJD = Time.julian0YMDToJulianDaysSinceJulianEpoch(j0YMD)
        assert(
            isNormalEnoughNumber(jJD),
            "jJD is not in the expected range: " + jJD
        )
    }
})

// This tests checks the path * -A-> * -B-> * above is the same as the
// null path
it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[inY, inM, inD], [outY, outM, outD]] = GREGORIAN_JULIAN_PAIRS[i];

        const {j0Year: year, j0Month: month, j0DayOfMonth: dayOfMonth} = Time.gregorian0YMDToJulian0(Time.G0.ymd(inY, inM, inD))
        assert(
            year === outY && month === outM && dayOfMonth === outD,
            "gregorian0YMDToJulian0 mismatch for " + [inY, inM, inD] + ", expected " + [outY, outM, outD] + " got " + [year, month, dayOfMonth]
        )

        const looped = Time.julian0YMDToGregorian0(Time.J0.ymd(outY, outM, outD))
        assert(
            inY === looped.g0Year && inM === looped.g0Month && inD === looped.g0DayOfMonth,
            "julian0YMDToGregorian0 mismatch for " + [outY, outM, outD] + ", expected " + [inY, inM, inD] + " got " + [looped.g0Year, looped.g0Month, looped.g0DayOfMonth]
        )
    }
})
// This tests checks the path * -B-> * -C-> * above is the same as
// * -D-> *
it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[gY, gM, gD], [jY, jM, jD]] = GREGORIAN_JULIAN_PAIRS[i]

        const j0YMD = Time.J0.ymd(jY, jM, jD);

        const JD1 = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(Time.julian0YMDToGregorian0(j0YMD))
        const JD2 = Time.julian0YMDToJulianDaysSinceJulianEpoch(j0YMD)

        assert(
            JD1 === JD2,
            "julian0YMDToJulianDaysSinceJulianEpoch mismatch for " + [jY, jM, jD] + ", expected " + JD1 + " got " + JD2
        )
    }
})
// This tests checks the path * -A-> * -D-> * above is the same as
// * -C-> *
it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[gY, gM, gD], [jY, jM, jD]] = GREGORIAN_JULIAN_PAIRS[i]

        const g0YMD = Time.G0.ymd(gY, gM, gD);

        const JD1 = Time.julian0YMDToJulianDaysSinceJulianEpoch(Time.gregorian0YMDToJulian0(g0YMD))

        const JD2 = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(g0YMD)

        assert(
            JD1 === JD2,
            "gregorian0YMDToJulian0DaysSinceJulianEpoch mismatch for " + [gY, gM, gD] + ", expected " + JD1 + " got " + JD2
        )
    }
})
// End G0 <-> J0 section
////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////
// Begin G0 <-> G1 section
// We have gregorian0YMDToJulian0 and gregorian1YMDToGregorian0 and we further
// have gregorian0YMDToJulian0DaysSinceJulianEpoch and
// gregorian1YMDToJulianDaysSinceJulianEpoch. These functions are related
// in the following way:
// Call gregorian0YMDToJulian0 A, gregorian1YMDToGregorian0 B,
// gregorian0YMDToJulianDaysSinceJulianEpoch C, and
// gregorian1YMDToJulianDaysSinceJulianEpoch D
//
// g0ymd--A-->g1ymd
// g1ymd--B-->g0ymd
// g0ymd--C-->jd
// g1ymd--D-->jd
//
// g0ymd
// *<---->* g1ymd
// |  A/B |
// |C     |D
// |      |
// |      V
// ------>* JD
//
// We want it to be the case that when a value starts anywhere and takes
// both of any pair of paths, ithe value is transformed to the same
// final value in both paths.

// This tests checks that C and D above have the right codomains
it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[g0Y, g0M, g0D], _, [g1Y, g1M, g1D]] = GREGORIAN_JULIAN_PAIRS[i]

        const g0YMD = Time.G0.ymd(g0Y, g0M, g0D);
        const g1YMD = Time.G1.ymd(g1Y, g1M, g1D);

        const g0JD = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(g0YMD)
        assert(
            isNormalEnoughNumber(g0JD),
            "g0JD is not in the expected range: " + g0JD
        )

        const g1JD = Time.gregorian1YMDToJulianDaysSinceJulianEpoch(g1YMD)
        assert(
            isNormalEnoughNumber(g1JD),
            "g1JD is not in the expected range: " + g1JD
        )
    }
})

// This tests checks the path * -A-> * -B-> * above is the same as the
// null path
it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[inY, inM, inD], _, [outY, outM, outD]] = GREGORIAN_JULIAN_PAIRS[i];

        const {g1Year: year, g1Month: month, g1DayOfMonth: dayOfMonth} = Time.gregorian0YMDToGregorian1(Time.G0.ymd(inY, inM, inD))
        assert(
            year === outY && month === outM && dayOfMonth === outD,
            "gregorian0YMDToJulian0 mismatch for " + [inY, inM, inD] + ", expected " + [outY, outM, outD] + " got " + [year, month, dayOfMonth]
        )

        const looped = Time.gregorian1YMDToGregorian0(Time.G1.ymd(outY, outM, outD))
        assert(
            inY === looped.g0Year && inM === looped.g0Month && inD === looped.g0DayOfMonth,
            "gregorian1YMDToGregorian0 mismatch for " + [outY, outM, outD] + ", expected " + [inY, inM, inD] + " got " + [looped.g0Year, looped.g0Month, looped.g0DayOfMonth]
        )
    }
})
// This tests checks the path * -B-> * -C-> * above is the same as
// * -D-> *
it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[g0Y, g0M, g0D], _, [g1Y, g1M, g1D]] = GREGORIAN_JULIAN_PAIRS[i]

        const g1YMD = Time.G1.ymd(g1Y, g1M, g1D);

        const JD1 = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(Time.gregorian1YMDToGregorian0(g1YMD))
        const JD2 = Time.gregorian1YMDToJulianDaysSinceJulianEpoch(g1YMD)

        assert(
            JD1 === JD2,
            "gregorian1YMDToJulianDaysSinceJulianEpoch mismatch for " + [g1Y, g1M, g1D] + ", expected " + JD1 + " got " + JD2
        )
    }
})
// This tests checks the path * -A-> * -D-> * above is the same as
// * -C-> *
it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[g0Y, g0M, g0D], _, [g1Y, g1M, g1D]] = GREGORIAN_JULIAN_PAIRS[i]

        const g0YMD = Time.G0.ymd(g0Y, g0M, g0D);

        const JD1 = Time.gregorian1YMDToJulianDaysSinceJulianEpoch(Time.gregorian0YMDToGregorian1(g0YMD))

        const JD2 = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(g0YMD)

        assert(
            JD1 === JD2,
            "gregorian0YMDToJulian0DaysSinceJulianEpoch mismatch for " + [g0Y, g0M, g0D] + ", expected " + JD1 + " got " + JD2
        )
    }
})
// End G0 <-> G1 section
////////////////////////////////////////////////////////////////////////

it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[gY, gM, gD], [jY, jM, jD]] = GREGORIAN_JULIAN_PAIRS[i];

        const g0YMD = Time.G0.ymd(gY, gM, gD);

        const gJD = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(g0YMD)

        const gJDPlus1 = Time.gregorian0YMDToJulianDaysSinceJulianEpoch(Time.rollGregorian0YMDByDays(g0YMD, 1))

        assert(
            gJDPlus1 === gJD + 1,
            "gregorian0YMDToJulianDaysSinceJulianEpoch mismatch when rolling by 1 for " + [gY, gM, gD] + ", expected " + (gJD + 1) + " got " + gJDPlus1
        )

        const j0YMD = Time.J0.ymd(jY, jM, jD);

        const jJD = Time.julian0YMDToJulianDaysSinceJulianEpoch(j0YMD)

        const jJDPlus1 = Time.julian0YMDToJulianDaysSinceJulianEpoch(Time.rollJulian0YMDByDays(j0YMD, 1))

        assert(
            jJDPlus1 === jJD + 1,
            "julian0YMDToJulianDaysSinceJulianEpoch mismatch when rolling by 1 for " + [jY, jM, jD] + ", expected " + (jJD + 1) + " got " + jJDPlus1
        )
    }
})

it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[gY, gM, gD], [jY, jM, jD]] = GREGORIAN_JULIAN_PAIRS[i]

        const g0YMD = Time.G0.ymd(gY, gM, gD);

        const date = getDateForG0YMD(g0YMD)

        const expectedMiddle = date.getTime()

        const actual = Time.julianLinkedTimeFromDayOfMonth(date, Time.CURRENT, jD)

        const expectedMin = expectedMiddle - (Time.DAY_IN_MILLIS / 2)

        const expectedMax = expectedMiddle + (Time.DAY_IN_MILLIS / 2)

        assert(
            actual > expectedMin && actual < expectedMax,
            "julianLinkedTimeFromDayOfMonth out of range for " + [jY, jM, jD] + ", expected between " + expectedMin + " and " + expectedMax + ", got " + actual +
            ". Difference is " + (actual < expectedMin ? expectedMin - actual : actual - expectedMax) / Time.DAY_IN_MILLIS + " day(s) "
        )
    }
})

it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[g0Y, g0M, g0D], _, [g1Y, g1M, g1D]] = GREGORIAN_JULIAN_PAIRS[i]

        if (g0Y !== g1Y || g0M !== g1M || g0D !== g1D) {
            continue
        }

        const g0YMD = Time.G0.ymd(g0Y, g0M, g0D);
        const g1YMD = Time.G1.ymd(g1Y, g1M, g1D);

        const g0Weekday = Time.gregorian0DayOfWeek(g0YMD);
        const g1Weekday = Time.gregorian1DayOfWeek(g1YMD);

        assert(
            g0Weekday === g1Weekday,
            "mismatched day of the week for " + [g1Y, g1M, g1D] + ": " + g0Weekday + " !== " + g1Weekday
        )
    }
})

// Technically redundant, but makes for better feedback during failures
it(() => {
    const g0YMD = Time.G0.ymd(1970, 1, 1)
    const g0Weekday = Time.gregorian0DayOfWeek(g0YMD);
    // Jan 1st, 1970 was a Thursday (4)
    assert(
        g0Weekday === 4,
        "mismatched day of the week for " + [1970, 1, 1] + ": " + g0Weekday + " !== " + 4
    )
})

it(() => {
    for (let i = 0; i < GREGORIAN_JULIAN_PAIRS.length; i += 1) {
        const [[g0Y, g0M, g0D], _, [g1Y, g1M, g1D]] = GREGORIAN_JULIAN_PAIRS[i]

        if (g0Y !== g1Y || g0M !== g1M || g0D !== g1D) {
            continue
        }

        const date = new Date(Date.UTC(g0Y, g0M - 1, g0D))

        const g0YMD = Time.G0.ymd(g0Y, g0M, g0D);
        const g1YMD = Time.G1.ymd(g1Y, g1M, g1D);

        const dateWeekday = Time.weekFromDate(date);
        const g0Weekday = Time.gregorian0DayOfWeek(g0YMD);
        const g1Weekday = Time.gregorian1DayOfWeek(g1YMD);

        assert(
            dateWeekday === g0Weekday,
            "mismatched with date-based day of the week for " + [g1Y, g1M, g1D] + ": " + dateWeekday + " !== " + g0Weekday
        )

        assert(
            g0Weekday === g1Weekday,
            "mismatched with G0YMD-based day of the week for " + [g1Y, g1M, g1D] + ": " + g0Weekday + " !== " + g1Weekday
        )
    }
})

it(() => {
    const expecteds = [
        [0],
        [1],
        [1, 0],
        [1, 1],
        [2, 0],
        [2, 1],
        [1, 0, 0],
        [1, 0, 1],
        [1, 1, 0],
        [1, 1, 1],
        [1, 2, 0],
        [1, 2, 1],
        [2, 0, 0],
        [2, 0, 1],
        [2, 1, 0],
        [2, 1, 1],
        [2, 2, 0],
        [2, 2, 1],
        [3, 0, 0],
        [3, 0, 1],
        [3, 1, 0],
        [3, 1, 1],
        [3, 2, 0],
        [3, 2, 1],
        [1, 0, 0, 0],
    ]

    for (let i = 0; i < expecteds.length; i += 1) {
        const actual = FactorialBase.of(i)
        const expected = expecteds[i]
        assert(arrayEqual(actual, expected), `${i} in base factorial should be "${expected}" not "${actual}"`)
    }
})

// test runner
for (const test of allTests) {
    test()
}

console.log(performance.now() - scriptStart, "ms")
