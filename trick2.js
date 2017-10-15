(function() {
    "use strict";

    window.autobet_dnr = true;

    let $payout = $("#double_your_btc_payout_multiplier");
    let $balance = $('#balance');
    let $btcStake = $('#double_your_btc_stake');
    let $lose = $('#double_your_btc_bet_lose');
    let $bonusBalance = $("#bonus_account_balance");

    let bconfig = {
        payout: 3,
        wait: 10,
        baseBet: .00000001,
        betIncreaseBy: .75,
        maxLoss: -.00000100,
        maxProfit: 1
    }
    let hilo = randomHiLo();
    let multiplier = 1;
    let rollCount = 0;
    let prevAmt = null;
    let highBal = balance();
    let betAmount = bconfig.baseBet;
    let highestMulti = 0;
    let fakeMulti = 0;
    let startBal = balance();

    let lt, gt;
    let jump = 1;


    let stop = false;

    $(document).on("dblclick", () => {
        stop = !stop;
        // if(!stop){
        // 	rollDice();
        // }
    });

    $payout.val(bconfig.payout);
    winLoseLimit();

    getMultiTolerence(bconfig.baseBet);


    // test();

    // rollDice();

    function rollDice() {

        if (stop) {
            stats();
            return;
        }

        if (isPrevRollFinished()) {


            // if (needEmergencyStop() || balance() === 0) {
            //     stats();
            //     return;
            // }

            if (!isLose() && (highestMulti < multiplier)) {

                let j = (multiplier - highestMulti) + 1;
                jump = j > jump ? j : jump;
                console.log(multiplier, rollCount, betAmount, jump);
                highestMulti = multiplier;
            }

            betAmount = getBetAmount();
            if (isLose() && lossChance()) {
                safeLose();
            } else if (isLose()) {
                goRisk();
            } else {
                toggleHiLo();
                goSafe();
            }


            setBetAmount(betAmount);
            prevAmt = balance();
            if (balance() > highBal) {
                highBal = balance();
            }


            if (fakeMulti < multiplier) {
                console.warn(multiplier, rollCount, betAmount);
                fakeMulti = multiplier;
            }



            rollCount += 1;
            $bet(hilo).click();
        }

        setTimeout(rollDice, (multiplier * bconfig.wait) + Math.round(Math.random() * 100));
    }

    function chkLuck(n) {
        n = n || .50;
        let limit = 10000 * n;
        return randNum() < limit;
    }

    function lossChance() {

        let multiTolerence = getMultiTolerence(betAmount);

        let lossUntil = highestMulti + jump;


        if (lossUntil < multiTolerence) {
            // console.log("a");
            return false;
        }
        let coverNeeded = lossUntil - multiTolerence;

        if (multiplier > coverNeeded) {
            // console.log("b", multiplier);
            return false;
        }

        // console.log("c", multiplier);

        return true;
    }

    function test() {
        let n = 21;
        for (var i = 1; i <= n; i++) {
            let lc = lossChance();
            if (lc) {
                safeLose();
            } else {
                goRisk();
            }
            // if (highestMulti < multiplier) {
            //     highestMulti = multiplier;
            // }
            console.log(betAmount.toFixed(8), highestMulti, lc);
        }
    }


    function getMultiTolerence(b) {
        let bal = balance();
        let m = 0;
        let total = b;
        while (bal >= total) {
            m += 1;
            console.log(m,b.toFixed(8),total.toFixed(8))
            b = betIncrease(b);
            total += b;
        }
        return m;
    }

    function winLoseLimit() {
        gt = parseInt(Math.round(10000 - (9500 / parseFloat($("#double_your_btc_payout_multiplier").val()).toFixed(2))));
        lt = parseInt(Math.round((9500 / parseFloat($("#double_your_btc_payout_multiplier").val()).toFixed(2))));
    }

    function isWin(num, betHi) {
        if (betHi) {
            return num > gt;
        }
        return num < lt;
    }

    function needEmergencyStop() {
        let p = .25;
        let acceptableLoss = highBal * p;
        if (highBal > balance()) {
            let loss = highBal - balance();
            return loss > acceptableLoss;
        }
        return false;
    }

    function goSafe() {
        betAmount = bconfig.baseBet;
        multiplier = 1;
    }

    function goRisk() {
        let total = betIncrease(betAmount);
        betAmount = total;
        multiplier++;
    }

    function safeLose() {
        betAmount = bconfig.baseBet;
        multiplier++;
    }

    function betIncrease(bAmnt) {
        let inc = round(bAmnt * bconfig.betIncreaseBy);

        return (bAmnt + inc);
    }

    function stats() {
        console.log(startBal, rollCount, lastRoll(), fakeMulti);
    }

    function randNum() {
        return Math.floor(Math.random() * 9000) + 1000;
    }

    function highOrLow(n) {
        return n > 5000 ? "hi" : "lo";
    }

    function randomHiLo() {
        return highOrLow(randNum());
    }


    function isPrevRollFinished() {
        return prevAmt === null || balance() !== prevAmt;
    }

    function lastRoll() {
        return prevAmt === null ? 1 : balance() - prevAmt;
    }

    function isLose() {
        return $lose.html() !== '';
    }

    function balance() {
        return bonusBalance() + parseFloat($balance.html());
    }

    function bonusBalance() {
        let html = $bonusBalance.html();
        if (html) {
            let str = html.replace(" BTC");
            return parseFloat(str);
        }
        return 0;
    }

    function getBetAmount() {
        return parseFloat($btcStake.val());
    }

    function setBetAmount(amt) {
        return $btcStake.val(amt.toFixed(8));
    }

    function $bet(x) {
        return $('#double_your_btc_bet_' + x + '_button');
    }

    function round(n) {
        let p = parseFloat(Math.round((n) * 100000000) / 100000000);
        return p;
    }

    function toggleHiLo() { if (hilo === 'lo') { hilo = 'hi'; } else { hilo = 'lo'; } };

    function getCounter() {
        let counter = "";

        $("h1.counter > span").each((i, span) => {
            counter += $(span).text();
        });

        return parseInt(counter);
    }

})();