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
                        const dateOfMonth = date.getUTCDate()

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
                            dateOfMonth,
                            lastDateOfPreviousMonth,
                            dayOfWeekOfLastOfPrevious,
                            lastDateOfCurrentMonth,
                            dayOfWeekOfFirstOfCurrent,
                            dayOfWeekOfFirstOfNext,
                            maxBoxesPerPage: 42,
                            monthText,
                        };
                    },
                    linkedTimeFromDayOfMonth(monthDelta, dayOfMonth) {
                        const year = date.getUTCFullYear()
                        const month = date.getUTCMonth() + monthDelta
                        return new Date(year, month, dayOfMonth).getTime()
                    }
                }
            break
            case INTERNATIONAL_FIXED:
                boundsProvider = {
                    date,
                    pageBounds() {
                        const date = this.date

                        // TODO Calculate these properly for this calendar
                        const year = date.getUTCFullYear()
                        const dayOfYear = get0IndexedDayOfYear(date)

                        const isLeap = isGregorianLeapYear(year)

                        const ZERO_INDEXED_LEAP_DAY_OF_YEAR = (6 * IFC_NORMAL_DAYS_PER_MONTH)

                        const leapOffset = (isLeap && dayOfYear >= ZERO_INDEXED_LEAP_DAY_OF_YEAR)
                            ? 1
                            : 0
                        const dateOfMonth = (dayOfYear % IFC_NORMAL_DAYS_PER_MONTH) + 1 + leapOffset

                        const zeroIndexedMonthNumber = Math.floor((dayOfYear - leapOffset) / IFC_NORMAL_DAYS_PER_MONTH)

                        const ZERO_INDEXED_LEAP_MONTH = 5
                        const ZERO_INDEXED_YEAR_DAY_MONTH = 13

                        let monthText
                        switch (zeroIndexedMonthNumber) {
                            default:
                                // TODO handle year day and leap day
                                console.error("Unknown Month for: " + dayOfYear)
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

                        const lastDateOfPreviousMonth =
                            zeroIndexedMonthNumber === (ZERO_INDEXED_LEAP_MONTH + 1)
                            ? IFC_NORMAL_DAYS_PER_MONTH + 1
                            : IFC_NORMAL_DAYS_PER_MONTH
                        // Always start the months on a sunday, even if
                        // there was a leap day.
                        const dayOfWeekOfLastOfPrevious = 6
                        const lastDateOfCurrentMonth =
                            // TODO pass back a signal to hide the week row for year day
                            zeroIndexedMonthNumber === ZERO_INDEXED_YEAR_DAY_MONTH
                                ? 1
                                // TODO pass back a signal to place leap day outside of a week
                                : zeroIndexedMonthNumber === ZERO_INDEXED_LEAP_MONTH
                                    ? IFC_NORMAL_DAYS_PER_MONTH + 1
                                    : IFC_NORMAL_DAYS_PER_MONTH


                        const dayOfWeekOfFirstOfCurrent = 0
                        // Set to after DAYS in week to preventloop.
                        // TODO signal in a less coupled way
                        const dayOfWeekOfFirstOfNext = DAYS_IN_WEEK + 1

                        return {
                            dateOfMonth,
                            lastDateOfPreviousMonth,
                            dayOfWeekOfLastOfPrevious,
                            lastDateOfCurrentMonth,
                            dayOfWeekOfFirstOfCurrent,
                            dayOfWeekOfFirstOfNext,
                            maxBoxesPerPage: IFC_NORMAL_DAYS_PER_MONTH,
                            monthText,
                        };
                    },
                    linkedTimeFromDayOfMonth(monthDelta, dayOfMonth) {
                        const year = date.getUTCFullYear()
                        const month = date.getUTCMonth() + monthDelta
                        return new Date(year, month, dayOfMonth).getTime()
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

    const get0IndexedDayOfYear = (date) => {
        const startOfYear = new Date(0);
        startOfYear.setUTCFullYear(date.getUTCFullYear())

        return Math.floor(
            (
                date.getTime()
                - startOfYear.getTime()
            ) / (24 * 60 * 60 * 1000)
        )
    }

    const internationalFixed0IndexedMonth = (date) => {
        return Math.floor(get0IndexedDayOfYear(date) / IFC_NORMAL_DAYS_PER_MONTH)
    }

    const calculateCalendarSpecsInner = (boundsProvider) => {
        const {
            dateOfMonth,
            lastDateOfPreviousMonth,
            dayOfWeekOfLastOfPrevious,
            lastDateOfCurrentMonth,
            dayOfWeekOfFirstOfCurrent,
            dayOfWeekOfFirstOfNext,
            maxBoxesPerPage,
            monthText,
        } = boundsProvider.pageBounds()

        let calendarBoxSpecs = new Array(maxBoxesPerPage)
        let boxIndex = 0;

        const firstVisibleDateOfPreviousMonth = lastDateOfPreviousMonth - dayOfWeekOfLastOfPrevious

        const OTHER_MONTH_CLASS = "other-month"

        for (let i = 0; i < dayOfWeekOfFirstOfCurrent; i += 1) {
            const dayOfMonth = firstVisibleDateOfPreviousMonth + i
            calendarBoxSpecs[boxIndex] = {
                text: dayOfMonth,
                className: OTHER_MONTH_CLASS,
                linkedTime: boundsProvider.linkedTimeFromDayOfMonth(PREVIOUS, dayOfMonth)
            }
            boxIndex += 1
        }

        for (let i = 1; i <= lastDateOfCurrentMonth; i += 1) {
            let className
            if (i === dateOfMonth) {
                className = "current-day"
            } else {
                className = "current-month"
            }

            calendarBoxSpecs[boxIndex] = {
                text: i,
                className,
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
                className: OTHER_MONTH_CLASS,
                linkedTime: boundsProvider.linkedTimeFromDayOfMonth(NEXT, i)
            }

            nextMonthDate += 1
            boxIndex += 1
        }

        return {
            monthText,
            boxSpecs: calendarBoxSpecs.flat()
        }
    }

    return {
        calculateCalendarSpecs,
        GREGORIAN,
        INTERNATIONAL_FIXED,
        CALENDAR_KIND_COUNT,
        internationalFixed0IndexedMonth,
        get0IndexedDayOfYear,
    }
}())
