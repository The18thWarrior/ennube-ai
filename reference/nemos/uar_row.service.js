const logging = require('../utilities/logging.js');
const utilities = require('../utilities/index.js');
const s3Service = require('../services/s3.service.js');
const { UARRow } = require('../models/uar_row.model');
const NAMESPACE = 'UARRowService';

/**
 * Function that takes UARRows from MongoDB and Archives them in S3
 * @param {Array} rows Array of UARRow Objects from MongoDB
 */
const archiveUARRows = async (rows) => {
    const rowMap = rows.reduce((mapping, row) => {
        if (row.uarReportId in mapping) {
            if (row.reportType in mapping[row.uarReportId]) {
                mapping[row.uarReportId][row.reportType].csv += utilities.buildCSVRowFromObject(utilities.flattenObj(row.toJSON()), mapping[row.uarReportId][row.reportType].headers);
            } else {
                const tempObj = {};
                tempObj[row.reportType] = { headers: utilities.buildCSVHeadersFromObject(utilities.flattenObj(row.toJSON())), csv: utilities.buildCSVFromObject(row.toJSON()), projectId: row.projId };
                mapping[row.uarReportId] = { ...mapping[row.uarReportId], ...tempObj };
            }
        } else {
            const tempObj = {};
            tempObj[row.reportType] = { headers: utilities.buildCSVHeadersFromObject(utilities.flattenObj(row.toJSON())), csv: utilities.buildCSVFromObject(row.toJSON()), projectId: row.projId };
            mapping[row.uarReportId] = tempObj;
        }
        return mapping;
    }, {});

    Object.entries(rowMap).forEach((outerRow) => {
        const [uarReportId, reportObject] = outerRow;
        Object.entries(reportObject).forEach((rowInfo) => {
            const [reportType, rowData] = rowInfo;
            s3Service.addFileToS3(process.env.ARCHIVED_PROJECT_BUCKET, rowData.projectId + '/' + uarReportId + '/' + reportType + '.csv', Buffer.from(rowData.csv));
        });
    });
};

/**
 * Creates UARRows and inserts them into MongoDB
 * @param {Array} newUARRows details for the new UARRows
 * @returns the UARRows that were created or throws an error.
 */
