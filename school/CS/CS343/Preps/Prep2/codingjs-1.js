// s/o to https://the-winter.github.io/codingjs

// https://the-winter.github.io/codingjs/exercise.html?name=sleepIn&title=Warmup-1
function sleepIn(weekday, vacation) {
    if (weekday && !vacation) {
        return false;
    }
    else {
        return true;
    }
}

// https://the-winter.github.io/codingjs/exercise.html?name=monkeyTrouble&title=Warmup-1
function monkeyTrouble(aSmile, bSmile) {
    if ((aSmile && bSmile) || (!aSmile && !bSmile)) {
        return true;
    }
    else {
        return false;
    }
}

// https://the-winter.github.io/codingjs/exercise.html?name=sumDouble&title=Warmup-1
function sumDouble(a, b) {
    if (a == b) {
        return (2 * (a + b));
    }
    else {
        return (a + b);
    }
}

// https://the-winter.github.io/codingjs/exercise.html?name=frontBack&title=Warmup-1
function frontBack(str) {
    if (str.length <= 1) {
        return str;
    }

    let firstChar = str[0];
    let lastChar = str[str.length - 1];
    let middle = str.substring(1, str.length - 1);

    return lastChar + middle + firstChar;
}

// https://the-winter.github.io/codingjs/exercise.html?name=intMax&title=Warmup-1
function intMax(a, b, c) {
    return Math.max(a, b, c);
}
