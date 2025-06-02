#!/bin/bash

# Launch the bot in the background
python bue_flashbot_virtual.py &

# Launch the dashboard in the background
streamlit run sb_dashboard.py &

echo "SpiralBot and Dashboard launched successfully!" 