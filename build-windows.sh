#!/bin/bash
# Build Bloom Garden for Windows
set -e

perry compile --target windows src/main.ts -o BloomGarden
mv BloomGarden BloomGarden.exe

# Fix stack commit size — Cranelift doesn't emit __chkstk stack probes,
# so large functions (like the game loop) skip the guard page and crash.
# Increase stack commit from 4KB to 1MB so the stack is pre-committed.
EDITBIN="/c/Program Files (x86)/Microsoft Visual Studio/18/BuildTools/VC/Tools/MSVC/14.50.35717/bin/Hostx64/x64/editbin.exe"
if [ -f "$EDITBIN" ]; then
  "$EDITBIN" /STACK:67108864,1048576 BloomGarden.exe
else
  echo "Warning: editbin not found, skipping stack fix. Game may crash on launch."
  echo "Install Visual Studio Build Tools or manually run: editbin /STACK:67108864,1048576 BloomGarden.exe"
fi

echo "Built BloomGarden.exe"

if [ "$1" = "--run" ]; then
  cmd //c "$(cygpath -w "$(pwd)/BloomGarden.exe")"
fi
