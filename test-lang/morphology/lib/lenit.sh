#!/bin/bash

case "$1" in
  th*) echo "$1" ;;
  ph*) echo "$1" ;;
  kh*) echo "$1" ;;
  ch*) echo "$1" ;;
  dh*) echo "$1" ;;
  gh*) echo "$1" ;;
  sh*) echo "$1" ;;
  t*) <<<"$1" sed -e s/^t/d/ ;;
  p*) <<<"$1" sed -e s/^p/b/ ;;
  k*) <<<"$1" sed -e s/^k/g/ ;;
  c*) <<<"$1" sed -e s/^c/g/ ;;
  d*) <<<"$1" sed -e s/^d/dh/ ;;
  b*) <<<"$1" sed -e s/^b/v/ ;;
  g*) <<<"$1" sed -e "s/^g/'/" ;;
  s*) <<<"$1" sed -e s/^s/h/ ;;
  m*) <<<"$1" sed -e s/^m/v/ ;;
  *) echo "$1"
esac
