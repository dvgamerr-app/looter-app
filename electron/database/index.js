// const electron = require('electron')
import { join } from 'node:path'
import {
  mkdir,
  stat,
  readFile,
  writeFile,
  readdir
} from 'node:fs/promises'
import os from 'node:os'
import * as jsonPlus from 'jsonpath-plus'

import pkg from '../../package.json'

const appName = pkg.name
const platform = os.platform()
const DEFAULT_TABLE = 'public'
const ID_TABLE = '_id'

let jsonInMemory = null
let userData = ''
if (platform === 'win32') {
  userData = join(process.env.APPDATA, appName)
} else if (platform === 'darwin') {
  userData = join(process.env.HOME, 'Library', 'Application Support', appName)
} else {
  userData = join('var', 'local', appName)
}

const fileLocation = join(userData, 'Database')
const jsonReadFile = async tableName => {
  const content = await readFile(join(fileLocation, `${tableName}.json`), 'utf-8')
  return JSON.parse(content)[tableName]
}

const jsonWriteFile = async (tableName, content) => {
  const obj = new Object()
  obj[tableName] = content
  await writeFile(join(fileLocation, fileName), JSON.stringify(obj, null, 2))
}

/**
 * Create a table | a json file
 * The second argument is optional, if ommitted, the file
 * will be created at the default location.
 */
export const createTable = async (...tableName) => {
  for (const tb of tableName.concat([ 'publuc' ])) {
    const fileName = `${tb}.json`
    await mkdir(join(userData, 'Database'), { recursive: true })

    // Check if the file with the tb.json exists
    try {
      const exists = await stat(join(fileLocation, fileName))
      if (exists.isFile) console.warn(`${fileName} already exists!`)
    } catch {
      // Create an empty object and pass an empty array as value
      const obj = new Object()
      obj[tb] = []
    
      // Write the object to json file
      await writeFile(join(fileLocation, fileName), JSON.stringify(obj, null, 2))
    }
  }
}

/**
 * Read all JSON file into memory
 */
export const Relink = async () => {
  if (!await validTable()) return

  jsonInMemory = {}
  for await (const fileName of await readdir(fileLocation)) {
    try {
      const content = await readFile(join(fileLocation, fileName), 'utf-8')
      jsonInMemory = Object.assign(jsonInMemory, JSON.parse(content))
    } catch (ex) {
      console.warn('Relink', fileName, ex)
      return false
    }
  }
}

/**
 * Release data in memory
 */
export const Unlink = async () => {
  jsonInMemory = null
}

/**
 * Checks if a json file contains valid JSON string
 */
export const validTable = async () => {
  for await (const fileName of await readdir(fileLocation)) {
    try {
      JSON.parse(await readFile(join(fileLocation, fileName), 'utf-8'))
    } catch (ex) {
      console.warn(fileName, ex)
      return false
    }
  }
  return true
}


/**
 * Checks if a json file contains valid JSON string
 */
export const valid = async (tableName = DEFAULT_TABLE) => {
  try {
    const exists = await stat(join(fileLocation, `${tableName}.json`))
    return exists.isFile
  } catch {
    return false
  }
}


/**
 * Insert object to table. The object will be appended with the property, id
 * which uses timestamp as value.
 */
export const JSONUpsert = async (tableName, tableRow = []) => {
  if (tableName instanceof Array) {
    tableRow = tableName
    tableName = DEFAULT_TABLE
  }

  if (!valid(tableName)) {
    console.warn(`Table/json file doesn't exist!`)
    return
  }

  if (tableRow instanceof Object) {
    tableRow = [ tableRow ]
  } else if (!(tableRow instanceof Array)) {
    console.warn(`row type is not supported!`)
    return
  }

  if (jsonInMemory) {
    for (const row of jsonInMemory[tableName]) {
      row[ID_TABLE] = new Date().getTime()
      jsonInMemory.push(row)
    }
    jsonWriteFile(tableName, jsonInMemory[tableName])
    return
  }

  const content = await jsonReadFile(tableName)
  for (const row of tableRow) {
    if (!row[ID_TABLE]) {
      row[ID_TABLE] = new Date().getTime()
      content.push(row)
    } else {

    }
  }
  jsonWriteFile(tableName, content)
}

/**
 * Get all contents of the table/json file object
 */
export const JSONPath = async (path = '$') => {
  if (jsonInMemory) {
    return jsonPlus.JSONPath(path, jsonInMemory)
  }

  const content = await jsonReadFile(tableName)
  return jsonPlus.JSONPath(path, content)
}

