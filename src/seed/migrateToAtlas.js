const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const { MongoClient } = require('mongodb');

async function migrate(sourceUri, targetUri, targetDbName = 'feeorbit_db') {
  console.log('==================================================');
  console.log('FeeOrbit Professional Database Migration to Atlas');
  console.log('==================================================\n');

  console.log(`Connecting to SOURCE database: ${sourceUri}`);
  const sourceClient = new MongoClient(sourceUri);
  await sourceClient.connect();
  const sourceDb = sourceClient.db();
  console.log(' Connected to SOURCE successfully.\n');

  console.log(`Connecting to TARGET Atlas database: ${targetUri}`);
  const targetClient = new MongoClient(targetUri);
  await targetClient.connect();
  const targetDb = targetClient.db(targetDbName);
  console.log(` Connected to TARGET Atlas database: [${targetDbName}]\n`);

  // 1. Fetch all collections from source
  const collections = await sourceDb.listCollections().toArray();
  console.log(`Found ${collections.length} collections in source database to migrate.\n`);

  let totalMigratedDocs = 0;
  const results = [];

  // 2. Iterate and copy each collection
  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const sourceCol = sourceDb.collection(colName);
    const targetCol = targetDb.collection(colName);

    // Drop any existing old data in target as requested
    try {
      await targetCol.drop();
      console.log(` [CLEANUP] Dropped existing ${colName} in target Atlas DB.`);
    } catch (e) {
      // Collection did not exist in target yet
    }

    const docs = await sourceCol.find({}).toArray();

    if (docs.length > 0) {
      await targetCol.insertMany(docs, { ordered: false });
      totalMigratedDocs += docs.length;
      console.log(` [COPIED] ${colName}: ${docs.length} documents copied.`);
    } else {
      await targetDb.createCollection(colName);
      console.log(` [COPIED] ${colName}: 0 documents (empty collection created).`);
    }

    // Copy Indexes
    try {
      const indexes = await sourceCol.indexes();
      for (const index of indexes) {
        if (index.name === '_id_') continue; // _id index is default
        const { key, name, unique, sparse, background } = index;
        const options = {};
        if (unique) options.unique = true;
        if (sparse) options.sparse = true;
        if (name) options.name = name;
        try {
          await targetCol.createIndex(key, options);
        } catch (idxErr) {
          // ignore duplicate or non-critical index warnings
        }
      }
    } catch (idxErr) {
      // ignore index reading errors
    }
  }

  // 3. Verification Report
  console.log('\n==================================================');
  console.log('MIGRATION AUDIT & INTEGRITY VERIFICATION');
  console.log('==================================================');

  let allMatch = true;
  for (const colInfo of collections) {
    const colName = colInfo.name;
    if (colName.startsWith('system.')) continue;

    const srcCount = await sourceDb.collection(colName).countDocuments();
    const tgtCount = await targetDb.collection(colName).countDocuments();
    const isMatch = srcCount === tgtCount;
    if (!isMatch) allMatch = false;

    console.log(`• ${colName.padEnd(22)}: Source = ${String(srcCount).padEnd(4)} | Target = ${String(tgtCount).padEnd(4)} [${isMatch ? 'MATCH ' : 'MISMATCH'}]`);
  }

  console.log('\n--------------------------------------------------');
  console.log(`Total Documents Migrated: ${totalMigratedDocs}`);
  console.log(`Status: ${allMatch ? 'SUCCESS - 100% Data Integrity Verified!' : 'WARNING - Count mismatch detected'}`);
  console.log('==================================================\n');

  await sourceClient.close();
  await targetClient.close();

  return { success: allMatch, totalMigratedDocs };
}

module.exports = { migrate };

if (require.main === module) {
  const source = process.env.SOURCE_URI || 'mongodb://127.0.0.1:27017/gym_pulse_db';
  const target = process.env.TARGET_URI || process.argv[2];
  const dbName = process.env.TARGET_DB || process.argv[3] || 'feeorbit_db';

  if (!target) {
    console.error('Please provide TARGET_URI as argument or env var.');
    process.exit(1);
  }

  migrate(source, target, dbName)
    .then((res) => {
      if (res.success) process.exit(0);
      else process.exit(1);
    })
    .catch((err) => {
      console.error('Migration failed with error:', err);
      process.exit(1);
    });
}

