var Time = (function () {
    "use strict";

    const GREGORIAN = 0
    const INTERNATIONAL_FIXED = 1
    const CALENDAR_KIND_COUNT = 2

    const GREGORIAN_MONTH_FORMATTER = new Intl.DateTimeFormat('default', { month: 'long' });

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


    const calculateCalendarSpecs = (kind, date) => {
        let boundsProvider;
        switch (kind) {
            default:
                console.error("Invalid calendar kind: " + kind)
            case GREGORIAN:
                boundsProvider = {
                    date,
                    pageBounds() {
                        const date = this.date

                        const year = date.getUTCFullYear()
                        const month = date.getUTCMonth()
                        const dayOfMonth = date.getUTCDate()

                        const firstOfCurrentMonth = new Date(year, month, 1)
                        // Using just `date` instead of firstOfCurrentMonth has timezone issues.
                        const monthText = GREGORIAN_MONTH_FORMATTER.format(firstOfCurrentMonth)

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

                        const ZERO_INDEXED_LEAP_MONTH = 5
                        const ZERO_INDEXED_YEAR_DAY_MONTH = 13

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
                            case ZERO_INDEXED_LEAP_MONTH:
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
                            case ZERO_INDEXED_YEAR_DAY_MONTH:
                                monthText = "Year Day"
                            break
                        }

                        const year = date.getUTCFullYear()

                        const isLeap = isGregorianLeapYear(year)

                        const lastDateOfPreviousMonth =
                            (isLeap && zeroIndexedMonthNumber === (ZERO_INDEXED_LEAP_MONTH + 1))
                            ? IFC_NORMAL_DAYS_PER_MONTH + 1
                            : IFC_NORMAL_DAYS_PER_MONTH
                        // Always start the months on a sunday, even if
                        // there was a leap day.
                        const dayOfWeekOfLastOfPrevious = 6
                        const lastDateOfCurrentMonth =
                            zeroIndexedMonthNumber === ZERO_INDEXED_YEAR_DAY_MONTH
                                ? 1
                                : (isLeap && zeroIndexedMonthNumber === ZERO_INDEXED_LEAP_MONTH)
                                    ? IFC_NORMAL_DAYS_PER_MONTH + 1
                                    : IFC_NORMAL_DAYS_PER_MONTH

                        const appearance =
                            zeroIndexedMonthNumber === ZERO_INDEXED_YEAR_DAY_MONTH
                                ? HIDE_WEEK_ROW
                                : (isLeap && zeroIndexedMonthNumber === ZERO_INDEXED_LEAP_MONTH)
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
        }

        return calculateCalendarSpecsInner(boundsProvider)
    }

    const isGregorianLeapYear = (year) => {
        // The rule is, it is a leap year if it is a multiple of 4,
        // and not a multiple 100, unless it is a multiple of 400,
        // in which case it is a leap year.

        // ANDing by only less than a power of two produces 0 for
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

    const getStartOfYear = (date) => {
        const startOfYear = new Date(0);
        startOfYear.setUTCFullYear(date.getUTCFullYear())
        return startOfYear
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

    return {
        calculateCalendarSpecs,
        GREGORIAN,
        INTERNATIONAL_FIXED,
        CALENDAR_KIND_COUNT,
        getStartOfYear,
        get0IndexedDayOfYear,
        IFC_ZERO_INDEXED_LEAP_DAY_OF_YEAR,
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
    }
}())
