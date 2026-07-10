#!/bin/bash
# Tap the iOS Simulator at a fractional position of its window — no idb or
# applesimutils needed. Requires Accessibility permission for your terminal
# (System Settings → Privacy & Security → Accessibility).
#
#   ./sim-click.sh 0.5 0.30   # x = 50% across, y = 30% down the window
#
# Pair with:  xcrun simctl io booted screenshot out.png
# Navigate without taps via deep links:
#   xcrun simctl openurl booted "<your-scheme>://route"
set -euo pipefail
FX=$1; FY=$2
osascript -e 'tell application "Simulator" to activate'
read -r X Y W H <<< "$(osascript -e 'tell application "System Events" to tell process "Simulator"
  set p to position of window 1
  set s to size of window 1
  return ((item 1 of p) as text) & " " & ((item 2 of p) as text) & " " & ((item 1 of s) as text) & " " & ((item 2 of s) as text)
end tell')"
CX=$(python3 -c "print(int($X + $W * $FX))")
CY=$(python3 -c "print(int($Y + $H * $FY))")
osascript -e "tell application \"System Events\" to tell process \"Simulator\" to click at {$CX, $CY}" >/dev/null || true
echo "clicked $CX,$CY (window ${X},${Y} ${W}x${H})"
