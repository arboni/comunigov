declare module 'express-mysql-session' {
  import { Store } from 'express-session';
  import { Pool, PoolOptions } from 'mysql';

  interface Options {
    expiration?: number;
    createDatabaseTable?: boolean;
    schema?: any;
    // Add more options as needed
  }

  function MySQLStore(session: any): new (options: Options | undefined, connection?: Pool | PoolOptions) => Store;

  export = MySQLStore;
}