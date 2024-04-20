rm -rf build
bun run build
cp -r drizzle build/
cp sqlite.db build/
cp package.json build/
tar -czvf build.tar.gz build
scp ./build.tar.gz character-vault:/home/sum117/projects/character-vault
ssh character-vault -t 'cd ~/projects/character-vault && tar -xzvf build.tar.gz && cp -rf build/* . && rm -rf build.tar.gz && rm -rf build && sudo systemctl restart character-vault.service'
rm -rf ./build.tar.gz