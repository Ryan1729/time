var FactorialBase = (function () {
    "use strict";

    const factorial = (n) => {
        let output = 1

        while (n >= 2) {
            output *= n
            n -= 1
        }

        return output
    }

    const of = (n) => {
        if (n <= 0) {
            return [0]
        }

        let placeValue = 1
        let place = 1

        while (placeValue < n) {
            place += 1
            placeValue *= place
        }

        if (placeValue > n) {
            placeValue /= place
            place -= 1
        }

        let output = []

        while (place > 0) {
            let digit = 0
            while (n >= placeValue) {
                digit += 1
                n -= placeValue
            }
            output.push(digit)

            placeValue /= place
            place -= 1
        }


        return output
    }

    const toString = (factorialBaseN) => {
        return factorialBaseN.join("")
    }
    
    const stringOf = (n) => toString(of(n))

    return {
        of,
        toString,
        stringOf,
    }
}())
