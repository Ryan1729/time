var Time = (function () {
    "use strict";

    const GREGORIAN = 0
    const INTERNATIONAL_FIXED = 1
    const CALENDAR_KIND_COUNT = 2

    const GREGORIAN_MONTH_FORMATTER = new Intl.DateTimeFormat('default', { month: 'long' });

    const PREVIOUS = -1
    const CURRENT = 0
    const NEXT = 1

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
                        const monthText = GREGORIAN_MONTH_FORMATTER.format(date)

                        const lastOfPreviousMonth = new Date(year, month, 0)

                        const lastDateOfPreviousMonth = lastOfPreviousMonth.getUTCDate()
                        const dayOfWeekOfLastOfPrevious = lastOfPreviousMonth.getUTCDay()
                        const lastDateOfCurrentMonth = new Date(year, month + 1, 0).getUTCDate()
                        const dayOfWeekOfFirstOfCurrent = new Date(year, month, 1).getUTCDay()
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
                        const month = date.getUTCMonth()
                        const dateOfMonth = date.getUTCDate()

                        let monthText
                        switch (internationalFixed0IndexedMonth(date)) {
                            default:
                                // TODO handle year day and leap day
                                console.error("Unknown Month for: " + getDayOfYear(date))
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
                            case 5:
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
                        }

                        const lastDateOfPreviousMonth = 28
                        const dayOfWeekOfLastOfPrevious = 6
                        const lastDateOfCurrentMonth = 28
                        const dayOfWeekOfFirstOfCurrent = 0
                        const dayOfWeekOfFirstOfNext = 0

                        return {
                            dateOfMonth,
                            lastDateOfPreviousMonth,
                            dayOfWeekOfLastOfPrevious,
                            lastDateOfCurrentMonth,
                            dayOfWeekOfFirstOfCurrent,
                            dayOfWeekOfFirstOfNext,
                            maxBoxesPerPage: 28,
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
        return Math.floor(get0IndexedDayOfYear(date) / 28)
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
        const DAYS_IN_WEEK = 7
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
