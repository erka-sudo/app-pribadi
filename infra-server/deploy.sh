#!/bin/bash

BASE_DIR="/apps/repo"

cd $BASE_DIR || exit

git pull

PORT=8000

for dir in */; do
  APP_PATH="$BASE_DIR/$dir"
  APP_NAME=$(basename $dir)

  CONFIG_FILE="$APP_PATH/app.config.json"

  if [ ! -f "$CONFIG_FILE" ]; then
    continue
  fi

  TYPE=$(jq -r '.type' $CONFIG_FILE)
  INSTALL=$(jq -r '.install // empty' $CONFIG_FILE)
  START=$(jq -r '.start' $CONFIG_FILE)

  PORT=$((PORT+1))

  pm2 delete "$APP_NAME" 2>/dev/null

  cd $APP_PATH || continue

  if [ ! -z "$INSTALL" ]; then
    eval $INSTALL
  fi

  export PORT=$PORT
  pm2 start bash --name "$APP_NAME" -- -c "$START"

done

pm2 save
