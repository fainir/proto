#!/bin/bash

set -e

export DISPLAY=:${DISPLAY_NUM}
./xvfb_startup.sh
# Launch XFCE Desktop (panel & window manager) under a DBus session
(dbus-launch --exit-with-session startxfce4 &)
./x11vnc_startup.sh
