const jsforce = require('jsforce');

const logging = require('../utilities/logging.js');
const utility = require('../utilities');

const { errorMessages, frontend, salesforce } = require('../config/index');
const ALL_SALESFORCE_SYSTEM_SETTINGS = require('../data/allSalesforceSystemSettings.json');

const oauth2 = new jsforce.OAuth2({
    clientId: salesforce.clientId,
    clientSecret: salesforce.clientSecret,
    redirectUri: salesforce.redirectUri
});
const NAMESPACE = 'SalesforceService';

/**
 * Pass received authorization code and get access token
 * @param {String} code auth code used to authorize into the salesforce org
 * @returns url to redirect to
 */
exports.authorizeSalesforceOrg = async (code) => {
    try {
        const conn = new jsforce.Connection({ oauth2 });
        const userInfo = await conn.authorize(code);
        const authInfo = {
            accessToken: conn.accessToken,
            refreshToken: conn.refreshToken,
            instanceUrl: conn.instanceUrl,
            salesforceUserId: userInfo.id
        };
        return authInfo;
    } catch (err) {
        throw new Error(`Salesforce Org Authentication Error: ${err.message}`);
    }
};

/**
 * Establishes the connection with Salesforce
 * @param {Object} accessToken current sf accessToken
 * @param {Object} instanceUrl Lambda event with retrieval information
 * @returns connection object
 */
exports.createExistingSalesforceConnection = (accessToken, refreshToken, instanceUrl) => {
    return new jsforce.Connection({
        oauth2,
        accessToken,
        refreshToken,
        instanceUrl,
        version: '52.0'
    });
};

/** Function that returns a Promise and describes an Object in Salesforce
 * @param {Object} conn SFDC Connection Object
 * @param {String} ObjectApi API Name of the Object to be described
 */
exports.describeObject = (conn, objectApi) => {
    return new Promise((resolve, reject) => {
        conn.sobject(objectApi).describe$(function (err, meta) {
            if (err) {
                reject(err);
            } else {
                resolve(meta);
            }
        });
    });
};

/** Function that returns a Promise and describes an Object in Salesforce
 * @param {[Object]} permissionSetSystemSettings Org specific system settings that are available in a permission set
 * @param {[Object]} profileSystemSettings Org specific system settings that are available in a profile
 */
exports.filterForRelevantSystemSettings = (permissionSetSystemSettings, profileSystemSettings) => {
    // Filter profile system settings.
    let systemSettings = profileSystemSettings.reduce((systemSettings, data) => {
        if (Object.prototype.hasOwnProperty.call(ALL_SALESFORCE_SYSTEM_SETTINGS, data.name)) {
            // Set system setting details
            systemSettings[data.name] = { ...ALL_SALESFORCE_SYSTEM_SETTINGS[data.name] };
            /* We set a property on each setting to designate whether it is available on the profile or perm set. Otherwise,
            when the query is made to generate the report, an error will be thrown if it doesn't exist on the queried entity.*/
            systemSettings[data.name].profile = true;
        }
        return systemSettings;
    }, {});

    // Filter permission set system settings
    systemSettings = permissionSetSystemSettings.reduce((systemSettings, data) => {
        if (Object.prototype.hasOwnProperty.call(ALL_SALESFORCE_SYSTEM_SETTINGS, data.name)) {
            if (!Object.prototype.hasOwnProperty.call(systemSettings, data.name)) {
                // Set system setting details
                systemSettings[data.name] = { ...ALL_SALESFORCE_SYSTEM_SETTINGS[data.name] };
            }
            /* We set a property on each setting to designate whether it is available on the profile or perm set. Otherwise,
            when the query is made to generate the report, an error will be thrown if it doesn't exist on the queried entity.*/
            systemSettings[data.name].permSet = true;
        }
        return systemSettings;
    }, systemSettings);

    return systemSettings;
};

exports.generateInstancehUrlMismatchErrorRedirect = (calledFromLocation, redirectPath, redirectInfo) => {
    if (calledFromLocation === 'uar-process') {
        // Redirect to Project page for auth errors on UAR Process.
        redirectPath = redirectPath.substring(0, redirectPath.length - 12);
    }

    const errorPayload = encodeURIComponent(JSON.stringify({ message: errorMessages.authenticationMismatch }));

    const queryParams = { authResult: 'failure', errorPayload };
    if (redirectInfo) queryParams.redirectInfo = encodeURIComponent(redirectInfo);

    const queryParamString = utility.buildQeuryParamString(queryParams);

    return utility.createRedirect(`${frontend.domain}${redirectPath}${queryParamString}`);
};

