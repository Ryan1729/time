const fs = require('fs');

eval(fs.readFileSync('./time.js')+'')

// assertion framework
const assert = (bool, message) => {
    if (bool) {
        return
    }

    throw new Error(message || "Assertion failed")
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

// test runner
for (const test of allTests) {
    test()
}
