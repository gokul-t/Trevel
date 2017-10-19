(() => {

    "use strict";

    console.clear();
    window.autobet_dnr = true;

    let bconfig = {
        payout: 2,
        wait: 750,
        baseBet: .00000001,
        xProfit: 1,
        betIncreaseBy: 110
    }

    let btc = new BTC();
    let bet = new BET();
    let betStack = new BetStack();

    let stop = false;

    $(document).on("dblclick", () => {
        stop = !stop;
    });

    // test(1);

    init();

    function init() {
        return start(randNum() > 5000, bconfig.baseBet)
            .then(console.log)
            .catch(console.error);
    }

    function start(hilo, betAmount) {


        return bet.bet(hilo, betAmount)
            .then((isWin) => {

                // console.log(1, isWin);
                if (stop) {
                    return Promise.reject(`game stopped manually`, betStack.info());
                }

                betStack.result(isWin, hilo);

                let p = betStack.prediction();

                return start(p.hilo, p.betAmount);
            });
    }


    function findNextBet(m, nextBet = bconfig.baseBet, betIncrease = bconfig.betIncreaseBy) {
        // console.log(m, nextBet, betIncrease);
        let tLoss = nextBet;
        for (let i = 1; i <= m; i++) {
            nextBet += nextBet * (betIncrease / 100);
            tLoss += nextBet;
        }
        console.log(nextBet.toFixed(8))
        return nextBet;
    }

    function getMultiTolerence() {
        let bal = btc.balance();
        let m = 0;
        let total = bconfig.baseBet;
        let b = total;
        while (bal >= total) {
            m += 1;
            // console.log(`${ m }: bet - ${ b.toFixed(8) },  profit: ${ (b - (total-b)).toFixed(8) }, loss : ${ total.toFixed(8) }`);
            b = findNextBet(m);
            total += b;
        }
        return m;
    }

    function test(m) {
        for (let i = 1; i <= m; i++) {
            console.log(findNextBet(i).toFixed(8))
        }

        console.log(getMultiTolerence());
    }

    function BetStack() {
        let count = 0;
        let lossCount = 0;

        let highestLoss = 0;
        let highestChange = 0;
        let highestChangeInChange = 0;

        let tolerence = getMultiTolerence();

        let _hi = 0,
            _lo = 0,
            _neutral = 0;

        this.info = () => {
            console.log({
                _hi: _hi,
                _lo: _lo,
                _neutral: _neutral,
                count: count
            })
        }

        this.tolerence = tolerence;

        this.result = (isWin, hilo) => {

            count += 1;

            let counter = bet.getCounter();

            if (counter > 5250) {
                _hi += 1;
            } else if (counter < 4750) {
                _lo += 1;
            } else {
                _neutral += 1;
            }

            if (isWin) {
                win();
                lossCount = 0;
            } else {
                lossCount += 1;
            }
        };

        this.prediction = function() {

            let noP = 0;

            try {
                noP = parseFloat(_neutral / count) * 100;
            } catch (e) {
                console.error(e);
            }

            let result = {};

            if (_hi > _lo) {
                result.hilo = false;
            } else if (_hi < _lo) {
                result.hilo = true;
            } else {
                result.hilo = randNum() > 5000;
            }

            let a = Math.abs(_hi - _lo);
            a = (a / count) * 1000;

            a += (noP - 5);

            result.betAmount = findNextBet(lossCount, bconfig.baseBet, a);


            return result;
        }

        this.compensate = () => {
            return nextLossLevel() - tolerence;
        };

        this.nextLossLevel = nextLossLevel;

        this.needNotCompensate = () => {
            return tolerence > nextLossLevel();
        }

        function nextLossLevel() {
            return highestLoss + highestChange + highestChangeInChange + 2;
        }

        function win() {
            if (highestLoss < lossCount) {
                let multiChange = lossCount - highestLoss;
                if (highestChange < multiChange) {
                    let changeInChange = multiChange - highestChange;
                    if (highestChangeInChange < changeInChange) {
                        highestChangeInChange = changeInChange;
                    }
                    highestChange = multiChange;
                }
                highestLoss = lossCount;
            }
        }

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
        this.getCounter = getCounter;

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
                    setTimeout(rollChecker, (bconfig.wait) + Math.round(Math.random() * 100));
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
        return Math.round(Math.random() * 9000) + 1000;
    }

})();