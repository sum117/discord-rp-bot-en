rm -rf build
bun run build
cp -r drizzle build/
cp sqlite.db build/
cp package.json build/