// /**
//  * Find rows of a given field/key.
//  * @param  {string} arguments[0] Table name
//  * @param  {string} arguments[1] Location of the database file (Optional)
//  * @param  {string} arguments[2] They fey/field to retrieve.
//  */
// function getField() {
//   let fname = '';
//   let tableName = arguments[0];
//   let callback;
//   let key;

//   if (arguments.length === 3) {
//     fname = join(userData, tableName + '.json');
//     callback = arguments[2];
//     key = arguments[1];
//   } else if (arguments.length === 4) {
//     fname = join(arguments[1], arguments[0] + '.json');
//     callback = arguments[3];
//     key = arguments[2];
//   }

//   let exists = fs.existsSync(fname);

//   if (exists) {
//     let table = JSON.parse(fs.readFileSync(fname));
//     const rows = table[tableName];
//     let data = [];

//     let hasMatch = false;

//     for (let i = 0; i < rows.length; i++) {
//       if (rows[i].hasOwnProperty(key)) {
//         data.push(rows[i][key]);
//         hasMatch = true;
//       }
//     }

//     if (!hasMatch) {
//       console.warn('The key/field given does not exist.')
//       return;
//     }

//     callback(true, data);
//     return;
//   } else {
//     console.warn('The table you are trying to access does not exist.')
//     return;
//   }
// }

// /**
//  * Clears an existing table leaving an empty list in the json file.
//  * @param  {string} arguments[0] [Table name]
//  * @param  {string} arguments[1] [Location of the database file] (Optional)
//  * @param  {Function} arguments[2]  [callback function]
//  */
// function clearTable() {
//   let fname = '';
//   let tableName = arguments[0];
//   let callback;

//   if (arguments.length === 2) {
//     fname = join(userData, tableName + '.json');
//     callback = arguments[1];
//   } else if (arguments.length === 3) {
//     fname = join(arguments[1], arguments[0] + '.json');
//     callback = arguments[2];
//   }

//   let exists = fs.existsSync(fname);

//   if (exists) {
//     let obj = new Object();
//     obj[tableName] = [];

//     // Write the object to json file
//     try {
//       writeFile(fname, JSON.stringify(obj, null, 2), (err) => {});
//       callback(true, 'Table cleared successfully!');
//       return;
//     } catch (e) {
//       console.warn(e.toString())
//       return;
//     }
//   } else {
//     console.warn('The table you are trying to clear does not exist.')
//     return;
//   }
// }

// /**
//  * Count the number of rows for a given table.
//  * @param {string} FirstArgument Table name
//  * @param {string} SecondArgument Location of the database file (Optional)
//  * @param {callback} ThirdArgument Function callback
//  */
// function count() {
//   let tableName = arguments[0];
//   let callback;
//   if (arguments.length === 2) {
//     callback = arguments[1];
//     getAll(tableName, (succ, data) => {
//       if (succ) {
//         callback(true, data.length);
//         return;
//       } else {
//         console.warn(data)
//         return;
//       }
//     });
//   } else if (arguments.length === 3) {
//     callback = arguments[2];
//     getAll(tableName, arguments[1], (succ, data) => {
//       if (succ) {
//         callback(true, data.length);
//         return;
//       } else {
//         console.warn(data)
//         return;
//       }
//     });
//   } else {
//     callback(
//       false,
//       'Wrong number of arguments. Must be either 2 or 3 arguments including callback function.'
//     );
//     return;
//   }
// }

// /**
//  * Get row or rows that matched the given condition(s) in WHERE argument
//  * @param {string} FirstArgument Table name
//  * @param {string} SecondArgument Location of the database file (Optional)
//  * @param {object} ThirdArgument Collection of conditions to be met
//  ```
//  {
//       key1: value1,
//       key2: value2,
//       ...
//  }
//  ```
//  * @param {callback} FourthArgument Function callback
//  */
// function getRows() {
//   let tableName = arguments[0];
//   let fname = '';
//   let callback;
//   let where;

//   if (arguments.length === 3) {
//     fname = join(userData, tableName + '.json');
//     where = arguments[1];
//     callback = arguments[2];
//   } else if (arguments.length === 4) {
//     fname = join(arguments[1], arguments[0] + '.json');
//     where = arguments[2];
//     callback = arguments[3];
//   }

//   let exists = fs.existsSync(fname);
//   let whereKeys;