/* Function to generate the query string for key settings.
 * @param {String} baseQueryString static string from config
 * @param {Array} keySettings list of key settings
 * @returns query string to send to Salesforce
 */
exports.generateKeySettingsQuery = (baseQueryString, keySettings) => {
    const whereCondition = keySettings.reduce((result, keySetting, index) => {
        return result + (index === 0 ? `${keySetting} = TRUE` : ` OR ${keySetting} = TRUE`);
    }, '');
    const queryString = utility.formatString(baseQueryString, keySettings, whereCondition);
    return queryString;
};

exports.generateManagerAssignmentsQuery = (managerNameField) => {
    let queryString = '';
    if (managerNameField === 'ManagerId') {
        queryString = 'ManagerId, Manager.Name, Manager.Email';
    } else if (managerNameField.slice(-3) === '__c') {
        let managerName = managerNameField.slice(0, -1) + 'r.Name';
        let managerEmail = managerNameField.slice(0, -1) + 'r.Email';
        queryString = `${managerNameField}, ${managerName}, ${managerEmail}`;
    }
    return utility.formatString(salesforce.queries.managerInfo, queryString.length > 0 ? ', ' + queryString : '');
};

/**
 * Function to generate the query string for key settings.
 * @param {String} baseQueryString static string from config
 * @param {Array} sObjects list of sObjects
 * @param {Array} fieldTypes list of field types
 * @returns query string to send to Salesforce
 */
exports.generateSObjectFieldQuery = (baseQueryString, sObjects, fieldTypes) => {
    const whereCondition = fieldTypes.reduce((result, fieldType, index) => {
        return result + (index === 0 ? `DataType LIKE '${fieldType}%'` : ` OR DataType LIKE '${fieldType}%'`);
    }, '');
    const queryString = utility.formatString(baseQueryString, sObjects, whereCondition);
    return queryString;
};

/**
 *  * Get authorization url and redirect to it
 * @param {Object} org information on the org to auth
 * @param {Object} options options for the auth
 * @returns a redirect with the authorization url
 */
exports.getAuthorizationUrl = async (org, options) => {
    try {
        oauth2.loginUrl = org.orgType === 'Production' ? salesforce.prodLogin : salesforce.sandboxLogin;
        oauth2.authzServiceUrl = `${oauth2.loginUrl}/services/oauth2/authorize`;
        oauth2.tokenServiceUrl = `${oauth2.loginUrl}/services/oauth2/token`;

        return utility.createRedirect(
            `${oauth2.getAuthorizationUrl({
                scope: 'api id web refresh_token',
                state: JSON.stringify({
                    org,
                    options
                })
            })}&prompt=login`
        );
    } catch (err) {
        return utility.createRedirect(`${frontend.domain}/${options.redirectPath}`);
    }
};

/**
 * Calls the necessary services to retrieve Key Objects by Permission Set.
 * @param {Object} conn salesforce connection
 * @param {Object} keyObjects objects selected
 * @returns the retrieved metadata records.
 */
exports.getPermSetKeyObjects = async (conn, keyObjects) => {
    // We have to wrap each object name in quotations to adhere to the Salesforce SOQL format.
    keyObjects = keyObjects.map((objectName) => `'${objectName}'`);

    // Generate query string
    const queryString = utility.formatString(salesforce.queries.permissionSetsObjects, keyObjects);

    //Return Key Objects and Queries
    return {
        data: await this.query(conn, queryString),
        queries: [queryString]
    };
};

/**
 * Calls the necessary services to retrieve Key Settings by Permission Set.
 * @param {Object} conn salesforce connection
 * @param {Object} keySettings settings selected
 * @returns the retrieved metadata records.
 */
