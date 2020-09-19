import dbConnection from './dbConnection';

const runQuery = (query: string, params: Array<any>): Promise<any> => {
  return new Promise((resolve, reject) => {
    dbConnection.query(query, params, (error, results) => {
      if (error) {
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
};

export default runQuery;
