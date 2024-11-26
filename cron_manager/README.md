## APPLICATION CRON MANAGER README

Why use a docker container with its own cron setup? Isnt that unsafe and bad practice?

Well... yes. However, I am currently running this sytem on "UNRAID" which can have spotty cron systems. By using a cron manager docker container I can 
entirely avoid having to constantly maintain the UNRAID cron and instead just deploy it to a container. This also allows me to future-proof a bit and 
not have to do too much extra work in my eventual switch to a self-hosted K8s.