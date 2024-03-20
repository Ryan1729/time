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

// tests
it(() => {
    const date = new Date(1700000000000)
    for (let kind = Time.GREGORIAN; kind < Time.CALENDAR_KIND_COUNT; kind += 1) {
        const specs = Time.calculateCalendarSpecs(kind, date)
        // We mostly care that we got here without throwing an error
        // but if we can think of better asserts that are easy to write
        // then we shoudl write them!
        assert(specs.length > 0, "Specs was empty!")
    }
})

// test runner
for (const test of allTests) {
    test()
}
