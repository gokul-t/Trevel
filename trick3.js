(() => {

    "use strict";

    window.autobet_dnr = true;

    let bconfig = {
        payout: 1.10,
        wait: 10,
        baseBet: .00000010,
        betIncreaseBy: 10
    }

    let btc = new BTC();
    let bet = new BET();

    let multiplier = 0;
    let rollCount = 0;

    let endStop = 0;

    let stop = false;

    $(document).on("dblclick", () => {
        stop = !stop;
    });

    // test();

    start(randNum() > 5000, bconfig.baseBet)
        .then(console.log)
        .catch(console.error)

    function start(hilo, betAmount) {

        rollCount += 1;

        return bet.bet(hilo, betAmount)
            .then((isWin) => {

                // console.log(1, isWin);
                if (stop) {
                    return Promise.reject("game stopped ${ endStop }");
                }

                if (endStop >= 1) {
                    return Promise.reject(`game stopped at endStop ${ endStop }`);
                }

                if (isWin) {
                    multiplier = 0;
                    // console.log(2, multiplier);
                    if (!bet.isWin(!hilo)) {
                        // console.log(3, multiplier);
                        hilo = !hilo;
                        return onLose();
                    }
                    return start(hilo, bconfig.baseBet);
                } else {
                    return onLose(true);
                }

                function onLose(realLose) {

                    multiplier += 1;

                    let bt = findNextBet(multiplier);

                    let b = btc.balance() - bt;

                    let nextBet = findNextBet(multiplier + 1);

                    let end = !(b >= nextBet);

                    betAmount = end ? btc.balance() : bt;

                    if (end) {
                        endStop += 1;
                    }

                    return start(hilo, betAmount);
                }
            });
    }


    function findNextBet(m) {
        let t = bconfig.baseBet;
        let l = t;

        for (var i = 1; i <= m; i++) {
            t = (l * 10) + bconfig.baseBet;
            l += t;
        }
        return t;
    }

    function test() {
        console.log(findNextBet(3).toFixed(8))
    }

    function BTC() {

        let $payout = $("#double_your_btc_payout_multiplier");
        let $balance = $('#balance');
        let $btcStake = $('#double_your_btc_stake');
        let $lose = $('#double_your_btc_bet_lose');
        let $bonusBalance = $("#bonus_account_balance");

        let prevAmt = balance();

        this.balance = balance;
        this.prevAmt = prevAmt;


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


    }

    function BET() {

        let lt, gt;

        let $btcStake = $('#double_your_btc_stake');
        let $payout = $("#double_your_btc_payout_multiplier");

        $payout.val(bconfig.payout);

        winLoseLimit();

        this.bet = bet;
        this.isWin = isWin;

        function isRollFinished() {
            return btc.balance() !== btc.prevAmt;
        }

        function click(x) {
            return $('#double_your_btc_bet_' + x + '_button').click();
        }

        function winLoseLimit() {
            gt = parseInt(Math.round(10000 - (9500 / parseFloat($("#double_your_btc_payout_multiplier").val()).toFixed(2))));
            lt = parseInt(Math.round((9500 / parseFloat($("#double_your_btc_payout_multiplier").val()).toFixed(2))));
        }

        function isWin(hilo) {
            let num = getCounter();
            if (hilo) {
                return num > gt;
            }
            return num < lt;
        }

        function getBetAmount() {
            return parseFloat($btcStake.val());
        }

        function setBetAmount(amt) {
            return $btcStake.val(amt.toFixed(8));
        }

        function bet(hilo, betAmount) {

            if (!btc.balance()) {
                return Promise.reject("No Balance");
            }

            if (betAmount > btc.balance()) {
                betAmount = betAmount.toFixed(8);
                return Promise.reject(`Balance not enough for bet ${ betAmount }`);
            }

            btc.prevAmt = btc.balance();

            setBetAmount(betAmount);

            click(hilo ? "hi" : "lo");

            return new Promise((resolve, reject) => {
                let rollChecker = () => {
                    // console.log("rollChecker");
                    if (isRollFinished()) {
                        // console.log("finish");
                        return resolve(btc.balance() >= btc.prevAmt);
                    }
                    setTimeout(rollChecker, (multiplier * bconfig.wait) + Math.round(Math.random() * 100));
                }
                rollChecker();
            });
        }

        function getCounter() {
            let counter = "";

            $("h1.counter > span").each((i, span) => {
                counter += $(span).text();
            });

            return parseInt(counter);
        }
    }

    function randNum() {
        return Math.floor(Math.random() * 9000) + 1000;
    }

})();