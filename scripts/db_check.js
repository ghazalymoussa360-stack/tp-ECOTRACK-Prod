const { Pool } = require('pg');
const config = require('../src/config');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

pool
  .query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='bins' ORDER BY ordinal_position"
  )
  .then((res) => {
    console.log(res.rows);
  })
  .catch((err) => {
    console.error(err);
  })
  .finally(() => pool.end());
