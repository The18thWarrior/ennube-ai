import { cleanupCacheOnce } from './cache.js';

async function run() {
  const removed = await cleanupCacheOnce();
  // eslint-disable-next-line no-console
  console.log(`cleanup-cache: removed ${removed} expired cache files`);
}

if (require.main === module) {
  run().catch(err => {
    // eslint-disable-next-line no-console
    console.error('cleanup-cache failed', String(err));
    process.exit(1);
  });
}