const createUARRows = async (newUARRows) => {
    try {
        const uarRows = newUARRows.map((row) => {
            return new UARRow(row);
        });
        return await UARRow.insertMany(uarRows);
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Deletes UAR Rows related to a UAR Report from MongoDB
 * @param {String} uarReportId  Id of the UARReport.
 * @returns the UAR Rows that were deleted.
 */
const deleteUARRowByReportId = async (uarReportId) => {
    await UARRow.deleteMany({ uarReportId: uarReportId });
};

/**
 * Deletes multiple UARRows from multiple Report Ids from MongoDB
 * @param {Array} uarReportIds Ids of the UARReports from which to delete rows.
 * @returns the number of UARRows that were deleted or throws an error.
 */
const deleteUARRowsFromReportIds = async (uarReportIds) => {
    try {
        return await UARRow.deleteMany({ uarReportId: { $in: uarReportIds } });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Function to format a system setting row for a UAR report
 * @param {Object} row row on the uar report
 * @param {Array} selectedSystemSettings of selected system settings
 * @param {Object} baseHeaders base headers for the report
 * @returns
 */
const formatSystemSettingsRow = (row, selectedSystemSettings, baseHeaders) => {
    // Create a map of the selected system settings with the name as their key and the label as their value
    const selectedSystemSettingsMap = selectedSystemSettings.reduce((acc, systemSetting) => {
        acc[systemSetting.name] = systemSetting.label;
        return acc;
    }, {});

    // Combine base headers with selected system settings headers
    const allRowHeaders = Object.entries({ ...baseHeaders, ...selectedSystemSettingsMap });

    // Created formatted object with all headers
    return allRowHeaders.reduce((formattedRow, rowHeader) => {
        const [name, label] = rowHeader;

        if (name in row) {
            formattedRow[label] = row[name];
        }
        return formattedRow;
    }, {});
};

/**
 * Function to format an Object row for a UAR report
 * @param {Object} row row on the uar report
 * @param {Object} excludedFields base headers for the report
 * @param {Object} baseHeaders base headers for the report
 * @returns
 */
const formatObjectRow = (row, excludedFields, baseHeaders) => {
    // Add base headers to formatted row
    let formattedRow = Object.entries(baseHeaders).reduce((formattedRow, rowHeader) => {
        const [name, label] = rowHeader;

        if (name in row) {
            formattedRow[label] = row[name];

            // remove property from row so we avoid duplicates in next step
            delete row[name];
        }
        return formattedRow;
    }, {});

    // Add the rest of the properties to the formatted row that are not excluded.
    const fields = Object.entries(row);
    return fields.reduce((acc, field) => {
        const [name, value] = field;

        // If not exluded, add to row
        if (!excludedFields.includes(name)) {
            acc[name] = value;
        }
        return acc;
    }, formattedRow);
};

/**
 * Generates UAR Rows to create.
 * @param {Array} userPerms array of permission assignments for each user.
 * @param {Object} keyAccessByPermission Object with Key Access assignments for Profiles and Permission Sets
 * @param {String} reportType type of report to create the row for.
 * @param {Object} UARReport The newly created UAR Report object.
 * @param {String} accId Id of the account to create a row for
 * @param {Object} body body of the event
 * @return {Array} rows for the UAR Report.
 */
const generateUARRows = (userPerms, keyAccessByPermission, reportType, UARReport, accId, body) => {
    // Loop through all permission assignments
    return userPerms.reduce((uarRows, permAssignment) => {
        // First check if the permission grants access to a key object or permission.
        if (keyAccessByPermission[permAssignment.PermissionSet.ProfileId] || keyAccessByPermission[permAssignment.PermissionSet.Id]) {
            let uarRow = {
                accId,
                orgId: body.orgId,
                projId: body.projId,
                uarReportId: UARReport._id,
                reportType: reportType
            };
            //If we are commiting this information to Mongo, then the Manager Info will be present, if not it wont be
            if (body.commit) {
                // Get Manager Info
                const mInfo = body.managerInfo.managerData[permAssignment.Assignee.Email];
                console.log(mInfo);
                uarRow.userActive = mInfo.IsActive;
                uarRow.userLastLogin = mInfo.LastLoginDate;
                // Checks if user has assigned manager
                if (permAssignment.Assignee.Email in body.managerInfo.managerData && Object.prototype.hasOwnProperty.call(mInfo, 'ManagerId')) {
                    uarRow.managerId = mInfo.ManagerId;
                    uarRow.managerName = mInfo['Manager.Name'];
                    uarRow.managerEmail = mInfo['Manager.Email'];
                } else {
                    uarRow.managerId = null;
                    uarRow.managerName = 'No Manager';
                    uarRow.managerEmail = '';
                }
            }

            //Add User Info here for key ordering
            uarRow.userName = permAssignment.Assignee.Name;
            uarRow.userEmail = permAssignment.Assignee.Email;

            // Checks if the permission is a Profile or Perm Set
            if (permAssignment.PermissionSet.Profile) {
                uarRow.permissionType = 'Profile';
                uarRow.permissionName = permAssignment.PermissionSet.Profile.Name;
                // Checks the report type to assign permissions correctly.
                if (reportType === 'System Setting') {
                    Object.assign(uarRow, keyAccessByPermission[permAssignment.PermissionSet.ProfileId]);
                } else if (reportType === 'Object Access') {
                    Object.assign(uarRow, keyAccessByPermission[permAssignment.PermissionSet.ProfileId]);
                }
            } else {
                uarRow.permissionType = 'Permission Set';
                uarRow.permissionName = permAssignment.PermissionSet.Name;
                // Checks the report type to assign permissions correctly.
                if (reportType === 'System Setting') {
                    Object.assign(uarRow, keyAccessByPermission[permAssignment.PermissionSet.Id]);
                } else if (reportType === 'Object Access') {
                    Object.assign(uarRow, keyAccessByPermission[permAssignment.PermissionSet.Id]);
                }
            }
            uarRows.push(uarRow);
        }
        return uarRows;
    }, []);
};

/**
 * Queries MongoDB for an UARRow
 * @param {String} uarReportId  Id of the UARRow to retrieve.
 * @returns a response, either the UARRow object that was queried for, or an error with code 301
 */
const getUARRow = async (uarRowId) => {
    try {
        return await UARRow.findOne({ _id: uarRowId });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Queries MongoDB for all UARRows associated to a Report.
 * @param {String} reportId Id of the Report to grab all of the UARRows for.
 * @param {String} filterCriteria Stringified JSON containing filter parameters for the report query.
 * @returns either a list of UARRow objects, or an error with code 301
 */
const getUARRows = async (reportId, filterCriteria = null) => {
    try {
        return await UARRow.find({ uarReportId: reportId, ...JSON.parse(filterCriteria) }).lean();
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Queries MongoDB for all UARRows associated to a Report and includes the accId in the return
 * @param {String} reportId Id of the Report to grab all of the UARRows for.
 * @param {String} filterCriteria Stringified JSON containing filter parameters for the report query.
 * @returns either a list of UARRow objects, or an error with code 301
 */
const getUARRowsWithAccId = async (reportId, filterCriteria = null) => {
    try {
        return await UARRow.find({ uarReportId: reportId, ...JSON.parse(filterCriteria) })
            .select('+accId')
            .lean();
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Queries MongoDB for all UARRows associated to an Account.
 * @param {String} accId Id of the Account to grab all of the UARRows for.
 * @param {String} filterCriteria Stringified JSON containing filter parameters for the report query.
 * @returns either a list of UARRow objects, or an error with code 301
 */
const getUARRowsByAcc = async (accId, filterCriteria) => {
    try {
        return await UARRow.find({ accId, ...JSON.parse(filterCriteria) });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Queries MongoDB for all UARRows from multiple Reports
 * @param {Array} reportIds Array of UARReport Ids from which to grab uar Rows.
 * @returns either a list of UARRow objects, or an error with code 301
 */
const getUARRowsFromReports = async (reportIds) => {
    try {
        return await UARRow.find({ uarReportId: { $in: reportIds } });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Updates the UARRow
 * @param {Object} updatedUARRow details for the updated UARRow
 * @returns the UARRow that was updated or throws an error.
 */
const updateUARRow = async (updatedUARRow) => {
    try {
        return await UARRow.findOneAndUpdate({ _id: updatedUARRow._id }, updatedUARRow, { new: true });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

module.exports = {
    archiveUARRows,
    createUARRows,
    deleteUARRowByReportId,
    deleteUARRowsFromReportIds,
    formatObjectRow,
    formatSystemSettingsRow,
    generateUARRows,
    getUARRow,
    getUARRows,
    getUARRowsByAcc,
    getUARRowsFromReports,
    getUARRowsWithAccId,
    updateUARRow
};
