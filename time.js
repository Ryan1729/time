var Time = (function () {
    "use strict";

    const GREGORIAN0 = 0
    const INTERNATIONAL_FIXED = 1
    const JULIAN0 = 2
    const CALENDAR_KIND_COUNT = 3

    const GREGORIAN0_MONTH_FORMATTER = new Intl.DateTimeFormat('default', { month: 'long' });

    const PREVIOUS = -1
    const CURRENT = 0
    const NEXT = 1

    const DAYS_IN_WEEK = 7

    const IFC_NORMAL_DAYS_PER_MONTH = 28
    const IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR = (6 * IFC_NORMAL_DAYS_PER_MONTH)

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


    const G0 = {
        ymd: (g0Year, g0Month, g0DayOfMonth) => (
            {g0Year, g0Month, g0DayOfMonth}
        )
    }
    
    const G1 = {
        ymd: (g1Year, g1Month, g1DayOfMonth) => (
            {g1Year: g1Year === 0 ? -1 : g1Year, g1Month, g1DayOfMonth}
        )
    }
    
    const J0 = {
        ymd: (j0Year, j0Month, j0DayOfMonth) => (
            {j0Year, j0Month, j0DayOfMonth}
        )
    }
    
    const J1 = {
        ymd: (j1Year, j1Month, j1DayOfMonth) => (
            {j1Year: j1Year === 0 ? -1 : j1Year, j1Month, j1DayOfMonth}
        )
    }
   

    const calculateCalendarSpecs = (kind, date) => {
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
                            dayOfMonth,
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

                        const isLeap = isGregorianLeapYear(year)

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
                            dayOfMonth,
                            lastDateOfPreviousMonth,
                            dayOfWeekOfLastOfPrevious,
                            lastDateOfCurrentMonth,
                            dayOfWeekOfFirstOfCurrent,
                            dayOfWeekOfFirstOfNext,
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

                        // TODO confirm that these always get the right answer

                        const firstOfCurrentMonth = new Date(ymd.j0Year, ymd.j0Month, 1)
                        // Using just `date` instead of firstOfCurrentMonth has timezone issues.
                        const monthText = GREGORIAN0_MONTH_FORMATTER.format(firstOfCurrentMonth)

                        const lastOfPreviousMonthYmd = rollJulian0YMDByDays(ymd, -ymd.j0DayOfMonth)

                        const lastDateOfPreviousMonth = lastOfPreviousMonthYmd.j0DayOfMonth
                        const dayOfWeekOfLastOfPrevious = julian0DayOfWeek(lastOfPreviousMonthYmd)
                        const lastDateOfCurrentMonth = julianOneIndexedMonthLength({year: ymd.j0Year, month: ymd.j0Month})
                        const dayOfWeekOfFirstOfCurrent = julian0DayOfWeek({...ymd, j0DayOfMonth: 1})
                        const dayOfWeekOfFirstOfNext = julian0DayOfWeek(rollJulian0YMDByDays(ymd, lastDateOfCurrentMonth - ymd.j0DayOfMonth + 1))

                        return {
                            dayOfMonth: ymd.dayOfMonth,
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

    const isGregorianLeapYear = (year) => {
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

    const isJulianLeapYear = (year) => {
        // If it is a multiple of 4 it is always a Julian leap year
        return (year & 3) === 0
    }

    // TODO use as a timepiece
    const julian0DayOfWeek = ({year, month, dayOfMonth}) => {
        if (DEBUG_MODE) {
            console.log("julian0DayOfWeek")
        }
        // TODO implement
        return 0
    }

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
            if (outMonth > 12) {
                outYear += 1;
                outMonth -= 12;
            }
            currentMonthLength = julianOneIndexedMonthLength({year: outYear, month: outMonth})
        }

        // TODO skip over years at once so we don't need to loop so
        // many times
        while (outDayOfMonth < 1) {
            outMonth -= 1;
            if (outMonth < 1) {
                outYear -= 1;
                outMonth = 12;
            }
            currentMonthLength = julianOneIndexedMonthLength({year: outYear, month: outMonth})
            outDayOfMonth += currentMonthLength;
        }

        return J0.ymd(
            outYear,
            outMonth,
            outDayOfMonth,
        )
    }

    // TODO This is apparently slower than doing calculations as in
    // rollJulian0YMDByDays, so eventaully make it more like that
    // function if this gets used enough for that to matter
    const rollGregorian0YMDByDays = ({g0Year: year, g0Month: month, g0DayOfMonth: dayOfMonth}, offsetInDays) => {
        const output = new Date(0);
        output.setUTCFullYear(year)
        output.setUTCMonth(month - 1)
        output.setUTCDate(dayOfMonth + offsetInDays)

        return G0.ymd(
            output.getUTCFullYear(),
            output.getUTCMonth() + 1,
            output.getUTCDate(),
        )
    }

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

    // Year Month Day Greater-than or Equal to
    const ymdGe = (a, b) => {
        const yearDiff = a.year - b.year
        if (yearDiff !== 0) {
            return yearDiff > 0
        }

        const monthDiff = a.month - b.month
        if (monthDiff !== 0) {
            return monthDiff > 0
        }

        const dayOfMonthDiff = a.dayOfMonth - b.dayOfMonth
        return dayOfMonthDiff >= 0
    }

    // Year Month Day Greater-Than
    const ymdGt = (a, b) => {
        const yearDiff = a.year - b.year
        if (yearDiff !== 0) {
            return yearDiff > 0
        }

        const monthDiff = a.month - b.month
        if (monthDiff !== 0) {
            return monthDiff > 0
        }

        const dayOfMonthDiff = a.dayOfMonth - b.dayOfMonth
        return dayOfMonthDiff > 0
    }

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

        const rollJulian0YMDByDaysMutating = (offsetInDays) => {
            let currentMonthLength = MONTH_LENGTHS[prospectiveJulianMonth - 1]
                || (((prospectiveJulianYear & 3) | ((prospectiveJulianYear & 15) !== 0 & (prospectiveJulianYear % 25 === 0))) ? 28 : 29);

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
                    || (((prospectiveJulianYear & 3) | ((prospectiveJulianYear & 15) !== 0 & (prospectiveJulianYear % 25 === 0))) ? 28 : 29);
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
                    || (((prospectiveJulianYear & 3) | ((prospectiveJulianYear & 15) !== 0 & (prospectiveJulianYear % 25 === 0))) ? 28 : 29);
            }
        }

        let difference = 0

        if (daysSinceJulianEpoch >= K) {
            while (1) {
                const yearDiff = year - prospectiveJulianYear
                const monthDiff = month - prospectiveJulianMonth

                if (
                    // is prospectiveJulian date less than target
                    (yearDiff < 0) | yearDiff === 0 & ((monthDiff < 0) | ((monthDiff === 0) & ((dayOfMonth - prospectiveJulianDayOfMonth) < 0)))
                ) {
                    break
                }

                difference += ((prospectiveGregorianYear & 3) === 0)
                    & ((prospectiveJulianYear & 3) | ((prospectiveJulianYear & 15) !== 0 & (prospectiveJulianYear % 25 === 0)))
                    & (prospectiveGregorianYear <= 1582 ? prospectiveGregorianMonth === 2 && prospectiveGregorianDayOfMonth === 29 : prospectiveJulianMonth === 3 && prospectiveJulianDayOfMonth === 1)

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

            //~ if (prospectiveGregorianYear <= 1582) {
                //~ difference += ((prospectiveGregorianYear & 3) === 0)
                    //~ & ((prospectiveJulianYear & 3) | ((prospectiveJulianYear & 15) !== 0 & (prospectiveJulianYear % 25 === 0)))
                    //~ & (prospectiveGregorianMonth=== 2 && prospectiveGregorianDayOfMonth === 29)
            //~ }
        } else {
            while (1) {
                const yearDiff = year - prospectiveGregorianYear
                const monthDiff = month - prospectiveGregorianMonth

                if (
                    // is prospectiveGregorian date greater than or equal to target
                    (yearDiff > 0) | yearDiff === 0 & ((monthDiff > 0) | ((monthDiff === 0) & ((dayOfMonth - prospectiveGregorianDayOfMonth) >= 0)))
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

                difference -= ((prospectiveGregorianYear & 3) === 0)
                    & ((prospectiveJulianYear & 3) | ((prospectiveJulianYear & 15) !== 0 & (prospectiveJulianYear % 25 === 0)))
                    & (prospectiveGregorianMonth === 2 && prospectiveGregorianDayOfMonth === 29)
            }
        }

        return difference
    }

    const julian0DaysDifferenceFromGregorian0YMD = (ymd) => {
        console.log("julian0DaysDifferenceFromGregorian0YMD", ymd)
        const {g0Year: year, g0Month: month, g0DayOfMonth: dayOfMonth} = ymd
        
        const daysSinceJulianEpoch = gregorian0YMDToJulianDaysSinceJulianEpoch(ymd)

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

        const rollGregorian0YMDByDaysMutating = (offsetInDays) => {
            let currentMonthLength = MONTH_LENGTHS[prospectiveGregorianMonth - 1]
                || (((prospectiveGregorianYear & 3) | ((prospectiveGregorianYear & 15) !== 0 & (prospectiveGregorianYear % 25 === 0))) ? 28 : 29);

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
                    || (((prospectiveGregorianYear & 3) | ((prospectiveGregorianYear & 15) !== 0 & (prospectiveGregorianYear % 25 === 0))) ? 28 : 29);
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
                    || (((prospectiveGregorianYear & 3) | ((prospectiveGregorianYear & 15) !== 0 & (prospectiveGregorianYear % 25 === 0))) ? 28 : 29);
            }
        }

        let difference = 0

        if (daysSinceJulianEpoch >= K) {
            while (1) {
                const yearDiff = year - prospectiveGregorianYear
                const monthDiff = month - prospectiveGregorianMonth

                if (
                    // is prospectiveGregorian date less than target
                    (yearDiff < 0) | yearDiff === 0 & ((monthDiff < 0) | ((monthDiff === 0) & ((dayOfMonth - prospectiveGregorianDayOfMonth) < 0)))
                ) {
                    break
                }

                difference += ((prospectiveJulianYear & 3) === 0)
                    & ((prospectiveGregorianYear & 3) | ((prospectiveGregorianYear & 15) !== 0 & (prospectiveGregorianYear % 25 === 0)))
                    & (prospectiveJulianYear <= 1582 ? prospectiveJulianMonth === 2 && prospectiveJulianDayOfMonth === 29 : prospectiveGregorianMonth === 3 && prospectiveGregorianDayOfMonth === 1)

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

            if (prospectiveJulianYear <= 1582) {
                difference += ((prospectiveJulianYear & 3) === 0)
                    & ((prospectiveGregorianYear & 3) | ((prospectiveGregorianYear & 15) !== 0 & (prospectiveGregorianYear % 25 === 0)))
                    & (prospectiveJulianMonth=== 2 && prospectiveJulianDayOfMonth === 29)
            }
        } else {
            while (1) {
                const yearDiff = year - prospectiveJulianYear
                const monthDiff = month - prospectiveJulianMonth

                if (
                    // is prospectiveJulian date greater than or equal to target
                    (yearDiff > 0) | yearDiff === 0 & ((monthDiff > 0) | ((monthDiff === 0) & ((dayOfMonth - prospectiveJulianDayOfMonth) >= 0)))
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

                difference -= ((prospectiveJulianYear & 3) === 0)
                    & ((prospectiveGregorianYear & 3) | ((prospectiveGregorianYear & 15) !== 0 & (prospectiveGregorianYear % 25 === 0)))
                    & (prospectiveJulianMonth === 2 && prospectiveJulianDayOfMonth === 29)
            }
        }

        return difference
    }

    const julianOneIndexedMonthLength = ({year, month}) => {
        const MONTH_LENGTHS = [
            31,
            isJulianLeapYear(year) ? 29 : 28,
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


    const julian0YMD = (date) => {
        const gYear = date.getUTCFullYear()
        const gMonth = date.getUTCMonth()
        const gDayOfMonth = date.getUTCDate()

        return gregorian0YMDToJulian0(G0.ymd(gYear, gMonth + 1,gDayOfMonth))
    }

    const gregorian0YMDToJulian0 = (g0YMD) => {
        console.log("early gregorian0YMDToJulian0", g0YMD, daysDifference)
        let daysDifference = julian0DaysDifferenceFromGregorian0YMD(g0YMD)
        console.log("gregorian0YMDToJulian0", g0YMD, daysDifference)
        // Every Gregorian leap year is a Julian one as well
        return rollJulian0YMDByDays(J0.ymd(g0YMD.g0Year, g0YMD.g0Month, g0YMD.g0DayOfMonth), -daysDifference)
    }

    const julian0YMDToGregorian0 = (j0YMD) => {
        let daysDifference = gregorian0DaysDifferenceFromJulian0YMD(j0YMD)

        // Being dumb is often the first step to being smart
        const j0ToG0Dumb = ({j0Year, j0Month, j0DayOfMonth}) => {
            if (
                j0Month === 2
                && j0DayOfMonth === 29
                && isJulianLeapYear(j0Year)
                && !isGregorianLeapYear(j0Year)
            ) {
                // Whichever makes the rest of the things work better
                //return G0.ymd(j0Year, 2, 28)
                return G0.ymd(j0Year, 3, 1)
            }
            return G0.ymd(j0Year, j0Month, j0DayOfMonth)
        }

        return rollGregorian0YMDByDays(j0ToG0Dumb(j0YMD), daysDifference)
    }

    const getStartOfYear = (date) => {
        const startOfYear = new Date(0);
        startOfYear.setUTCFullYear(date.getUTCFullYear())
        return startOfYear
    }

    const getGregorianOctoberFirst = (date) => {
        const output = new Date(0);
        output.setUTCFullYear(date.getUTCFullYear())
        output.setUTCMonth(10 - 1)
        output.setUTCDate(1)
        return output
    }

    const get0IndexedDayOfYear = (date) => {
        const startOfYear = getStartOfYear(date)

        return Math.floor(
            (
                date.getTime()
                - startOfYear.getTime()
            ) / DAY_IN_MILLIS
        )
    }

    const ifcZeroIndexedMonthAndDay = (date) => {
        const year = date.getUTCFullYear()
        const dayOfYear = get0IndexedDayOfYear(date)

        const isLeap = isGregorianLeapYear(year)

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

        const dayOfMonth = dayOfYear - dayOfYearArray[monthIndex] + 1

        return {
            zeroIndexedMonthNumber: monthIndex,
            dayOfMonth,
        }
    }

    const IFC_FIRST_DAY_OF_YEAR_IN_MONTH_NON_LEAP_YEAR = [0,  28,  56,  84, 112, 140, 168, 196, 224, 252, 280, 308, 336, 364]
    const IFC_FIRST_DAY_OF_YEAR_IN_MONTH_FOR_LEAP_YEAR = [0,  28,  56,  84, 112, 140, 169, 197, 225, 253, 281, 309, 337, 365]

    const ifcZeroIndexedMonthToZeroIndexedFirstDayOfYearInMonth = ({
        zeroIndexedMonthNumber,
        year,
    }) => {
        const isLeap = isGregorianLeapYear(year)

        return ((isLeap)
            ? IFC_FIRST_DAY_OF_YEAR_IN_MONTH_FOR_LEAP_YEAR[zeroIndexedMonthNumber]
            : IFC_FIRST_DAY_OF_YEAR_IN_MONTH_NON_LEAP_YEAR[zeroIndexedMonthNumber]
        ) || 0 // for the undefined case
    }

    const ifcLinkedTimeFromDayOfMonth = (date, monthDelta, dayOfMonth) => {
        const year = date.getUTCFullYear()

        const {
            zeroIndexedMonthNumber,
        } = ifcZeroIndexedMonthAndDay(date)

        const firstDayOfYearInMonth = ifcZeroIndexedMonthToZeroIndexedFirstDayOfYearInMonth({
            zeroIndexedMonthNumber: zeroIndexedMonthNumber + monthDelta,
            year,
        })

        const targetDayOfYear = firstDayOfYearInMonth + (dayOfMonth - 1)

        const startOfYear = new Date(0);
        startOfYear.setUTCFullYear(year)

        return startOfYear.getTime() + (targetDayOfYear * DAY_IN_MILLIS)
    }

    const gregorianLinkedTimeFromDayOfMonth = (date, monthDelta, dayOfMonth) => {
        const startOfDay = new Date(0);
        startOfDay.setUTCFullYear(date.getUTCFullYear())
        startOfDay.setUTCMonth(date.getUTCMonth() + monthDelta)
        startOfDay.setUTCDate(dayOfMonth)

        return startOfDay.getTime()
    }

    const julianLinkedTimeFromDayOfMonth = (date, monthDelta, dayOfMonth) => {
        const oldYMD = julian0YMD(date)

        let newYMD = oldYMD
        switch (monthDelta) {
            case PREVIOUS:
                newYMD = rollJulian0YMDByDays(oldYMD, -oldYMD.dayOfMonth)
            break
            default:
                console.error("Unexpected monthDelta: " + monthDelta)
                // fallthrough
            case CURRENT:
            break
            case NEXT:
                newYMD = rollJulian0YMDByDays(oldYMD, julianOneIndexedMonthLength({year: oldYMD.j0Year, month: oldYMD.j0Month}) - oldYMD.dayOfMonth + 1)
            break
        }

        const gYMD = julian0YMDToGregorian0(newYMD)

        const startOfDay = new Date(0);
        startOfDay.setUTCFullYear(gYMD.year)
        startOfDay.setUTCMonth(gYMD.month)
        startOfDay.setUTCDate(gYMD.dayOfMonth)

        return startOfDay.getTime()
    }

    const OTHER_MONTH = 0
    const CURRENT_MONTH = 1
    const CURRENT_DAY = 2

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
            const firstVisibleDayOfMonth = firstVisibleDateOfPreviousMonth + i
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
                linkedTime: boundsProvider.linkedTimeFromDayOfMonth(CURRENT, i)
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
                linkedTime: boundsProvider.linkedTimeFromDayOfMonth(NEXT, nextMonthDate)
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

    const JOHN_WALKER = 0
    const FLIEGEL_AND_VAN_FLANDERN = 1
    const FLIEGEL_AND_VAN_FLANDERN_FLOORED = 2

    const GREGORIAN0_EPOCH = 1721425.5;

    // One based month. Example for time 0: gregorian0YMDToJulianDaysSinceJulianEpoch(G0.ymd(1970, 1, 1))
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
                                       (isGregorianLeapYear(year) ? -1 : -2)
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
    
    const julian0YMDToJulianDaysSinceJulianEpoch = ({j0Year, j0Month, j0DayOfMonth}) => {
        if (DEBUG_MODE) {
            console.log("julian0YMDToJulianDaysSinceJulianEpoch")
        }
        const K = 1721036.5
        // TODO implement fully
        return K + j0Year * 365.25 + j0Month * 30 + j0DayOfMonth
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
        isGregorianLeapYear,
        isJulianLeapYear,
        IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR,
        IFC_ZERO_INDEXED_LEAP_MONTH,
        IFC_ZERO_INDEXED_YEAR_DAY_MONTH,
        IFC_NORMAL_DAYS_PER_MONTH,
        OTHER_MONTH,
        CURRENT_MONTH,
        CURRENT_DAY,
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
    }
}())
