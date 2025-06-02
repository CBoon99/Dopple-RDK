import ccxt, time, datetime, pytz, json, ephem, argparse, csv

WITA = pytz.timezone('Asia/Makassar')
POSITION_SIZE = 10
STOP_LOSS = 6.50
TAKE_PROFIT = 0.03
PAIR = 'BTC/USDT'
SPREAD_LIMIT = 0.001
PORTFOLIO = 1000
trades = []
open_position = None
portfolio_value = PORTFOLIO

def is_event_active():
    today = datetime.datetime.now(WITA).date()
    if today.day == 13 and today.weekday() == 4:
        return 0.95
    try:
        mercury = ephem.Mercury()
        mercury.compute(f"{today.year}/{today.month}/{today.day}")
        if mercury.retrograde:
            return 0.95
    except: pass
    return 1.0

def get_bue_signal(fn_1, fn_2, current_price, sentiment=1.0):
    boost = 1.1 if fn_1 > fn_2 else 1.0
    modifier = is_event_active()
    bue = (0.8 * fn_1 + 0.2 * fn_2) * boost * modifier * sentiment
    delta = (bue - current_price) / current_price
    if delta > 0.005: return 'BUY', bue, delta
    if delta < -0.005: return 'SELL', bue, delta
    return 'HOLD', bue, delta

def simulate_trade(exchange, action, price, amount, bue, delta):
    trade = {
        'timestamp': datetime.datetime.now(WITA).strftime('%Y-%m-%d %H:%M:%S'),
        'pair': PAIR, 'action': action, 'price': price, 'amount': amount,
        'tp': price * (1 + TAKE_PROFIT) if action == 'BUY' else price * (1 - TAKE_PROFIT),
        'sl': price - STOP_LOSS if action == 'BUY' else price + STOP_LOSS,
        'bue': bue, 'delta': delta, 'pnl': 0.0
    }
    trades.append(trade)
    print(f"{trade['timestamp']} | {action} {PAIR} at ${price:.2f} | BUE: ${bue:.2f} | Δ: {delta*100:.2f}%")

def update_pnl(exchange):
    current_price = exchange.fetch_ticker(PAIR)['last']
    total_pnl = 0.0
    for t in trades:
        if t['pnl'] == 0.0:
            if t['action'] == 'BUY':
                t['pnl'] = (current_price - t['price']) * t['amount']
            elif t['action'] == 'SELL':
                t['pnl'] = (t['price'] - current_price) * t['amount']
            total_pnl += t['pnl']
    print(f"Total PnL: ${total_pnl:.2f}")
    with open(f'trades_{datetime.datetime.now(WITA).strftime("%Y-%m-%d")}.json', 'w') as f:
        json.dump(trades, f, indent=2)

def deposit(amount):
    global portfolio_value
    portfolio_value += amount
    log_to_csv("DEPOSIT", amount, "Deposit", "N/A")

def close_position(symbol, close_reason):
    # ... existing code ...
    log_to_csv("CLOSE", symbol, close_reason, "N/A")

def log_to_csv(action, symbol, close_reason, pnl):
    max_retries = 3
    retry_delay = 1
    for attempt in range(max_retries):
        try:
            with open('bue_log.csv', 'a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow([time.time(), action, symbol, close_reason, pnl, portfolio_value])
            break
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"Error writing to log (attempt {attempt + 1}): {e}. Retrying...")
                time.sleep(retry_delay)
            else:
                print(f"Error writing to log after {max_retries} attempts: {e}")

def calculate_equity():
    global portfolio_value
    equity = portfolio_value
    for trade in trades:
        if trade['status'] == 'open':
            equity += trade['unrealized_pnl']
    return equity

def main(sentiment, risk, mode):
    exchange = ccxt.binance({'enableRateLimit': True})
    while True:
        try:
            # Fetch prices once per cycle
            prices = fetch_coingecko_top_pairs()
            # Use prices for signal generation and position checks
            ticker = exchange.fetch_ticker(PAIR)
            price = ticker['last']
            bid, ask = ticker['bid'], ticker['ask']
            if (ask - bid) / bid > SPREAD_LIMIT:
                print("Spread too wide. Skipping.")
                time.sleep(10); continue
            fn_1, fn_2 = prices[-2], prices[-3]
            action, bue, delta = get_bue_signal(fn_1, fn_2, price, sentiment)
            print(f"Signal: {action} {PAIR} at ${price:.2f} | BUE: ${bue:.2f} | Δ: {delta*100:.2f}%")
            if mode == 'auto':
                amount = (POSITION_SIZE * risk) / price
                if action != 'HOLD':
                    simulate_trade(exchange, action, price, amount, bue, delta)
            else:
                approval = input("Execute? (go/no): ").lower()
                if approval == 'go' and action != 'HOLD':
                    amount = (POSITION_SIZE * risk) / price
                    simulate_trade(exchange, action, price, amount, bue, delta)
            update_pnl(exchange)
            prices = prices[-3:]
            portfolio_value = calculate_equity()
            time.sleep(60 - datetime.datetime.now(WITA).second)
        except Exception as e:
            print(f"Error in main loop: {e}")
            time.sleep(5)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--sentiment', type=float, default=1.0)
    parser.add_argument('--risk', type=float, default=1.0)
    parser.add_argument('--mode', choices=['auto', 'manual'], default='manual')
    parser.add_argument("--live", action="store_true", help="Run in live mode")
    args = parser.parse_args()

    if args.live:
        print("Running in live mode")
    else:
        print("Running in simulation mode")

    main(args.sentiment, args.risk, args.mode)