//   // Check if where is an object
//   if (Object.prototype.toString.call(where) === '[object Object]') {
//     // Check for number of keys
//     whereKeys = Object.keys(where);
//     if (whereKeys === 0) {
//       console.warn('There are no conditions passed to the WHERE clause.')
//       return;
//     }
//   } else {
//     console.warn('WHERE clause should be an object.')
//     return;
//   }

//   // Check if the json file exists, if it is, parse it.
//   if (exists) {
//     try {
//       let table = JSON.parse(fs.readFileSync(fname));
//       let rows = table[tableName];

//       let objs = [];

//       for (let i = 0; i < rows.length; i++) {
//         let matched = 0; // Number of matched complete where clause
//         for (let j = 0; j < whereKeys.length; j++) {
//           // Test if there is a matched key with where clause
//           if (rows[i].hasOwnProperty(whereKeys[j])) {
//             if (rows[i][whereKeys[j]] === where[whereKeys[j]]) {
//               matched++;
//             }
//           }
//         }

//         // Check if all conditions in the WHERE clause are matched
//         if (matched === whereKeys.length) {
//           objs.push(rows[i]);
//         }
//       }

//       callback(true, objs);
//       return;
//     } catch (e) {
//       console.warn(e.toString())
//       return;
//     }
//   } else {
//     console.warn('Table file does not exist!')
//     return;
//   }
// }

// /**
//  * Update a row or record which satisfies the where clause
//  * @param  {[string]} arguments[0] [Table name]
//  * @param {string} arguments[1] [Location of the database file] (Optional)
//  * @param  {[object]} arguments[2]     [Objet for WHERE clause]
//  * @param  {[object]} arguments[3]       [Object for SET clause]
//  * @param  {Function} arguments[4]  [Callback function]
//  */
// // function updateRow(tableName, where, set, callback) {
// function updateRow() {
//   let tableName = arguments[0];
//   let fname = '';
//   let where;
//   let set;
//   let callback;

//   if (arguments.length === 4) {
//     fname = join(userData, tableName + '.json');
//     where = arguments[1];
//     set = arguments[2];
//     callback = arguments[3];
//   } else if (arguments.length === 5) {
//     fname = join(arguments[1], arguments[0] + '.json');
//     where = arguments[2];
//     set = arguments[3];
//     callback = arguments[4];
//   }

//   let exists = fs.existsSync(fname);

//   let whereKeys = Object.keys(where);
//   let setKeys = Object.keys(set);

//   if (exists) {
//     let table = JSON.parse(fs.readFileSync(fname));
//     let rows = table[tableName];

//     let matched = 0; // Number of matched complete where clause
//     let matchedIndex = 0;

//     for (let i = 0; i < rows.length; i++) {
//       for (let j = 0; j < whereKeys.length; j++) {
//         // Test if there is a matched key with where clause and single row of table
//         if (rows[i].hasOwnProperty(whereKeys[j])) {
//           if (rows[i][whereKeys[j]] === where[whereKeys[j]]) {
//             matched++;
//             matchedIndex = i;
//           }
//         }
//       }
//     }

//     if (matched === whereKeys.length) {
//       // All field from where clause are present in this particular
//       // row of the database table
//       try {
//         for (let k = 0; k < setKeys.length; k++) {
//           // rows[i][setKeys[k]] = set[setKeys[k]];
//           rows[matchedIndex][setKeys[k]] = set[setKeys[k]];
//         }

//         // Create a new object and pass the rows
//         let obj = new Object();
//         obj[tableName] = rows;

//         // Write the object to json file
//         try {
//           writeFile(fname, JSON.stringify(obj, null, 2), (err) => {});

//           callback(true, 'Success!');
//           return;
//         } catch (e) {
//           console.warn(e.toString())
//           return;
//         }

//         callback(true, rows);
//       } catch (e) {
//         console.warn(e.toString())
//         return;
//       }
//     } else {
//       console.warn('Cannot find the specified record.')
//       return;
//     }
//   } else {
//     console.warn('Table file does not exist!')
//     return;
//   }
// }

// /**
//  * Searching function
//  * @param {string} arguments[0] Name of the table to search for
//  * @param {string} arguments[1] [Location of the database file] (Optional)
//  * @param {string} arguments[2] Name of the column/key to match
//  * @param {object} arguments[3] The part of the value of the key that is being lookup
//  * @param {function} arguments[4] Callback function
//  */
// // function search(tableName, field, keyword, callback) {
// function search() {
//   let tableName = arguments[0];
//   let fname = '';
//   let field;
//   let keyword;
//   let callback;

