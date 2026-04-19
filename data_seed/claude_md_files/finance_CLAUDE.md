# CLAUDE.md — Finance & Stock Trading Development

> Place this file in your project root. Claude Code reads it at session start and follows it as authoritative instructions.
> Optimized for financial analysis, trading strategy development, quantitative research, and market data applications.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode (`/plan`) for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Financial code is high-stakes — always plan before writing
- Write detailed specs upfront, especially for trading logic

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, data exploration, and parallel analysis to subagents
- One task per subagent for focused execution
- Use subagents for: backtesting, data validation, code review, documentation

### 3. Self-Improvement Loop
- After ANY correction: update `tasks/lessons.md` with the pattern
- Financial bugs can be catastrophic — never repeat the same mistake
- Review `tasks/lessons.md` at session start

### 4. Verification Before Done
- Never mark a task complete without proving correctness
- Validate numerical results against known benchmarks
- Cross-check calculations with at least two methods
- Show evidence: test output, backtesting results, sample data

### 5. Autonomous Bug Fixing
- When given a bug report: investigate root cause in data AND logic
- Check for off-by-one errors, timezone issues, and float precision problems
- Verify fix doesn't change historical results unexpectedly

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting — especially for trading logic
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: Include reasoning for financial/mathematical decisions
5. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Accuracy Above All**: Financial data must be precise. No approximations without explicit acknowledgment.
- **No Laziness**: Find root causes. No temporary fixes. No shortcuts with financial calculations.
- **Simplicity First**: Complex strategies should be built from simple, testable components
- **Minimal Impact**: Changes should only touch what's necessary
- **Reproducibility**: All analysis must be reproducible from raw data
- **Defense in Depth**: Multiple validation layers for any trading or financial decision

## Financial Data Handling Rules

### Data Integrity
- Always validate data before processing (check for NaN, nulls, outliers, gaps)
- Use appropriate precision: `Decimal` for money/prices, never bare `float`
- All timestamps must be timezone-aware (prefer UTC internally, convert for display)
- Handle market holidays and non-trading days explicitly
- Check for survivorship bias in historical data
- Validate OHLC relationships: Open/Close within High-Low range, High ≥ Low
- Log data quality issues — never silently fix or ignore them

### Data Sources
- Always document data source, retrieval date, and any transformations applied
- Cache API responses to avoid rate limits and reduce costs
- Implement retry logic with exponential backoff for all API calls
- Store raw data separately from processed data
- Use versioned datasets for backtesting reproducibility

### Numerical Precision
- Use `decimal.Decimal` (Python) or `BigNumber.js` (JavaScript) for monetary values
- Round only at the final display step, never during intermediate calculations
- Be explicit about rounding rules (ROUND_HALF_UP for financial convention)
- Account for bid-ask spreads in all price calculations
- Handle stock splits, dividends, and corporate actions in price data

## Trading Strategy Development Guidelines

### Strategy Structure
```
strategies/
  [strategy_name]/
    strategy.py           # Core strategy logic
    signals.py            # Signal generation
    risk_management.py    # Position sizing, stop losses
    backtest.py           # Backtesting harness
    config.yaml           # Strategy parameters
    README.md             # Strategy documentation
    tests/
      test_strategy.py
      test_signals.py
      test_risk.py
```

### Strategy Rules
- Every strategy must have a clear, documented hypothesis
- Separate signal generation from order execution
- All parameters must be configurable — no hardcoded magic numbers
- Log every signal, order, fill, and position change
- Include maximum drawdown limits and circuit breakers
- Paper trade for minimum 30 days before live deployment
- Document expected win rate, profit factor, and max drawdown

### Backtesting Standards
- Always account for:
  - Transaction costs (commissions, fees)
  - Slippage (use realistic estimates: 0.05-0.1% for liquid stocks)
  - Market impact for larger orders
  - Survivorship bias
  - Look-ahead bias (no future data in signals)
  - Overfitting (out-of-sample testing mandatory)
- Split data: 60% train / 20% validation / 20% test (walk-forward preferred)
- Report these metrics minimum:
  - Total return (absolute and annualized)
  - Sharpe ratio
  - Maximum drawdown (and recovery time)
  - Win rate
  - Profit factor
  - Number of trades
  - Average holding period
- Compare against benchmark (S&P 500 buy-and-hold minimum)
- Use walk-forward analysis, not just single in-sample/out-of-sample split

