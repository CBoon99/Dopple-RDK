import streamlit as st
import pandas as pd
import time

# Load the log data
def load_log_data():
    try:
        df = pd.read_csv('bue_log.csv')
        return df
    except Exception as e:
        st.error(f"Error loading log data: {e}")
        return pd.DataFrame()

# Main dashboard function
def main():
    st.title("SpiralBot Dashboard")
    st.write("Real-time monitoring of trades, PnL, and equity")

    # Load data
    df = load_log_data()
    if df.empty:
        st.warning("No log data available.")
        return

    # Sidebar filters
    st.sidebar.header("Filters")
    symbols = df['symbol'].unique()
    selected_symbols = st.sidebar.multiselect("Select Symbols", symbols)
    close_reasons = df['close_reason'].unique()
    selected_reasons = st.sidebar.multiselect("Select Close Reasons", close_reasons)

    # Filter data
    filtered_df = df
    if selected_symbols:
        filtered_df = filtered_df[filtered_df['symbol'].isin(selected_symbols)]
    if selected_reasons:
        filtered_df = filtered_df[filtered_df['close_reason'].isin(selected_reasons)]

    # Display data with pagination
    st.dataframe(filtered_df, use_container_width=True)

    # Real-time equity chart
    st.subheader("Equity Over Time")
    equity_data = filtered_df.groupby('timestamp')['portfolio_value'].sum().reset_index()
    st.line_chart(equity_data.set_index('timestamp'))

    # Auto-refresh every 30 seconds
    time.sleep(30)
    st.experimental_rerun()

if __name__ == "__main__":
    main() 