var Time = (function () {
    "use strict";

    /** @typedef {0|1|2} CalendarKind */

    /** @type {CalendarKind} */
    const GREGORIAN0 = 0
    /** @type {CalendarKind} */
    const INTERNATIONAL_FIXED = 1
    /** @type {CalendarKind} */
    const JULIAN0 = 2
    const CALENDAR_KIND_COUNT = 3

    const GREGORIAN0_MONTH_FORMATTER = new Intl.DateTimeFormat('default', { month: 'long' });

    /** @typedef {-1|0|1} Max1Delta */

    /** @type {Max1Delta} */
    const PREVIOUS = -1
    /** @type {Max1Delta} */
    const CURRENT = 0
    /** @type {Max1Delta} */
    const NEXT = 1

    /** @typedef {0|1|2|3|4|5|6} DayOfWeek */

    const DAYS_IN_WEEK = 7

    const IFC_NORMAL_DAYS_PER_MONTH = 28
    const IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR = (6 * IFC_NORMAL_DAYS_PER_MONTH)


    /** @typedef {0|1|2} CalendarAppearance */
    const DEFAULT_APPEARANCE = 0
    const HIDE_WEEK_ROW = 1
    const LAST_DAY_OUTSIDE_WEEK = 2

    // Some of these units exceed the integer precision of double precision floating point
    const SECOND_IN_MILLIS = 1000
    const MINUTE_IN_MILLIS = 60 * SECOND_IN_MILLIS
    const HOUR_IN_MILLIS = 60 * MINUTE_IN_MILLIS
    const DAY_IN_MILLIS = 24 * HOUR_IN_MILLIS
    const WEEK_IN_MILLIS = DAYS_IN_WEEK * DAY_IN_MILLIS
    const SI_YEAR_IN_MILLIS = 365.25 * DAY_IN_MILLIS
    const SI_MILLIENUM_IN_MILLIS = 1000 * SI_YEAR_IN_MILLIS
    const SI_MEGAANNUM_IN_MILLIS = 1000 * SI_MILLIENUM_IN_MILLIS
    const SI_GIGAANNUM_IN_MILLIS = 1000 * SI_MEGAANNUM_IN_MILLIS
    const SI_TERAANNUM_IN_MILLIS = 1000 * SI_GIGAANNUM_IN_MILLIS
    const SI_PETAANNUM_IN_MILLIS = 1000 * SI_TERAANNUM_IN_MILLIS
    const SI_EXAANNUM_IN_MILLIS = 1000 * SI_PETAANNUM_IN_MILLIS
    const SI_ZETAANNUM_IN_MILLIS = 1000 * SI_EXAANNUM_IN_MILLIS
    const SI_YOTTAANNUM_IN_MILLIS = 1000 * SI_ZETAANNUM_IN_MILLIS

    const IFC_ZERO_INDEXED_LEAP_MONTH = 5
    const IFC_ZERO_INDEXED_YEAR_DAY_MONTH = 13


    /** @typedef {number} Integer */
    /** @typedef {1|2|3|4|5|6|7|8|9|10|11|12} Month */
    /** @typedef {1|2|3|4|5|6|7|8|9|10|11|12|13|14|15|16|17|18|19|20|21|21|22|23|24|25|26|27|28|29|30|31} DayOfMonth */

    /** @typedef {0|1|2|3|4|5|6|7|8|9|10|11} ZeroIndexedMonth */
    /** @typedef {0|1|2|3|4|5|6|7|8|9|10|11|12|IFC_ZERO_INDEXED_YEAR_DAY_MONTH} ZeroIndexedIFCMonth */


    /** @typedef {28|29|30|31} LengthOfMonth */

    /** @typedef {Integer} Days */
    /** @typedef {Integer} G0Year */
    /** @typedef {Integer} J0Year */
    /** @typedef {Integer} IFCYear */
    /** @typedef {Integer} ZeroIndexedDayOfYear */
    /** @typedef {Integer} JulianDaysSinceJulianEpoch */

    /** @typedef {Exclude<Integer, 0>} NonZeroInteger */

    // Hopefully this will be enough in practice
    /** @typedef {Exclude<Exclude<Exclude<Integer, 0>, -0>, -1>} PositiveInteger */

    /** @typedef {PositiveInteger} DayOfYear */
    

    /** @typedef {{g0Year: Integer, g0Month: Month, g0DayOfMonth: DayOfMonth}} G0YMD */

    const G0 = {
        /** @type {(g0Year: Integer, g0Month: Month, g0DayOfMonth: DayOfMonth) => G0YMD} */
        ymd: (g0Year, g0Month, g0DayOfMonth) => (
            {g0Year, g0Month, g0DayOfMonth}
        )
    }

    /** @typedef {{g1Year: NonZeroInteger, g1Month: Month, g1DayOfMonth: DayOfMonth}} G1YMD */

    const G1 = {
        /** @type {(g1Year: NonZeroInteger, g1Month: Month, g1DayOfMonth: DayOfMonth) => G1YMD} */
        ymd: (g1Year, g1Month, g1DayOfMonth) => (
            {g1Year, g1Month, g1DayOfMonth}
        )
    }

    /** @typedef {{j0Year: Integer, j0Month: Month, j0DayOfMonth: DayOfMonth}} J0YMD */

    const J0 = {
        /** @type {(j0Year: Integer, j0Month: Month, j0DayOfMonth: DayOfMonth) => J0YMD} */
        ymd: (j0Year, j0Month, j0DayOfMonth) => (
            {j0Year, j0Month, j0DayOfMonth}
        )
    }

    /** @typedef {{j1Year: NonZeroInteger, j1Month: Month, j1DayOfMonth: DayOfMonth}} J1YMD */

    const J1 = {
        /** @type {(j1Year: NonZeroInteger, j1Month: Month, j1DayOfMonth: DayOfMonth) => J1YMD} */
        ymd: (j1Year, j1Month, j1DayOfMonth) => (
            {j1Year, j1Month, j1DayOfMonth}
        )
    }

    /** @typedef {number} Time */
    /** @typedef {{dayOfMonth: DayOfMonth, lastDateOfPreviousMonth: DayOfMonth, dayOfWeekOfLastOfPrevious: DayOfWeek, lastDateOfCurrentMonth: DayOfMonth, dayOfWeekOfFirstOfCurrent: DayOfWeek, dayOfWeekOfFirstOfNext: DayOfWeek, maxBoxesPerPage: Integer, monthText: string, appearance: CalendarAppearance}} CalendarBounds */
    /** @typedef {Max1Delta} MonthDelta */
    /** @typedef {{ 
     * date: Date, 
     * pageBounds: () => CalendarBounds, 
     * linkedTimeFromDayOfMonth: (monthDelta: MonthDelta, dayOfMonth: DayOfMonth) => Time 
     * }} BoundsProvider */

    /** @type {(kind: CalendarKind, date: Date) => CalendarSpecs} */
    const calculateCalendarSpecs = (kind, date) => {
        /** @type {BoundsProvider} */
        let boundsProvider;
        switch (kind) {
            default:
                console.error("Invalid calendar kind: " + kind)
            case GREGORIAN0:
                boundsProvider = {
                    date,
                    pageBounds() {
                        const date = this.date

                        const year = date.getUTCFullYear()
                        const month = date.getUTCMonth()
                        const dayOfMonth = date.getUTCDate()

                        const firstOfCurrentMonth = new Date(year, month, 1)

                        // Using just `date` instead of firstOfCurrentMonth has timezone issues.
                        const monthText = GREGORIAN0_MONTH_FORMATTER.format(firstOfCurrentMonth)

                        const lastOfPreviousMonth = new Date(year, month, 0)

                        const lastDateOfPreviousMonth = lastOfPreviousMonth.getUTCDate()
                        const dayOfWeekOfLastOfPrevious = lastOfPreviousMonth.getUTCDay()
                        const lastDateOfCurrentMonth = new Date(year, month + 1, 0).getUTCDate()
                        const dayOfWeekOfFirstOfCurrent = firstOfCurrentMonth.getUTCDay()
                        const dayOfWeekOfFirstOfNext = new Date(year, month + 1, 1).getUTCDay()

                        return {
                            dayOfMonth: /** @type DayOfMonth */ (dayOfMonth),
                            lastDateOfPreviousMonth: /** @type DayOfMonth */ (lastDateOfPreviousMonth),
                            dayOfWeekOfLastOfPrevious: /** @type DayOfWeek */ (dayOfWeekOfLastOfPrevious),
                            lastDateOfCurrentMonth:  /** @type DayOfMonth */ (lastDateOfCurrentMonth),
                            dayOfWeekOfFirstOfCurrent: /** @type DayOfWeek */ (dayOfWeekOfFirstOfCurrent),
                            dayOfWeekOfFirstOfNext: /** @type DayOfWeek */ (dayOfWeekOfFirstOfNext),
                            maxBoxesPerPage: 42,
                            monthText,
                            appearance: DEFAULT_APPEARANCE,
                        };
                    },
                    linkedTimeFromDayOfMonth(monthDelta, dayOfMonth) {
                        return gregorianLinkedTimeFromDayOfMonth(this.date, monthDelta, dayOfMonth)
                    }
                }
            break
            case INTERNATIONAL_FIXED:
                boundsProvider = {
                    date,
                    pageBounds() {
                        const date = this.date

                        const {
                            zeroIndexedMonthNumber,
                            dayOfMonth,
                        } = ifcZeroIndexedMonthAndDay(date)

                        let monthText
                        switch (zeroIndexedMonthNumber) {
                            default:
                                console.error("Unknown Month for: " + zeroIndexedMonthNumber)
                                // fallthrough
                            case 0:
                                monthText = "January"
                            break
                            case 1:
                                monthText = "February"
                            break
                            case 2:
                                monthText = "March"
                            break
                            case 3:
                                monthText = "April"
                            break
                            case 4:
                                monthText = "May"
                            break
                            case IFC_ZERO_INDEXED_LEAP_MONTH:
                                monthText = "June"
                            break
                            case 6:
                                monthText = "Sol"
                            break
                            case 7:
                                monthText = "July"
                            break
                            case 8:
                                monthText = "August"
                            break
                            case 9:
                                monthText = "September"
                            break
                            case 10:
                                monthText = "October"
                            break
                            case 11:
                                monthText = "November"
                            break
                            case 12:
                                monthText = "December"
                            break
                            case IFC_ZERO_INDEXED_YEAR_DAY_MONTH:
                                monthText = "Year Day"
                            break
                        }

                        const year = date.getUTCFullYear()

                        const isLeap = isGregorian0LeapYear(year)

                        const lastDateOfPreviousMonth =
                            (isLeap && zeroIndexedMonthNumber === (IFC_ZERO_INDEXED_LEAP_MONTH + 1))
                            ? IFC_NORMAL_DAYS_PER_MONTH + 1
                            : IFC_NORMAL_DAYS_PER_MONTH
                        // Always start the months on a sunday, even if
                        // there was a leap day.
                        const dayOfWeekOfLastOfPrevious = 6
                        const lastDateOfCurrentMonth =
                            zeroIndexedMonthNumber === IFC_ZERO_INDEXED_YEAR_DAY_MONTH
                                ? 1
                                : (isLeap && zeroIndexedMonthNumber === IFC_ZERO_INDEXED_LEAP_MONTH)
                                    ? IFC_NORMAL_DAYS_PER_MONTH + 1
                                    : IFC_NORMAL_DAYS_PER_MONTH

                        const appearance =
                            zeroIndexedMonthNumber === IFC_ZERO_INDEXED_YEAR_DAY_MONTH
                                ? HIDE_WEEK_ROW
                                : (isLeap && zeroIndexedMonthNumber === IFC_ZERO_INDEXED_LEAP_MONTH)
                                    ? LAST_DAY_OUTSIDE_WEEK
                                    : DEFAULT_APPEARANCE

                        const dayOfWeekOfFirstOfCurrent = 0
                        // Set to after DAYS in week to preventloop.
                        // TODO signal in a less coupled way
                        const dayOfWeekOfFirstOfNext = DAYS_IN_WEEK + 1

                        return {
                            dayOfMonth: /** @type DayOfMonth */ (dayOfMonth),
                            lastDateOfPreviousMonth: /** @type DayOfMonth */ (lastDateOfPreviousMonth),
                            dayOfWeekOfLastOfPrevious: /** @type DayOfWeek */ (dayOfWeekOfLastOfPrevious),
                            lastDateOfCurrentMonth:  /** @type DayOfMonth */ (lastDateOfCurrentMonth),
                            dayOfWeekOfFirstOfCurrent: /** @type DayOfWeek */ (dayOfWeekOfFirstOfCurrent),
                            dayOfWeekOfFirstOfNext: /** @type DayOfWeek */ (dayOfWeekOfFirstOfNext),
                            maxBoxesPerPage: lastDateOfCurrentMonth,
                            monthText,
                            appearance,
                        };
                    },
                    linkedTimeFromDayOfMonth(monthDelta, dayOfMonth) {
                        return ifcLinkedTimeFromDayOfMonth(this.date, monthDelta, dayOfMonth)
                    },
                }
            break
            case JULIAN0:
                boundsProvider = {
                    date,
                    pageBounds() {
                        const date = this.date

                        const ymd = julian0YMD(date)

                        const firstOfCurrentMonth = new Date(ymd.j0Year, ymd.j0Month - 1, 1)
                        // Using just `date` instead of firstOfCurrentMonth has timezone issues.
                        const monthText = GREGORIAN0_MONTH_FORMATTER.format(firstOfCurrentMonth)

                        const lastOfPreviousMonthYmd = rollJulian0YMDByDays(ymd, -ymd.j0DayOfMonth)

                        const lastDateOfPreviousMonth = lastOfPreviousMonthYmd.j0DayOfMonth
                        const dayOfWeekOfLastOfPrevious = julian0DayOfWeek(lastOfPreviousMonthYmd)
                        const lastDateOfCurrentMonth = julianOneIndexedMonthLength({year: ymd.j0Year, month: ymd.j0Month})
                        const dayOfWeekOfFirstOfCurrent = julian0DayOfWeek({...ymd, j0DayOfMonth: 1})
                        const dayOfWeekOfFirstOfNext = julian0DayOfWeek(rollJulian0YMDByDays(ymd, lastDateOfCurrentMonth - ymd.j0DayOfMonth + 1))

                        return {
                            dayOfMonth: ymd.j0DayOfMonth,
                            lastDateOfPreviousMonth,
                            dayOfWeekOfLastOfPrevious,
                            lastDateOfCurrentMonth,
                            dayOfWeekOfFirstOfCurrent,
                            dayOfWeekOfFirstOfNext,
                            maxBoxesPerPage: 42,
                            monthText,
                            appearance: DEFAULT_APPEARANCE,
                        };
                    },
                    linkedTimeFromDayOfMonth(monthDelta, dayOfMonth) {
                        return julianLinkedTimeFromDayOfMonth(this.date, monthDelta, dayOfMonth)
                    }
                }
            break
        }

        return calculateCalendarSpecsInner(boundsProvider)
    }

    /** @type {(year: Integer) => boolean} */
    const isGregorian0LeapYear = (year) => {
        // The rule is, it is a leap year if it is a multiple of 4,
        // and not a multiple 100, unless it is a multiple of 400,
        // in which case it is a leap year.

        // ANDing by one less than a power of two produces 0 for
        // multiples of the given power of two and a non zero number
        // otherwise

        // Not a multple of 4, definitely not a leap year.
        if (year & 3) {
            return false
        }

        // 100 is 4 * 25.
        // Multiple of 100. Leap year only if a multiple of 400
        if (year % 25 === 0) {
            // 400 is 16 * 25.
            if (year & 15) {
                // Not a multiple of 400; non-leap year.
                return false
            } else {
                // Is a multiple of 400; leap year.
                return true
            }
        }

        // Not a multiple of 100; leap year.
        return true
    };

    /** @type {(year: Integer) => boolean} */
    const isJulian0LeapYear = (year) => {
        // If it is a multiple of 4 it is always a Julian leap year
        return (year & 3) === 0
    }

    /** @typedef {DayOfWeek} JulianDayOfWeek */

    /** @type {(j0YMD: J0YMD) => JulianDayOfWeek} */
    const julian0DayOfWeek = (j0YMD) => {
        let n = Math.floor(julian0YMDToJulianDaysSinceJulianEpoch(j0YMD))

        // Map it to a positive number with the same modulous
        // by adding a number we know is large enough, and is
        // 0 after modding
        if (n < 0) {
            n += (-n) * DAYS_IN_WEEK
        }
        // JD 0 is a Monday, so JD -1 is a Sunday, so shift forward one
        return /** @type {JulianDayOfWeek} */ ((n + 1) % DAYS_IN_WEEK)
    }
    
    /** @type {(n: Integer, modBy: Integer) => Integer} */
    const betterMod = (n, modBy) => {
        // Map it to a positive number with the same modulous
        // by adding a number we know is large enough, and is
        // 0 after modding
        if (n < 0) {
            n += (-n) * modBy
        }
        return n % modBy
    }

    /** @type {(j0YMD: J0YMD, offsetInDays: Days) => J0YMD} */
    const rollJulian0YMDByDays = ({j0Year, j0Month, j0DayOfMonth}, offsetInDays) => {
        let currentMonthLength = julianOneIndexedMonthLength({year: j0Year, month: j0Month})

        let outYear = j0Year
        let outMonth = j0Month
        let outDayOfMonth = j0DayOfMonth + offsetInDays

        // TODO skip over years at once so we don't need to loop so
        // many times
        while (outDayOfMonth > currentMonthLength) {
            outDayOfMonth -= currentMonthLength;

            outMonth += 1;
            // We know outMonth is 2 to 13 now assuming outMonth was 1 to 12
            if (outMonth > 12) {
                outYear += 1;
                outMonth = 1;
            }
            // We know outMonth is 1 to 12 now, given previous assumptions

            currentMonthLength = julianOneIndexedMonthLength({year: outYear, month: /** @type Month */ (outMonth)})
        }

        // TODO skip over years at once so we don't need to loop so
        // many times
        while (outDayOfMonth < 1) {
            // We know outMonth is 0 to 11 now assuming outMonth was 1 to 12
            outMonth -= 1;
            if (outMonth < 1) {
                outYear -= 1;
                outMonth = 12;
            }
            // We know outMonth is 1 to 12 now, given previous assumptions
            currentMonthLength = julianOneIndexedMonthLength({year: outYear, month: /** @type Month */ (outMonth)})
            outDayOfMonth += currentMonthLength;
        }

        return J0.ymd(
            outYear,
            outMonth,
            /** @type {DayOfMonth} */ (outDayOfMonth),
        )
    }

    // TODO This is apparently slower than doing calculations as in
    // rollJulian0YMDByDays, so eventaully make it more like that
    // function if this gets used enough for that to matter
    /** @type {(g0YMD: G0YMD, offsetInDays: Days) => G0YMD} */
    const rollGregorian0YMDByDays = ({g0Year: year, g0Month: month, g0DayOfMonth: dayOfMonth}, offsetInDays) => {
        const output = new Date(0);
        output.setUTCFullYear(year)
        output.setUTCMonth(month - 1)
        output.setUTCDate(dayOfMonth + offsetInDays)

        return G0.ymd(
            output.getUTCFullYear(),
            /** @type {Month} */ (output.getUTCMonth() + 1),
            /** @type {DayOfMonth} */ (output.getUTCDate()),
        )
    }

    /*
    // Year Month Day Less-Than
    const ymdLt = (a, b) => {
        const yearDiff = a.year - b.year
        if (yearDiff !== 0) {
            return yearDiff < 0
        }

        const monthDiff = a.month - b.month
        if (monthDiff !== 0) {
            return monthDiff < 0
        }

        const dayOfMonthDiff = a.dayOfMonth - b.dayOfMonth
        return dayOfMonthDiff < 0
    }
    */

    /** @type {(j0YMD: J0YMD) => Days} */
    const gregorian0DaysDifferenceFromJulian0YMD = (j0YMD) => {
        const daysSinceJulianEpoch = julian0YMDToJulianDaysSinceJulianEpoch(j0YMD)
        const {j0Year: year, j0Month: month, j0DayOfMonth: dayOfMonth} = j0YMD

        const K = 1830690.5
        // The ymd at K
        let prospectiveJulianYear = 300;
        let prospectiveJulianMonth = 2;
        let prospectiveJulianDayOfMonth = 28;
        let prospectiveGregorianYear = 300;
        let prospectiveGregorianMonth = 2;
        let prospectiveGregorianDayOfMonth = 28;

        const MONTH_LENGTHS = [
            31,
            0,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ]

        /** @type {(offsetInDays: Days) => void} */
        const rollGregorian0YMDByDaysMutating = (offsetInDays) => {
            let currentMonthLength = MONTH_LENGTHS[prospectiveGregorianMonth - 1] || (((prospectiveGregorianYear & 3) === 0) ? 29 : 28);

            prospectiveGregorianDayOfMonth += offsetInDays

            // TODO skip over years at once so we don't need to loop so
            // many times
            while (prospectiveGregorianDayOfMonth > currentMonthLength) {
                prospectiveGregorianDayOfMonth -= currentMonthLength;
                prospectiveGregorianMonth += 1;
                if (prospectiveGregorianMonth > 12) {
                    prospectiveGregorianYear += 1;
                    prospectiveGregorianMonth -= 12;
                }
                currentMonthLength = MONTH_LENGTHS[prospectiveGregorianMonth - 1] || (((prospectiveGregorianYear & 3) === 0) ? 29 : 28)
            }

            // TODO skip over years at once so we don't need to loop so
            // many times
            while (prospectiveGregorianDayOfMonth < 1) {
                prospectiveGregorianMonth -= 1;
                if (prospectiveGregorianMonth < 1) {
                    prospectiveGregorianYear -= 1;
                    prospectiveGregorianMonth = 12;
                }
                prospectiveGregorianDayOfMonth += MONTH_LENGTHS[prospectiveGregorianMonth - 1] || (((prospectiveGregorianYear & 3) === 0) ? 29 : 28);
            }
        }

        /** @type {(offsetInDays: Days) => void} */
        const rollJulian0YMDByDaysMutating = (offsetInDays) => {
            let currentMonthLength = MONTH_LENGTHS[prospectiveJulianMonth - 1]
                || (((prospectiveJulianYear & 3) || ((prospectiveJulianYear & 15) !== 0 && (prospectiveJulianYear % 25 === 0))) ? 28 : 29);

            prospectiveJulianDayOfMonth += offsetInDays

            // TODO skip over years at once so we don't need to loop so
            // many times
            while (prospectiveJulianDayOfMonth > currentMonthLength) {
                prospectiveJulianDayOfMonth -= currentMonthLength;
                prospectiveJulianMonth += 1;
                if (prospectiveJulianMonth > 12) {
                    prospectiveJulianYear += 1;
                    prospectiveJulianMonth -= 12;
                }
                currentMonthLength = MONTH_LENGTHS[prospectiveJulianMonth - 1]
                    || (((prospectiveJulianYear & 3) || ((prospectiveJulianYear & 15) !== 0 && (prospectiveJulianYear % 25 === 0))) ? 28 : 29);
            }

            // TODO skip over years at once so we don't need to loop so
            // many times
            while (prospectiveJulianDayOfMonth < 1) {
                prospectiveJulianMonth -= 1;
                if (prospectiveJulianMonth < 1) {
                    prospectiveJulianYear -= 1;
                    prospectiveJulianMonth = 12;
                }
                prospectiveJulianDayOfMonth += MONTH_LENGTHS[prospectiveJulianMonth - 1]
                    || (((prospectiveJulianYear & 3) || ((prospectiveJulianYear & 15) !== 0 && (prospectiveJulianYear % 25 === 0))) ? 28 : 29);
            }
        }

        let difference = 0

        if (daysSinceJulianEpoch >= K) {
            while (1) {
                const yearDiff = year - prospectiveJulianYear
                const monthDiff = month - prospectiveJulianMonth

                if (
                    // is prospectiveJulian date less than target
                    (yearDiff < 0) || yearDiff === 0 && ((monthDiff < 0) || ((monthDiff === 0) && ((dayOfMonth - prospectiveJulianDayOfMonth) < 0)))
                ) {
                    break
                }

                difference += (
                    ((prospectiveGregorianYear & 3) === 0)
                    && ((prospectiveJulianYear & 3) || ((prospectiveJulianYear & 15) !== 0 && (prospectiveJulianYear % 25 === 0)))
                    && (prospectiveJulianMonth === 3 && prospectiveJulianDayOfMonth === 1)
                ) ? 1 : 0

                // Significatly faster than counting every single day.
                const modulous = prospectiveGregorianYear % 100
                let offset;
                if (modulous > 0 && modulous < 99) {
                    offset = 365 * (100 - modulous)
                } else {
                    offset = prospectiveGregorianMonth === 3 ? 270 : 1
                }

                rollGregorian0YMDByDaysMutating(offset);
                rollJulian0YMDByDaysMutating(offset);
            }
        } else {
            while (1) {
                const yearDiff = year - prospectiveGregorianYear
                const monthDiff = month - prospectiveGregorianMonth

                if (
                    // is prospectiveGregorian date greater than or equal to target
                    (yearDiff > 0) || yearDiff === 0 && ((monthDiff > 0) || ((monthDiff === 0) && ((dayOfMonth - prospectiveGregorianDayOfMonth) >= 0)))
                ) {
                    break
                }

                // Significatly faster than counting every single day.
                const modulous = prospectiveGregorianYear % 100
                let offset;
                if (modulous > 0 && modulous < 99) {
                    offset = 365 * -modulous
                } else if (modulous > -99 && modulous < -0) {
                    offset = 365 * -(100 + modulous)
                } else {
                    offset = prospectiveGregorianMonth === 1 ? -270 : -1
                }

                rollGregorian0YMDByDaysMutating(offset);
                rollJulian0YMDByDaysMutating(offset);

                difference -= (
                    ((prospectiveGregorianYear & 3) === 0)
                    && ((prospectiveJulianYear & 3) || ((prospectiveJulianYear & 15) !== 0 && (prospectiveJulianYear % 25 === 0)))
                    && (prospectiveGregorianMonth === 2 && prospectiveGregorianDayOfMonth === 29)
                ) ? 1 : 0
            }
        }

        return difference
    }

    /** @type {(g0Ymd: G0YMD) => Days} */
    const julian0DaysDifferenceFromGregorian0YMD = (g0Ymd) => {
        const {g0Year: year, g0Month: month, g0DayOfMonth: dayOfMonth} = g0Ymd

        const daysSinceJulianEpoch = gregorian0YMDToJulianDaysSinceJulianEpoch(g0Ymd)

        const K = 1830690.5
        // The ymd at K
        let prospectiveJulianYear = 300;
        let prospectiveJulianMonth = 2;
        let prospectiveJulianDayOfMonth = 28;
        let prospectiveGregorianYear = 300;
        let prospectiveGregorianMonth = 2;
        let prospectiveGregorianDayOfMonth = 28;

        const MONTH_LENGTHS = [
            31,
            0,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ]

        /** @type {(offsetInDays: Days) => void} */
        const rollJulian0YMDByDaysMutating = (offsetInDays) => {
            let currentMonthLength = MONTH_LENGTHS[prospectiveJulianMonth - 1] || (((prospectiveJulianYear & 3) === 0) ? 29 : 28);

            prospectiveJulianDayOfMonth += offsetInDays

            // TODO skip over years at once so we don't need to loop so
            // many times
            while (prospectiveJulianDayOfMonth > currentMonthLength) {
                prospectiveJulianDayOfMonth -= currentMonthLength;
                prospectiveJulianMonth += 1;
                if (prospectiveJulianMonth > 12) {
                    prospectiveJulianYear += 1;
                    prospectiveJulianMonth -= 12;
                }
                currentMonthLength = MONTH_LENGTHS[prospectiveJulianMonth - 1] || (((prospectiveJulianYear & 3) === 0) ? 29 : 28)
            }

            // TODO skip over years at once so we don't need to loop so
            // many times
            while (prospectiveJulianDayOfMonth < 1) {
                prospectiveJulianMonth -= 1;
                if (prospectiveJulianMonth < 1) {
                    prospectiveJulianYear -= 1;
                    prospectiveJulianMonth = 12;
                }
                prospectiveJulianDayOfMonth += MONTH_LENGTHS[prospectiveJulianMonth - 1] || (((prospectiveJulianYear & 3) === 0) ? 29 : 28);
            }
        }

        /** @type {(offsetInDays: Days) => void} */
        const rollGregorian0YMDByDaysMutating = (offsetInDays) => {
            let currentMonthLength = MONTH_LENGTHS[prospectiveGregorianMonth - 1]
                || (((prospectiveGregorianYear & 3) || ((prospectiveGregorianYear & 15) !== 0 && (prospectiveGregorianYear % 25 === 0))) ? 28 : 29);

            prospectiveGregorianDayOfMonth += offsetInDays

            // TODO skip over years at once so we don't need to loop so
            // many times
            while (prospectiveGregorianDayOfMonth > currentMonthLength) {
                prospectiveGregorianDayOfMonth -= currentMonthLength;
                prospectiveGregorianMonth += 1;
                if (prospectiveGregorianMonth > 12) {
                    prospectiveGregorianYear += 1;
                    prospectiveGregorianMonth -= 12;
                }
                currentMonthLength = MONTH_LENGTHS[prospectiveGregorianMonth - 1]
                    || (((prospectiveGregorianYear & 3) || ((prospectiveGregorianYear & 15) !== 0 && (prospectiveGregorianYear % 25 === 0))) ? 28 : 29);
            }

            // TODO skip over years at once so we don't need to loop so
            // many times
            while (prospectiveGregorianDayOfMonth < 1) {
                prospectiveGregorianMonth -= 1;
                if (prospectiveGregorianMonth < 1) {
                    prospectiveGregorianYear -= 1;
                    prospectiveGregorianMonth = 12;
                }
                prospectiveGregorianDayOfMonth += MONTH_LENGTHS[prospectiveGregorianMonth - 1]
                    || (((prospectiveGregorianYear & 3) || ((prospectiveGregorianYear & 15) !== 0 && (prospectiveGregorianYear % 25 === 0))) ? 28 : 29);
            }
        }

        let difference = 0

        if (daysSinceJulianEpoch >= K) {
            while (1) {
                const yearDiff = year - prospectiveGregorianYear
                const monthDiff = month - prospectiveGregorianMonth

                if (
                    // is prospectiveGregorian date less than target
                    (yearDiff < 0) || yearDiff === 0 && ((monthDiff < 0) || ((monthDiff === 0) && ((dayOfMonth - prospectiveGregorianDayOfMonth) < 0)))
                ) {
                    break
                }

                difference += (
                    ((prospectiveJulianYear & 3) === 0)
                    && ((prospectiveGregorianYear & 3) || ((prospectiveGregorianYear & 15) !== 0 && (prospectiveGregorianYear % 25 === 0)))
                    && (prospectiveGregorianMonth === 3 && prospectiveGregorianDayOfMonth === 1)
                ) ? 1 : 0

                // Significatly faster than counting every single day.
                const modulous = prospectiveJulianYear % 100
                let offset;
                if (modulous > 0 && modulous < 99) {
                    offset = 365 * (100 - modulous)
                } else {
                    offset = prospectiveJulianMonth === 3 ? 270 : 1
                }

                rollJulian0YMDByDaysMutating(offset);
                rollGregorian0YMDByDaysMutating(offset);
            }
        } else {
            while (1) {
                const yearDiff = year - prospectiveJulianYear
                const monthDiff = month - prospectiveJulianMonth

                if (
                    // is prospectiveJulian date greater than or equal to target
                    (yearDiff > 0) || yearDiff === 0 && ((monthDiff > 0) || ((monthDiff === 0) && ((dayOfMonth - prospectiveJulianDayOfMonth) >= 0)))
                ) {
                    break
                }

                // Significatly faster than counting every single day.
                const modulous = prospectiveJulianYear % 100
                let offset;
                if (modulous > 0 && modulous < 99) {
                    offset = 365 * -modulous
                } else if (modulous > -99 && modulous < -0) {
                    offset = 365 * -(100 + modulous)
                } else {
                    offset = prospectiveJulianMonth === 1 ? -270 : -1
                }

                rollJulian0YMDByDaysMutating(offset);
                rollGregorian0YMDByDaysMutating(offset);

                difference -= (
                    ((prospectiveJulianYear & 3) === 0)
                    && ((prospectiveGregorianYear & 3) || ((prospectiveGregorianYear & 15) !== 0 && (prospectiveGregorianYear % 25 === 0)))
                    && (prospectiveJulianMonth === 2 && prospectiveJulianDayOfMonth === 29)
                ) ? 1 : 0
            }
        }

        return difference
    }

    /** @type {(arg: {year: J0Year, month: Month}) => DayOfMonth} */
    const julianOneIndexedMonthLength = ({year, month}) => {
        /** @type {LengthOfMonth[]} */
        const MONTH_LENGTHS = [
            31,
            isJulian0LeapYear(year) ? 29 : 28,
            31,
            30,
            31,
            30,
            31,
            31,
            30,
            31,
            30,
            31,
        ]
        return MONTH_LENGTHS[month - 1]
    }

    /** @type {(date: Date) => J0YMD} */
    const julian0YMD = (date) => {
        const gYear = date.getUTCFullYear()
        const gMonth = date.getUTCMonth()
        const gDayOfMonth = date.getUTCDate()

        return gregorian0YMDToJulian0(G0.ymd(gYear, /** @type Month */ (gMonth + 1), /** @type DayOfMonth */ (gDayOfMonth)))
    }

    /** @type {(g0YMD: G0YMD) => J0YMD} */
    const gregorian0YMDToJulian0 = (g0YMD) => {
        let daysDifference = julian0DaysDifferenceFromGregorian0YMD(g0YMD)

        // Every Gregorian leap year is a Julian one as well
        return rollJulian0YMDByDays(J0.ymd(g0YMD.g0Year, g0YMD.g0Month, g0YMD.g0DayOfMonth), -daysDifference)
    }

    /** @type {(j0YMD: J0YMD) => G0YMD} */
    const julian0YMDToGregorian0 = (j0YMD) => {
        let daysDifference = gregorian0DaysDifferenceFromJulian0YMD(j0YMD)

        // Being dumb is often the first step to being smart
        /** @type {(j0YMD: J0YMD) => G0YMD} */
        const j0ToG0Dumb = ({j0Year, j0Month, j0DayOfMonth}) => {
            if (
                j0Month === 2
                && j0DayOfMonth === 29
                && isJulian0LeapYear(j0Year)
                && !isGregorian0LeapYear(j0Year)
            ) {
                return G0.ymd(j0Year, 3, 1)
            }
            return G0.ymd(j0Year, j0Month, j0DayOfMonth)
        }

        return rollGregorian0YMDByDays(j0ToG0Dumb(j0YMD), daysDifference)
    }

    /** @type {(date: Date) => Date} */
    const getStartOfYear = (date) => {
        const startOfYear = new Date(0);
        startOfYear.setUTCFullYear(date.getUTCFullYear())
        return startOfYear
    }

    /** @type {(date: Date) => Date} */
    const getGregorianOctoberFirst = (date) => {
        const output = new Date(0);
        output.setUTCFullYear(date.getUTCFullYear())
        output.setUTCMonth(10 - 1)
        output.setUTCDate(1)
        return output
    }

    /** @type {(date: Date) => ZeroIndexedDayOfYear} */
    const get0IndexedDayOfYear = (date) => {
        const startOfYear = getStartOfYear(date)

        return Math.floor(
            (
                date.getTime()
                - startOfYear.getTime()
            ) / DAY_IN_MILLIS
        )
    }

    /** @typedef {{ zeroIndexedMonthNumber: ZeroIndexedIFCMonth, dayOfMonth: DayOfMonth }} IFCZeroIndexedMonthAndDay */

    /** @type {(date: Date) => IFCZeroIndexedMonthAndDay} */
    const ifcZeroIndexedMonthAndDay = (date) => {
        const year = date.getUTCFullYear()
        const dayOfYear = get0IndexedDayOfYear(date)

        const isLeap = isGregorian0LeapYear(year)

        let dayOfYearArray
        if (isLeap) {
            dayOfYearArray = IFC_FIRST_DAY_OF_YEAR_IN_MONTH_FOR_LEAP_YEAR
        } else {
            dayOfYearArray = IFC_FIRST_DAY_OF_YEAR_IN_MONTH_NON_LEAP_YEAR
        }

        let monthIndex
        for (monthIndex = 0; monthIndex < dayOfYearArray.length; monthIndex += 1) {
            if (
                dayOfYear >= dayOfYearArray[monthIndex]
            &&  (
                    dayOfYearArray[monthIndex + 1] === undefined
                    || dayOfYear < dayOfYearArray[monthIndex + 1]
                )
            ) {
                break
            }
        }

        const dayOfMonth = /** @type DayOfMonth */ (dayOfYear - dayOfYearArray[monthIndex] + 1)

        return {
            zeroIndexedMonthNumber: /** @type ZeroIndexedIFCMonth */ (monthIndex),
            dayOfMonth,
        }
    }

    const IFC_MONTH_COUNT = 14;

    const IFC_FIRST_DAY_OF_YEAR_IN_MONTH_NON_LEAP_YEAR = [0,  28,  56,  84, 112, 140, 168, 196, 224, 252, 280, 308, 336, 364]
    const IFC_FIRST_DAY_OF_YEAR_IN_MONTH_FOR_LEAP_YEAR = [0,  28,  56,  84, 112, 140, 169, 197, 225, 253, 281, 309, 337, 365]

    /** @typedef {{ zeroIndexedMonthNumber: ZeroIndexedIFCMonth, year: IFCYear }} IFCZeroIndexedMonthAndYear */


    /** @type {(_: IFCZeroIndexedMonthAndYear) => DayOfYear} */
    const ifcZeroIndexedMonthToZeroIndexedFirstDayOfYearInMonth = ({
        zeroIndexedMonthNumber,
        year,
    }) => {
        const isLeap = isGregorian0LeapYear(year)

        return ((isLeap)
            ? IFC_FIRST_DAY_OF_YEAR_IN_MONTH_FOR_LEAP_YEAR[zeroIndexedMonthNumber]
            : IFC_FIRST_DAY_OF_YEAR_IN_MONTH_NON_LEAP_YEAR[zeroIndexedMonthNumber]
        ) || 0 // for the undefined case
    }

    /** @type {(date: Date, monthDelta: Integer, dayOfMonth: DayOfMonth) => Time} */
    const ifcLinkedTimeFromDayOfMonth = (date, monthDelta, dayOfMonth) => {
        const year = date.getUTCFullYear()

        const {
            zeroIndexedMonthNumber,
        } = ifcZeroIndexedMonthAndDay(date)

        const firstDayOfYearInMonth = ifcZeroIndexedMonthToZeroIndexedFirstDayOfYearInMonth({
            zeroIndexedMonthNumber: /** @type {ZeroIndexedIFCMonth} */ (betterMod(zeroIndexedMonthNumber + monthDelta, IFC_MONTH_COUNT)),
            year,
        })

        const targetDayOfYear = firstDayOfYearInMonth + (dayOfMonth - 1)

        const startOfYear = new Date(0);
        startOfYear.setUTCFullYear(year)

        return startOfYear.getTime() + (targetDayOfYear * DAY_IN_MILLIS)
    }

    /** @type {(date: Date, monthDelta: Integer, dayOfMonth: DayOfMonth) => Time} */
    const gregorianLinkedTimeFromDayOfMonth = (date, monthDelta, dayOfMonth) => {
        const startOfDay = new Date(0);
        startOfDay.setUTCFullYear(date.getUTCFullYear())
        startOfDay.setUTCMonth(date.getUTCMonth() + monthDelta)
        startOfDay.setUTCDate(dayOfMonth)

        return startOfDay.getTime()
    }

    /** @type {(date: Date, monthDelta: Integer, dayOfMonth: DayOfMonth) => Time} */
    const julianLinkedTimeFromDayOfMonth = (date, monthDelta, dayOfMonth) => {
        const oldYMD = julian0YMD(date)

        let newYMD = oldYMD
        switch (monthDelta) {
            case PREVIOUS:
                newYMD = rollJulian0YMDByDays(oldYMD, -oldYMD.j0DayOfMonth)
            break
            default:
                console.error("Unexpected monthDelta: " + monthDelta)
                // fallthrough
            case CURRENT:
            break
            case NEXT:
                newYMD = rollJulian0YMDByDays(oldYMD, julianOneIndexedMonthLength({year: oldYMD.j0Year, month: oldYMD.j0Month}) - oldYMD.j0DayOfMonth + 1)
            break
        }

        const g0YMD = julian0YMDToGregorian0({...newYMD, j0DayOfMonth: dayOfMonth})

        const startOfDay = new Date(0);
        startOfDay.setUTCFullYear(g0YMD.g0Year)
        startOfDay.setUTCMonth(g0YMD.g0Month - 1)
        startOfDay.setUTCDate(g0YMD.g0DayOfMonth)

        return startOfDay.getTime()
    }

    /** @typedef {0|1|2} BoxSpecKind */

    const OTHER_MONTH = 0
    const CURRENT_MONTH = 1
    const CURRENT_DAY = 2

    /** @typedef {{text: string|number, kind: BoxSpecKind, linkedTime: Integer}} BoxSpec */

    /** @typedef {BoxSpec[]} BoxSpecs */

    /** @typedef {{ monthText: string, boxSpecs: BoxSpecs, appearance: CalendarAppearance }} CalendarSpecs */

    /** @type {(boundsProvider: BoundsProvider) => CalendarSpecs} */
    const calculateCalendarSpecsInner = (boundsProvider) => {
        const {
            dayOfMonth,
            lastDateOfPreviousMonth,
            dayOfWeekOfLastOfPrevious,
            lastDateOfCurrentMonth,
            dayOfWeekOfFirstOfCurrent,
            dayOfWeekOfFirstOfNext,
            maxBoxesPerPage,
            monthText,
            appearance,
        } = boundsProvider.pageBounds()

        let calendarBoxSpecs = new Array(maxBoxesPerPage)
        let boxIndex = 0;

        const firstVisibleDateOfPreviousMonth = lastDateOfPreviousMonth - dayOfWeekOfLastOfPrevious

        for (let i = 0; i < dayOfWeekOfFirstOfCurrent; i += 1) {
            // This is only valid because weeks are smaller than months
            // So if that changes, revisit.
            const firstVisibleDayOfMonth = /** @type {DayOfMonth} */ (firstVisibleDateOfPreviousMonth + i)
            calendarBoxSpecs[boxIndex] = {
                text: firstVisibleDayOfMonth,
                kind: OTHER_MONTH,
                linkedTime: boundsProvider.linkedTimeFromDayOfMonth(PREVIOUS, firstVisibleDayOfMonth)
            }
            boxIndex += 1
        }

        for (let i = 1; i <= lastDateOfCurrentMonth; i += 1) {
            let kind
            if (i === dayOfMonth) {
                kind = CURRENT_DAY
            } else {
                kind = CURRENT_MONTH
            }

            calendarBoxSpecs[boxIndex] = {
                text: i,
                kind,
                linkedTime: boundsProvider.linkedTimeFromDayOfMonth(
                    CURRENT,
                    // Valid because i is known to be between 1 and lastDateOfCurrentMonth inclusive
                    /** @type {DayOfMonth} */(i)
                )
            }

            boxIndex += 1
        }

        let nextMonthDate = 1
        for (
            let i = dayOfWeekOfFirstOfNext;
            i < DAYS_IN_WEEK && boxIndex < calendarBoxSpecs.length;
            i += 1
        ) {
            calendarBoxSpecs[boxIndex] = {
                text: nextMonthDate,
                kind: OTHER_MONTH,
                linkedTime: boundsProvider.linkedTimeFromDayOfMonth(
                    NEXT,
                    // Valid because nextMonthDate is known to be between 1 and DAYS_IN_WEEK
                    /** @type {DayOfMonth} */(nextMonthDate)
                )
            }

            nextMonthDate += 1
            boxIndex += 1
        }

        return {
            monthText,
            boxSpecs: calendarBoxSpecs.flat(),
            appearance,
        }
    }

    /** @typedef {0|1|2} Gregorian0YMDToJulianDaysSinceJulianEpochAlgorithm */
    const JOHN_WALKER = 0
    const FLIEGEL_AND_VAN_FLANDERN = 1
    const FLIEGEL_AND_VAN_FLANDERN_FLOORED = 2

    const GREGORIAN0_EPOCH = 1721425.5;

    // One based month. Example for time 0: gregorian0YMDToJulianDaysSinceJulianEpoch(G0.ymd(1970, 1, 1))
    /** @type {(g0YMD: G0YMD, algorithm?: Gregorian0YMDToJulianDaysSinceJulianEpochAlgorithm) => JulianDaysSinceJulianEpoch} */
    const gregorian0YMDToJulianDaysSinceJulianEpoch = ({g0Year: year, g0Month: month, g0DayOfMonth: dayOfMonth}, algorithm) => {
        switch (algorithm) {
            default:
            case JOHN_WALKER:
                // https://www.fourmilab.ch/documents/calendar/
                return (GREGORIAN0_EPOCH - 1) +
                   (365 * (year - 1)) +
                   Math.floor((year - 1) / 4) +
                   (-Math.floor((year - 1) / 100)) +
                   Math.floor((year - 1) / 400) +
                   Math.floor((((367 * month) - 362) / 12) +
                   ((month <= 2) ? 0 :
                                       (isGregorian0LeapYear(year) ? -1 : -2)
                   ) +
                   dayOfMonth);
            case FLIEGEL_AND_VAN_FLANDERN:
                // https://dl.acm.org/doi/pdf/10.1145/364096.364097
                // This other website says that this only works for gregorian years 1801 - 2099
                // TODO? Check that at some point, and maybe add a disclaimer?
                // https://docs.kde.org/trunk5/en/kstars/kstars/ai-julianday.html
                // Since I, J and K are integers in default in Fortran, this algorithm uses integer division.
                const I = BigInt(year)
                const J = BigInt(month)
                const K = BigInt(dayOfMonth)

                const output = K - 32075n + 1461n * (I + 4800n + (J - 14n)/12n)/4n
                        + 367n * (J - 2n - (J - 14n)/12n  * 12n)/12n - 3n
                        * ((I + 4900n + (J - 14n)/12n)/100n)/4n

                return Number(
                    output
                );
        }
    };

    /** @type {(j0YMD: J0YMD) => JulianDaysSinceJulianEpoch} */
    const julian0YMDToJulianDaysSinceJulianEpoch = ({j0Year: year, j0Month: month, j0DayOfMonth: dayOfMonth}) => {
        /* Algorithm as given in Meeus, Astronomical Algorithms, Chapter 7, page 61 */

        if (month <= 2) {
            year -= 1;
            month += 12;
        }

        return ((Math.floor((365.25 * (year + 4716))) +
                Math.floor((30.6001 * (month + 1))) +
                dayOfMonth) - 1524.5);
    };

    return {
        calculateCalendarSpecs,
        GREGORIAN0,
        INTERNATIONAL_FIXED,
        JULIAN0,
        CALENDAR_KIND_COUNT,
        G0,
        G1,
        J0,
        J1,
        getStartOfYear,
        getGregorianOctoberFirst,
        get0IndexedDayOfYear,
        isGregorian0LeapYear,
        isJulian0LeapYear,
        julian0DayOfWeek,
        IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR,
        IFC_ZERO_INDEXED_LEAP_MONTH,
        IFC_ZERO_INDEXED_YEAR_DAY_MONTH,
        IFC_NORMAL_DAYS_PER_MONTH,
        OTHER_MONTH,
        CURRENT_MONTH,
        CURRENT_DAY,
        //
        PREVIOUS,
        CURRENT,
        NEXT,
        //
        DEFAULT_APPEARANCE,
        HIDE_WEEK_ROW,
        LAST_DAY_OUTSIDE_WEEK,
        ifcZeroIndexedMonthAndDay,
        ifcZeroIndexedMonthToZeroIndexedFirstDayOfYearInMonth,
        ifcLinkedTimeFromDayOfMonth,
        gregorianLinkedTimeFromDayOfMonth,
        //
        // Some of these units exceed the integer precision of double precision floating point
        SI_YOTTAANNUM_IN_MILLIS,
        SI_ZETAANNUM_IN_MILLIS,
        SI_EXAANNUM_IN_MILLIS,
        SI_PETAANNUM_IN_MILLIS,
        SI_TERAANNUM_IN_MILLIS,
        SI_GIGAANNUM_IN_MILLIS,
        SI_MEGAANNUM_IN_MILLIS,
        SI_MILLIENUM_IN_MILLIS,
        SI_YEAR_IN_MILLIS,
        WEEK_IN_MILLIS,
        DAY_IN_MILLIS,
        HOUR_IN_MILLIS,
        MINUTE_IN_MILLIS,
        SECOND_IN_MILLIS,
        //
        rollGregorian0YMDByDays,
        rollJulian0YMDByDays,
        julian0YMD,
        gregorian0YMDToJulian0,
        julian0YMDToGregorian0,
        gregorian0YMDToJulianDaysSinceJulianEpoch,
        julian0YMDToJulianDaysSinceJulianEpoch,
        gregorian0DaysDifferenceFromJulian0YMD,
        julian0DaysDifferenceFromGregorian0YMD,
        JOHN_WALKER,
        FLIEGEL_AND_VAN_FLANDERN,
        julianLinkedTimeFromDayOfMonth,
    }
}())