## Risk Management Principles

- Never risk more than 1-2% of portfolio on a single trade
- Implement portfolio-level stop losses (max daily/weekly drawdown)
- Position sizing based on volatility (ATR-based or Kelly criterion)
- Diversification: maximum 20% exposure to any single sector
- Always calculate Value at Risk (VaR) at 95% and 99% confidence
- Implement circuit breakers: halt trading if drawdown exceeds threshold
- Monitor correlation between positions — avoid hidden concentration risk
- Document all risk limits and ensure they are enforced in code, not just policy

## API Integrations

### Market Data
- **Primary**: Yahoo Finance (yfinance), Alpha Vantage, or Polygon.io
- **Real-time**: WebSocket feeds from broker API (Alpaca, Interactive Brokers)
- **Alternative data**: FRED for economic indicators, SEC EDGAR for filings
- Always implement rate limiting and caching
- Handle API failures gracefully — never trade on stale data

### Broker APIs
- **Paper trading**: Alpaca (paper mode), Interactive Brokers (paper account)
- **Live trading**: Alpaca, Interactive Brokers, TD Ameritrade
- Always start with paper trading — never deploy directly to live
- Implement kill switches for all live trading systems
- Log every API call and response

### MCP Servers for Finance
```bash
# Alpaca Trading MCP
claude mcp add alpaca --scope user --transport stdio uvx alpaca-mcp-server \
  --env ALPACA_API_KEY=your_paper_api_key \
  --env ALPACA_SECRET_KEY=your_paper_secret_key

# Context7 for framework documentation
claude mcp add context7 --scope user -- npx -y @upstash/context7-mcp
```

## Compliance and Disclaimer Rules

- All trading tools must include prominent disclaimers: "Not financial advice"
- Never present backtested results as guaranteed future performance
- Log all decisions for audit trail
- Implement data retention policies for regulatory compliance
- Never store credentials in code — use environment variables
- Clearly label paper trading vs. live trading in all UIs and logs
- Include risk warnings in all user-facing outputs

## Chart and Visualization Standards

- Use `plotly` for interactive charts, `matplotlib` for static/publication charts
- Always include: title, axis labels, legend, data source attribution
- Candlestick charts: green for up, red for down (standard convention)
- Include volume subplot for price charts
- Moving averages: use consistent color coding across all charts
- Label all indicators clearly with their parameters (e.g., "SMA(50)", "RSI(14)")
- Export charts to both PNG (for reports) and HTML (for interactive viewing)
- Dark theme for trading dashboards, light theme for reports/presentations

## Testing Requirements

- Unit tests for all calculation functions (verify against known values)
- Integration tests for API interactions (use recorded responses)
- Backtest validation: reproduce known historical results
- Edge cases: empty data, single data point, market holidays, gaps
- Numerical precision tests: compare results to spreadsheet calculations
- Run full test suite before any deployment

## Code Quality

- Type hints on all functions (Python: use `typing` module)
- Docstrings on all public functions with parameter descriptions
- No magic numbers — use named constants with units in the name
  - `MAX_POSITION_PCT = 0.02  # 2% max portfolio risk per trade`
  - `SLIPPAGE_BPS = 10  # 10 basis points slippage assumption`
- Prefer `pandas` for tabular data, `numpy` for numerical computation
- Use `logging` module, never `print()` — structured logs for trading systems
- Configuration in YAML/TOML files, not hardcoded

## Git Workflow

- Commit messages: `feat:`, `fix:`, `refactor:`, `data:`, `backtest:`, `docs:`
- Tag releases with version numbers
- Never commit API keys, credentials, or `.env` files
- Store large datasets in separate data storage (not git)
- Document all parameter changes in commit messages

## Communication Style

- Be precise with financial terminology
- Always specify units (%, bps, USD, shares)
- Show your work: include intermediate calculation steps
- Flag assumptions explicitly
- Present uncertainty ranges, not single-point estimates
- Lead with the conclusion, then supporting evidence

## Things to Never Do

- Never trade live without paper trading first
- Never use future data in backtests (look-ahead bias)
- Never ignore transaction costs in performance calculations
- Never commit API keys or trading credentials
- Never present backtested returns as expected returns
- Never use `float` for monetary calculations
- Never deploy to production without kill switch mechanism
- Never ignore data quality issues — investigate and log them