//   if (arguments.length === 4) {
//     fname = join(userData, tableName + '.json');
//     field = arguments[1];
//     keyword = arguments[2];
//     callback = arguments[3];
//   } else if (arguments.length === 5) {
//     fname = join(arguments[1], arguments[0] + '.json');
//     field = arguments[2];
//     keyword = arguments[3];
//     callback = arguments[4];
//   }

//   let exists = fs.existsSync(fname);

//   if (exists) {
//     let table = JSON.parse(fs.readFileSync(fname));
//     let rows = table[tableName];

//     if (rows.length > 0) {
//       // Declare an empty list
//       let foundRows = [];

//       for (let i = 0; i < rows.length; i++) {
//         // Check if key exists
//         if (rows[i].hasOwnProperty(field)) {
//           // Make sure that an object is converted to string before
//           // applying toLowerCase()
//           let value = rows[i][field].toString().toLowerCase();
//           let n = value.search(keyword.toString().toLowerCase());

//           if (n !== -1) {
//             // The substring is found, add object to the list.
//             foundRows.push(rows[i]);
//           }
//         } else {
//           console.warn(2)
//           return;
//         }
//       }

//       callback(true, foundRows);
//       return;
//     } else {
//       console.warn([])
//       return;
//     }
//   } else {
//     console.warn('Table file does not exist!')
//     return;
//   }
// }

// /**
//  * Delete a row specified.
//  * @param {*} tableName
//  * @param {string} arguments[1] [Location of the database file] (Optional)
//  * @param {*} where
//  * @param {*} callback
//  */
// // function deleteRow(tableName, where, callback) {
// function deleteRow() {
//   let tableName = arguments[0];

//   let fname = '';
//   let where;
//   let callback;

//   if (arguments.length === 3) {
//     fname = join(userData, tableName + '.json');
//     where = arguments[1];
//     callback = arguments[2];
//   } else if (arguments.length === 4) {
//     fname = join(arguments[1], arguments[0] + '.json');
//     where = arguments[2];
//     callback = arguments[3];
//   }

//   let exists = fs.existsSync(fname);

//   let whereKeys = Object.keys(where);

//   if (exists) {
//     let table = JSON.parse(fs.readFileSync(fname));
//     let rows = table[tableName];

//     if (rows.length > 0) {
//       let matched = 0;
//       let matchedIndices = [];

//       for (let i = 0; i < rows.length; i++) {
//         // Iterate throught the rows
//         for (let j = 0; j < whereKeys.length; j++) {
//           // Test if there is a matched key with where clause and single row of table
//           if (rows[i].hasOwnProperty(whereKeys[j])) {
//             if (rows[i][whereKeys[j]] === where[whereKeys[j]]) {
//               matched++;
//               matchedIndices.push(i);
//             }
//           }
//         }
//       }

//       if (matchedIndices.length === 0) {
//         console.warn('Row does not exist!')
//         return;
//       }

//       for (let k = matchedIndices.length - 1; k >= 0; k--) {
//         rows.splice(matchedIndices[k], 1);
//       }

//       // Create a new object and pass the rows
//       let obj = new Object();
//       obj[tableName] = rows;

//       // Write the object to json file
//       try {
//         writeFile(fname, JSON.stringify(obj, null, 2), (err) => {});
//         callback(true, 'Row(s) deleted successfully!');
//         return;
//       } catch (e) {
//         console.warn(e.toString())
//         return;
//       }
//     } else {
//       console.warn('Table is empty!')
//       return;
//     }
//   } else {
//     console.warn('Table file does not exist!')
//     return;
//   }
// }

// /**
//  * Check table existence
//  * @param {String} dbName - Table name
//  * @param {String} dbLocation - Table location path
//  * @return {Boolean} checking result
//  */
// function tableExists() {
//   let fName = '';
//   if (arguments.length == 2) {
//     // Given the database name and location
//     let dbName = arguments[0];
//     let dbLocation = arguments[1];
//     fName = join(dbLocation, dbName + '.json');
//   } else if (arguments.length == 1) {
//     let dbName = arguments[0];
//     fName = join(userData, dbName + '.json');
//   }

//   return fs.existsSync(fName);
// }
// // Export the public available functions
// export default {
//   createTable,
//   upsertContent,
//   getAll,
//   getRows,
//   updateRow,
//   search,
//   deleteRow,
//   valid,
//   clearTable,
//   getField,
//   count,
//   tableExists
// }
