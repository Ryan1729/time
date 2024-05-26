const fs = require('fs');

eval(fs.readFileSync('./time.js')+'')
eval(fs.readFileSync('./factorialBase.js')+'')

// assertion framework
const assert = (bool, message) => {
    if (bool) {
        return
    }

    throw new Error(message || "Assertion failed")
}

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

// test framework
let allTests = []
const it = (test) => allTests.push(test)
const skipit = (test) => {}

// test helper
const range = (start, end) => {
    let output = []
    let i = 0
    for (let current = start; current < end; current += 1) {
        output[i] = current
        i += 1;
    }
    return output
}

// tests
it(() => {
    const date = new Date(1700000000000)
    for (let kind = Time.GREGORIAN; kind < Time.CALENDAR_KIND_COUNT; kind += 1) {
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

    // 1972 is a leap year
    for (let year = 1971; year <= 1972; year += 1) {
        const expected = allExpected[year - 1971]

        for (let zeroIndexedMonthNumber = 0; zeroIndexedMonthNumber <= 13; zeroIndexedMonthNumber += 1) {
            const zeroIndexedFirstDayOfYearInMonth = Time.ifcZeroIndexedMonthToZeroIndexedFirstDayOfYearInMonth({
                zeroIndexedMonthNumber,
                year,
            })

            assert(zeroIndexedFirstDayOfYearInMonth === expected[zeroIndexedMonthNumber], "zeroIndexedFirstDayOfYearInMonth did not match: " + zeroIndexedFirstDayOfYearInMonth + " != " + expected[zeroIndexedMonthNumber])
        }
    }
})

it(() => {
    // 1972 is a leap year
    const jan1G = new Date(1972, 0, 1)

    const startOfJune = new Date(Time.gregorianLinkedTimeFromDayOfMonth(jan1G, 5, 1))
    const startOfJuly = new Date(Time.gregorianLinkedTimeFromDayOfMonth(jan1G, 6, 1))

    const shouldBeStartOfJulyTime = Time.gregorianLinkedTimeFromDayOfMonth(startOfJune, 1, 1)

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

const getDateForUTCYMD = (year, oneIndexedMonth, day) => {
    const output = new Date(0);
    output.setUTCFullYear(year)
    output.setUTCMonth(oneIndexedMonth - 1)
    output.setUTCDate(day)
    return output
}

DEBUG_MODE = false

it(() => {
    const inputOutputPairs = [
        // (Using leading zeroes to line things up works for 0 to 9,
        // even though 010 is interpreted as octal.)
        // Input         Output
        [[1900, 02, 28, -12], [1900, 02, 16]],
        [[1900, 02, 13, -12], [1900, 02, 01]],
        [[1900, 02, 13, -13], [1900, 01, 31]],
        [[1900, 03, 01, -01], [1900, 02, 29]], // Julian so yes leap year
        [[1900, 05, 01, -01], [1900, 04, 30]],
        [[1900, 01, 01, -01], [1899, 12, 31]],
        [[1900, 01, 01, 366], [1901, 01, 01]],
        [[1901, 01, 01, 365], [1902, 01, 01]],
        [[1900, 01, 01, 731], [1902, 01, 01]],
        [[1900, 01, 01, 400], [1901, 02, 04]] // 400 = 366 + 31 + 3
    ]
    for (let i = 0; i < inputOutputPairs.length; i += 1) {
        const [[inY, inM, inD, daysOffset], [outY, outM, outD]] = inputOutputPairs[i];

        (() => {
            const {year, month, dayOfMonth} = Time.rollJulianYMDByDays({year: inY, month: inM, dayOfMonth: inD}, daysOffset)
            assert(
                year === outY && month === outM && dayOfMonth === outD,
                "rollJulianYMDByDays mismatch for " + [inY, inM, inD] + ", expected " + [outY, outM, outD] + " got " + [year, month, dayOfMonth]
            )
        })();
        
        (() => {
            const {year, month, dayOfMonth} = Time.rollJulianYMDByDays({year: outY, month: outM, dayOfMonth: outD}, -daysOffset)
            assert(
                year === inY && month === inM && dayOfMonth === inD,
                "rollJulianYMDByDays reverse mismatch for " + [outY, outM, outD] + ", expected " + [inY, inM, inD] + " got " + [year, month, dayOfMonth]
            )
        })();
    }
})

it(() => {
    const inputOutputPairs = [
        // (Using leading zeroes to line things up works for 0 to 9,
        // even though 010 is interpreted as octal.)
        // Input         Output
        [[1900, 02, 28], [1900, 02, 16]],
        [[1900, 03, 01], [1900, 02, 17]],
        [[1900, 03, 12], [1900, 02, 28]],
        [[1900, 03, 13], [1900, 02, 29]],
        [[1900, 03, 14], [1900, 03, 01]],
        [[1900, 03, 15], [1900, 03, 02]],
        [[1900, 03, 16], [1900, 03, 03]],
        [[1900, 03, 17], [1900, 03, 04]],
        [[1900, 03, 18], [1900, 03, 05]],
        [[1900, 03, 28], [1900, 03, 15]],
        [[1900, 03, 29], [1900, 03, 16]],
        [[1900, 03, 30], [1900, 03, 17]],
        [[1900, 03, 31], [1900, 03, 18]],
        [[1900, 04, 01], [1900, 03, 19]],
        [[1900, 04, 02], [1900, 03, 20]],
        [[1900, 04, 12], [1900, 03, 30]],
        [[1900, 04, 13], [1900, 03, 31]],
        [[1900, 04, 14], [1900, 04, 01]],
        [[2100, 02, 28], [2100, 02, 15]],
        [[2100, 03, 01], [2100, 02, 16]],
        [[2100, 03, 13], [2100, 02, 28]],
        [[2100, 03, 14], [2100, 02, 29]],
    ]
    for (let i = 0; i < inputOutputPairs.length; i += 1) {
        const [[inY, inM, inD], [outY, outM, outD]] = inputOutputPairs[i]

        const {year, month, dayOfMonth} = Time.julianYMD(getDateForUTCYMD(inY, inM, inD))
        assert(
            year === outY && month === outM && dayOfMonth === outD,
            "mismatch for " + [inY, inM, inD] + ", expected " + [outY, outM, outD] + " got " + [year, month, dayOfMonth]
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