exports.getPermSetKeySettings = async (conn, keySettings) => {
    // We batch into groups of 50 to avoid URI limit.
    const batchedKeySettings = utility.batchArray(keySettings, 50);

    const keySettingsStructure = batchedKeySettings.reduce(
        (acc, batchItem) => {
            // Generate query string
            const queryString = this.generateKeySettingsQuery(salesforce.queries.permissionSetsSystemSettings, batchItem);
            //Collect the Query
            acc.queries.push(queryString);
            // Query for Key Settings
            acc.data.push(this.query(conn, queryString));
            return acc;
        },
        { data: [], queries: [] }
    );

    const promiseResults = await Promise.all(keySettingsStructure.data);

    // Combine promise results into one object
    const permSets = promiseResults.reduce((acc, promiseResult) => {
        return promiseResult.records.reduce((acc, permSet) => {
            /* Since we're batching the permissions we're checking for in each query we need to combine the results 
            for the perm sets into one object.*/
            if (Object.prototype.hasOwnProperty.call(acc, permSet.Id)) {
                acc[permSet.Id] = { ...acc[permSet.Id], ...permSet };
            } else {
                acc[permSet.Id] = permSet;
            }
            return acc;
        }, acc);
    }, {});

    return {
        data: Object.values(permSets),
        queries: keySettingsStructure.queries
    };
};

/**
 * Calls the necessary services to retrieve Key Objects by Profile.
 * @param {Object} conn salesforce connection
 * @param {Object} keySettings settings selected
 * @returns the retrieved metadata records.
 */
exports.getProfileKeyObjects = async (conn, keyObjects) => {
    // We have to wrap each object name in quotations to adhere to the Salesforce SOQL format.
    keyObjects = keyObjects.map((objectName) => `'${objectName}'`);

    // Generate query string
    const queryString = utility.formatString(salesforce.queries.profilesObjects, keyObjects);

    //Return Key Objects and queries
    return {
        data: await this.query(conn, queryString),
        queries: [queryString]
    };
};

/**
 * Calls the necessary services to retrieve Key Settings by Profile.
 * @param {Object} conn salesforce connection
 * @param {Object} keySettings settings selected
 * @returns the retrieved metadata records.
 */
exports.getProfileKeySettings = async (conn, keySettings) => {
    // We batch into groups of 50 to avoid URI limit.
    const batchedKeySettings = utility.batchArray(keySettings, 50);

    const keySettingsStructure = batchedKeySettings.reduce(
        (acc, batchItem) => {
            // Generate query string
            const queryString = this.generateKeySettingsQuery(salesforce.queries.profilesSystemSettings, batchItem);
            //Collect the Query
            acc.queries.push(queryString);
            // Query for Key Settings
            acc.data.push(this.query(conn, queryString));
            return acc;
        },
        { data: [], queries: [] }
    );

    const promiseResults = await Promise.all(keySettingsStructure.data);

    // Combine promise results into one object
    const profiles = promiseResults.reduce((acc, promiseResult) => {
        return promiseResult.records.reduce((acc, profile) => {
            /* Since we're batching the permissions we're checking for in each query we need to combine the results 
            for the profiles into one object.*/
            if (Object.prototype.hasOwnProperty.call(acc, profile.Id)) {
                acc[profile.Id] = { ...acc[profile.Id], ...profile };
            } else {
                acc[profile.Id] = profile;
            }
            return acc;
        }, acc);
    }, {});

    return {
        data: Object.values(profiles),
        queries: keySettingsStructure.queries
    };
};

/**
 * Calls the necessary services to retrieve Permissions assigned to Users.
 * @param {Object} event request data
 * @returns the retrieved metadata records.
 */
exports.getUserPermAssignments = async (conn) => {
    // Generate query string
    const queryString = salesforce.queries.userPermissionAssignments;

    //Return User Permission Assignments and Queries
    return {
        data: await this.query(conn, queryString),
        queries: [queryString]
    };
};

/**
 * Function that returns a Promise with results of a SOQL query.
 * @param {Object} conn SFDC Connection Object
 * @param {String} q query to send to Salesforce
 * @returns SOQL query results
 */
exports.query = async (conn, q) => {
    const records = [];
    const query = conn
        .query(q)
        .on('record', function (record) {
            records.push(record);
        })
        .on('end', function () {
            logging.info(NAMESPACE, 'total fetched : ' + query.totalFetched);
        })
        .on('error', function (err) {
            logging.error(NAMESPACE, 'QUERY ERROR : ' + err.message);
        })
        .run({ autoFetch: true, maxFetch: 4000 });
    return query;
};
