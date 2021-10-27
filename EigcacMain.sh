#!/bin/sh

cd /home/forlinx/Water
export SUDO_ASKPASS=./_PWD_TEMP_
export DOTNET_ROOT=/usr/share/dotnet
export PATH=$PATH:$DOTNET_ROOT
sudo -A  /usr/local/nginx/sbin/nginx -c /usr/local/nginx/conf/nginx.conf
sudo -A chmod +x ./Eigcac.Main
sudo -A chmod +x ./BSServer/Eigcac.BSServer
sudo -A ./Eigcac.Main