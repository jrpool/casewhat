/*
  index.js
  casewhat script.
*/

// ########## IMPORTS

// Module to keep secrets local.
require('dotenv').config();
// Module to make HTTPS requests.
const https = require('https');
// Rally module.
const rally = require('rally');

// ########## GLOBAL CONSTANTS

const queryUtils = rally.util.query;
// REST API.
const requestOptions = {
  headers: {
    'X-RallyIntegrationName': 'CaseWhat',
    'X-RallyIntegrationVendor': '',
    'X-RallyIntegrationVersion': '1.0.0'
  }
};
const restAPI = rally({
  user: process.env.RALLY_USERNAME,
  pass: process.env.RALLY_PASSWORD,
  requestOptions
});

// ########## GLOBAL VARIABLES

// ########## FUNCTIONS

// ==== OPERATION UTILITIES ====

// Returns a Promise of a reference to a collection member.
const getRef = (type, formattedID) => {
  if (formattedID) {
    const numericID = formattedID.replace(/^[A-Za-z]+/, '');
    if (/^\d+$/.test(numericID)) {
      return restAPI.query({
        type,
        fetch: '_ref',
        query: queryUtils.where('FormattedID', '=', numericID)
      })
      .then(
        result => {
          const results = result.Results;
          if (results.length) {
            return results[0]._ref;
          }
          else {
            console.log(`${formattedID} not found`, `getting reference to ${type}`);
            return '';
          }
        },
        error => {
          console.log(error, `getting reference to ${type}`);
          return '';
        }
      );
    }
    else {
      console.log('Invalid ID', `getting reference to ${type}`);
      return Promise.resolve('');
    }
  }
  else {
    console.log('ID missing', `getting reference to ${type}`);
    return Promise.resolve('');
  }
};
// Returns a string with its first character lower-cased.
const lc0Of = string => string.length ? `${string[0].toLowerCase()}${string.slice(1)}` : '';
// Returns a Promise of data on a work item.
const getItemData = (ref, facts, collections) => {
  if (ref) {
    // Get data on the facts and collections of the specified item.
    return restAPI.get({
      ref,
      fetch: facts.concat(collections)
    })
    .then(
      // When the data arrive:
      item => {
        const obj = item.Object;
        // Initialize an object of data, to contain a property for each fact and collection.
        const data = {};
        // Add the fact properties with string values: value if a string or reference if an object.
        facts.forEach(fact => {
          data[lc0Of(fact)] = obj[fact] !== null && typeof obj[fact] === 'object'
            ? obj[fact]._ref
            : obj[fact];
        });
        // Add the collection properties with object values having reference and count properties.
        collections.forEach(collection => {
          data[lc0Of(collection)] = {
            ref: obj[collection]._ref,
            count: obj[collection].Count
          };
        });
        // Return the object.
        return data;
      },
      error => {
        console.log(error, `getting data on ${ref}`);
        return '';
      }
    );
  }
  else {
    return Promise.resolve({});
  }
};
// Returns a Promise of data, i.e. an array of member objects, on a collection.
const getCollectionData = (ref, facts, collections) => {
  if (ref) {
    // Get data on the facts and collections of the members of the specified collection.
    return restAPI.get({
      ref,
      fetch: facts.concat(collections)
    })
    .then(
      // When the data arrive:
      collection => {
        const members = collection.Object.Results;
        // Initialize an array of data.
        const data = [];
        // For each member of the collection:
        members.forEach(member => {
          // Initialize an object of member data with property “ref”, a long reference to it.
          const memberData = {
            ref: member._ref
          };
          /*
            Add fact properties to the object. Each has the dromedary-case fact name as its key
            and the fact’s value if a string or a reference to the fact if an object as its value.
          */
          facts.forEach(fact => {
            memberData[lc0Of(fact)] = member[fact] !== null && typeof member[fact] === 'object'
              ? member[fact]._ref
              : member[fact];
          });
          /*
            Add collection properties to the object. Each has the dromedary-case collection name
            as its key and an object with “ref” and “count” properties as its value.
          */
          collections.forEach(collection => {
            memberData[lc0Of(collection)] = {
              ref: member[collection]._ref,
              count: member[collection].Count
            };
          });
          // Add the member object to the array.
          data.push(memberData);
        });
        // Return the array.
        return data;
      },
      error => {
        console.log(error, `getting data on ${ref}`);
        return '';
      }
    );
  }
  else {
    return Promise.resolve([]);
  }
};

// Recursively copies descriptions of user stories to their test cases.
const whatCases = cases => {
  // If any test cases exist:
  if (cases.length) {
    // Identify the first test case.
    const firstCase = cases[0];
    // Get the user story that it belongs to.
    const storyRef = firstCase.workProduct;
    // If there is one:
    if (storyRef) {
      // Get its data.
      getItemData(storyRef, ['Description'], [])
      .then(
        // When they arrive:
        data => {
          // Copy the description to the test case.
          restAPI.update({
            ref: firstCase.ref,
            data: {
              Description: data.description
            }
          })
          .then(
            // When it has been copied:
            () => {
              // Process the remaining test cases.
              whatCases(cases.slice(1));
            },
            error => {
              console.log(error, 'copying user-story description');
            }
          );
        },
        error => {
          console.log(error, 'getting user-story data')
        }
      );
    }
    // Otherwise, i.e. if it belongs to no user story:
    else {
      console.log('ERROR: Test case belongs to no user story.');
    }
  }
};

// Get a reference to the specified test folder.
getRef('TestFolder', process.argv[2])
.then(
  // When they arrive:
  folder => {
    // Get data on its test cases.
    getCollectionData(folder.testCases.ref, [], [])
    .then(
      // When they arrive:
      cases => {
        whatCases(cases);
      },
      error => {
        console.log(error, 'getting data on test cases');
      }
    );
  },
  error => {
    console.log(error, 'getting reference to test folder');
  }
);
