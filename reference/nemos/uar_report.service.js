const mongoose = require('mongoose');
const dayjs = require('dayjs');
const excel = require('excel4node');
const localizedFormat = require('dayjs/plugin/localizedFormat');

const { UARReport } = require('../models/uar_report.model');

const emailService = require('../services/email.service');
const s3Service = require('../services/s3.service.js');
const uarRowService = require('../services/uar_row.service');

const config = require('../config');
const logging = require('../utilities/logging.js');
const utilities = require('../utilities');

const NAMESPACE = 'UARReportService';

dayjs.extend(localizedFormat);

/**
 * Function that takes UARReports, builds CSVs from them, and Archives them in S3
 * @param {Array} reports Array of UARReport objects
 */
const archiveUARReports = async (reports) => {
    reports.forEach((report) => {
        const reportCSV = utilities.buildCSVFromObject(report, config.reports.archival.excludedFields);
        s3Service.addFileToS3(process.env.ARCHIVED_PROJECT_BUCKET, report.projId + '/' + report._id + '/' + report.name + '-' + report._id + '.csv', Buffer.from(reportCSV));
    });
};

/**
 * Function to build a diff report from two uar report Key Items Arrays
 * @param {Array} settingsPre Array of UAR Rows of Type System Settings
 * @param {Array} settingsPost Array of UAR Rows of Type System Settings
 * @param {Array} objectsPre Array of UAR Rows of Type Object Access
 * @param {Array} objectsPost Array of UAR Rows of Type Object Access
 * @param {Object} queries Object with string queries that were used to generate the rows
 * @returns Promise with String Buffer Object of the diff report
 */
const buildDiffXLSX = async (uarReport, settingsPre, settingsPost, objectsPre, objectsPost, queries) => {
    logging.info(NAMESPACE, 'buildDiffXLSX: START');

    // Create Excel Workbook
    let workbook = new excel.Workbook();

    // Create the worksheet tabs on the Workbook
    let settingsWS = workbook.addWorksheet('System Settings');
    let objectsWS = workbook.addWorksheet('Object Access');
    let infoWS = workbook.addWorksheet('Information');

    // Set Workbook styles
    const headerStyle = workbook.createStyle(config.excel.header);
    const notChangedStyle = workbook.createStyle(config.excel.notchanged);
    const changedStyle = workbook.createStyle(config.excel.changed);

    // Create Maps from UARRow Data (Either from Mongo (Pre) or Salesforce (Post)) using unique keys for comparison between pre/post
    const settingsPreMap = settingsPre.reduce((accumulator, row) => {
        accumulator[row.permissionName + row.userEmail] = uarRowService.formatSystemSettingsRow(row, uarReport.keySystemSettings, config.reports.diff.baseHeaders);
        return accumulator;
    }, {});
    const settingsPostMap = settingsPost.reduce((accumulator, row) => {
        accumulator[row.permissionName + row.userEmail] = uarRowService.formatSystemSettingsRow(row, uarReport.keySystemSettings, config.reports.diff.baseHeaders);
        return accumulator;
    }, {});
    const objectsPreMap = objectsPre.reduce((accumulator, row) => {
        accumulator[row.permissionName + row.userEmail] = uarRowService.formatObjectRow(row, config.reports.diff.excludedFields, config.reports.diff.baseHeaders);
        return accumulator;
    }, {});
    const objectsPostMap = objectsPost.reduce((accumulator, row) => {
        accumulator[row.permissionName + row.userEmail] = uarRowService.formatObjectRow(row, config.reports.diff.excludedFields, config.reports.diff.baseHeaders);
        return accumulator;
    }, {});

    // Compile all of the data needed for Information Page
    const initialDate = dayjs(new Date(settingsPre[0].createdAt)).format('MM/DD/YYYY hh:mmA'); // the date the first report was created.
    const currentDate = dayjs().format('MM/DD/YYYY hh:mmA');
    const infoArray = {
        initial: {
            Report: 'Initial Report',
            'Date Pulled': initialDate,
            'Profile Key Settings Queries': queries.profileSettings.join(';'),
            'Permission Set Key Settings Queries': queries.permSetSettings.join(';'),
            'Profile Key Objects Queries': queries.profileObjects.join(';'),
            'Permission Set Key Objects Queries': queries.permSetObjects.join(';'),
            'User Permissions Queries': queries.userPerms.join(';')
        },
        current: {
            Report: 'Current Settings',
            'Date Pulled': currentDate,
            'Profile Key Settings Queries': queries.profileSettings.join(';'),
            'Permission Set Key Settings Queries': queries.permSetSettings.join(';'),
            'Profile Key Objects Queries': queries.profileObjects.join(';'),
            'Permission Set Key Objects Queries': queries.permSetObjects.join(';'),
            'User Permissions Queries': queries.userPerms.join(';')
        }
    };

    // Build the headers row for each Worksheet
    //console.log(utilities.mergeProperties(Object.values(objectsPreMap)));
    const settingsHeaders = buildXLSXHeaders(utilities.mergeProperties(Object.values(settingsPreMap)), settingsWS, headerStyle, 'diff');
    const objectsHeaders = buildXLSXHeaders(utilities.mergeProperties(Object.values(objectsPreMap)), objectsWS, headerStyle, 'diff');
    buildXLSXHeaders(infoArray.initial, infoWS, headerStyle);

    // Build the rows for the Settings Worksheet
    buildXLSXBody({
        nonDiffFields: config.reports.diff.nonDiffFields,
        postMap: settingsPostMap,
        preMap: settingsPreMap,
        styles: {
            changed: changedStyle,
            notChanged: notChangedStyle
        },
        worksheet: settingsWS,
        headers: settingsHeaders
    });

    // Build the rows for the Object Worksheet
    buildXLSXBody({
        nonDiffFields: config.reports.diff.nonDiffFields,
        postMap: objectsPostMap,
        preMap: objectsPreMap,
        styles: {
            changed: changedStyle,
            notChanged: notChangedStyle
        },
        worksheet: objectsWS,
        headers: objectsHeaders
    });

    // Build the rows for the Information Worksheet
    buildXLSXRow(infoWS, infoArray.initial, notChangedStyle, 2, []);
    buildXLSXRow(infoWS, infoArray.current, notChangedStyle, 3, []);

    return await workbook.writeToBuffer();
};

/**
 * Function to build the body of an XLSX file from UAR Row objects
 * @param {Object} xlsxConfig Configuration for XLSX Body
 * Keys within xlsxConfig
 * nonDiffFields: From Config will display just the pre value and will not diff against post
 * postMap: Map of UARRows from Salesforce to compare with against the perMap
 * preMap: Map of UARRows from MongoDB to compare with against the postMap
 * styles: Object with different styles for the cells
 * worksheet: Object for the applicable worksheet
 */
const buildXLSXBody = (xlsxConfig) => {
    logging.info(NAMESPACE, 'buildXLSXBody: START');
    let rowIndex = 2;
    Object.entries(xlsxConfig.preMap).forEach((entry) => {
        // Extract key and preRow info
        const [key, preRow] = entry;
        let columnIndex = 1;
        let changed = false;
        const headers = xlsxConfig.headers;
        //const preRowFields = Object.entries(preRow);
        //console.log('buildXLSXBody', preRow);
        // Loop through each pre Row field and compare with the post row field value
        headers.forEach((header) => {
            if (header === 'Changed') return;
            const preValue = preRow[header];
            const postRow = xlsxConfig.postMap[key];
            const postValue = postRow[header];

            const preValueString = preValue?.toString();
            const postValueString = postValue?.toString();
            if (xlsxConfig.nonDiffFields.includes(header)) {
                // Fields to ignore diffs on
                buildXLSXCell(xlsxConfig.worksheet, preValueString, xlsxConfig.styles.notChanged, rowIndex, columnIndex);
            } else if (preValueString === postValueString) {
                // Fields that haven't changed
                buildXLSXCell(xlsxConfig.worksheet, preValueString, xlsxConfig.styles.notChanged, rowIndex, columnIndex);
            } else {
                // Fields that have changed
                buildXLSXCell(xlsxConfig.worksheet, preValueString + ' --> ' + postValueString, xlsxConfig.styles.changed, rowIndex, columnIndex);
                changed = true;
            }
            columnIndex++;
        });
        /*preRowFields.forEach((preRowField) => {
            const [fieldName, preValue] = preRowField;

            const postRow = xlsxConfig.postMap[key];
            const postValue = postRow[fieldName];

            const preValueString = preValue?.toString();
            const postValueString = postValue?.toString();

            if (xlsxConfig.nonDiffFields.includes(fieldName)) {
                // Fields to ignore diffs on
                buildXLSXCell(xlsxConfig.worksheet, preValueString, xlsxConfig.styles.notChanged, rowIndex, columnIndex);
            } else if (preValueString === postValueString) {
                // Fields that haven't changed
                buildXLSXCell(xlsxConfig.worksheet, preValueString, xlsxConfig.styles.notChanged, rowIndex, columnIndex);
            } else {
                // Fields that have changed
                buildXLSXCell(xlsxConfig.worksheet, preValueString + ' --> ' + postValueString, xlsxConfig.styles.changed, rowIndex, columnIndex);
                changed = true;
            }
            columnIndex++;
        });*/
        const changedString = changed === null || changed === undefined ? 'ERROR' : changed.toString();
        buildXLSXCell(xlsxConfig.worksheet, changedString, xlsxConfig.styles.notChanged, rowIndex, columnIndex);
        rowIndex++;
    });
};

/**
 * Function to build a singular XLSX Cell
 * @param {Object} worksheet excel4node worksheet object
 * @param {String} value Contents of the Cell (String)
 * @param {Object} style excel4node style Object from config
 * @param {Number} rowIndex Index of the row
 * @param {Number} columnIndex Index of the Column
 */
const buildXLSXCell = (worksheet, value, style, rowIndex, columnIndex) => {
    //logging.info(NAMESPACE, 'buildXLSXCell: START -- Cell: (' + rowIndex + ',' + columnIndex + ') -- ' + value);
    worksheet.cell(rowIndex, columnIndex).string(value).style(style);
};

/**
 * Function to build out the Header row for a excel4node worksheet
 * @param {Object} row Settings/Access UAR Row to build Headers from
 * @param {Object} worksheet excel4node worksheet object
 * @param {Object} style excel4node style Object from config
 * @param {String} type type of excel report
 * @returns Map of Headers to their indices
 */
const buildXLSXHeaders = (row, worksheet, style, type) => {
    logging.info(NAMESPACE, 'buildXLSXHeaders: START');
    let columnIndex = 1;

    // Loop through field names to build out headers.
    const headerLabels = Object.keys(row);
    headerLabels.forEach((label) => {
        // Set width of this column. String length of label + 6
        worksheet.column(columnIndex).setWidth(label.length + 6);

        // Build header cell
        buildXLSXCell(worksheet, label, style, 1, columnIndex);

        columnIndex++;
    });

    // For diff reports sent to Auditors, append Changed column to end
    if (type === 'diff') {
        worksheet.cell(1, columnIndex).string('Changed').style(style);
        return [...headerLabels, 'Changed'];
    }
    return headerLabels;
};

/**
 * Function to build a singular row of an XLSX from one Object
 * @param {Object} worksheet excel4node worksheet object
 * @param {Object} row Object from which to make a row
 * @param {Object} style excel4node style Object from config
 * @param {Number} rowIndex Index of the row
 * @param {Array} excludedFields Array of String keys to exclude from th eXLSX
 */
const buildXLSXRow = (worksheet, row, style, rowIndex, excludedFields) => {
    logging.info(NAMESPACE, 'buildXLSXRow: START');
    let columnIndex = 1;

    const rowFields = Object.entries(row);
    rowFields.forEach((field) => {
        const [name, value] = field;

        // If field is not in the exluded list, add to the row.
        if (!excludedFields.includes(name.toString())) {
            const cellValue = value == null ? ' ' : value.toString();

            buildXLSXCell(worksheet, cellValue, style, rowIndex, columnIndex);

            columnIndex++;
        }
    });
};

/**
 * Creates an UARReport and inserts it into MongoDB
 * @param {object} newUARReport details for the new UARReport
 * @returns the UARReport that was created or throws an error.
 */
const createUARReport = async (newUARReport) => {
    try {
        const uarReport = new UARReport({
            accId: newUARReport.accId,
            projId: newUARReport.projId,
            name: newUARReport.name,
            status: newUARReport.status,
            keySystemSettings: newUARReport.keySystemSettings,
            keyObjects: newUARReport.keyObjects,
            dueDate: newUARReport.dueDate,
            managersWithAccess: newUARReport.managersWithAccess
        });
        return await uarReport.save();
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Generates the object for the UAR Report
 * @param {String} accId Id of the account to generate the report for
 * @param {object} body details for the new UARReport
 * @param {[String]} managersWithAccess list of managers with access to the report
 * @returns UAR Report
 */
const createReportObject = (accId, body, managersWithAccess) => {
    return {
        accId,
        orgId: body.orgId,
        projId: body.projId,
        name: body.newReport.name,
        status: 'Ready to Send',
        keySystemSettings: body.selectedSystemSettings.map((systemSetting) => body.allSystemSettings[systemSetting]), // We need to grab the setting info from allSystemSettings which contains the label name as well
        keyObjects: body.selectedObjects,
        dueDate: body.newReport.dueDate,
        managersWithAccess
    };
};

/**
 * Deletes an UARReport from MongoDB
 * @param {String} uarReportId  Id of the UARReport to delete.
 * @returns the UARReport that was deleted or throws an error.
 */
const deleteUARReport = async (uarReportId) => {
    return await UARReport.findOneAndDelete({ _id: uarReportId });
};

/**
 * Deletes multiple UARReports from MongoDB
 * @param {Array} uarReportIds  Ids of the UARReports to delete.
 * @returns the number of UARReports that were deleted or throws an error.
 */
const deleteUARReports = async (uarReportIds) => {
    try {
        return await UARReport.deleteMany({ _id: { $in: uarReportIds } });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Generates a map of all Objects Settings by their Permission
 * @param {Array} keyObjects list of key objects
 * @param {Array} permissions list of Profiles and Permission Sets
 * @return {Object} map of all Object Settings by permission.
 */
const generateKeyObjectsPermissionMap = (keyObjects, permissions) => {
    // Initialize map
    const keyObjectsByPermission = permissions.reduce((acc, permission) => {
        // Permission Id has different path for permission set and profiles
        const permissionId = Object.prototype.hasOwnProperty.call(permission, 'ParentId') ? permission.ParentId : permission.Parent.ProfileId;

        // Check if we need to add new prop for permID
        if (!Object.prototype.hasOwnProperty.call(acc, permissionId)) acc[permissionId] = {};

        keyObjects.forEach((keyObject) => {
            acc[permissionId][keyObject] = '';
        });

        return acc;
    }, {});

    permissions.forEach((permission) => {
        const permissionId = Object.prototype.hasOwnProperty.call(permission, 'ParentId') ? permission.ParentId : permission.Parent.ProfileId;

        // Construct permissions string based on permission granted
        const permissionsGranted = `${permission.PermissionsCreate ? 'C' : ''}${permission.PermissionsRead ? 'R' : ''}${permission.PermissionsEdit ? 'E' : ''}${
            permission.PermissionsDelete ? 'D' : ''
        }${permission.PermissionsViewAllRecords ? 'V' : ''}${permission.PermissionsModifyAllRecords ? 'M' : ''}`;

        keyObjectsByPermission[permissionId][permission.SobjectType] = permissionsGranted;
    });

    return keyObjectsByPermission;
};

/**
 * Generates a map of all System Settings by their Permission
 * @param {Array} keySettings list of keySettings
 * @param {Array} permissions list of Profiles and Permission Sets
 * @return {Object} map of all System Settings by permission.
 */
const generateKeySettingsPermissionMap = (keySettings, permissions) => {
    // loop through key system settings
    let keySettingByPermission = {};
    keySettings.forEach((keySetting) => {
        permissions.forEach((permission) => {
            if (Object.prototype.hasOwnProperty.call(keySettingByPermission, permission.Id)) {
                keySettingByPermission[permission.Id][keySetting] = permission[keySetting];
            } else {
                keySettingByPermission[permission.Id] = { [keySetting]: permission[keySetting] };
            }
        });
    });
    return keySettingByPermission;
};

/**
 * Queries MongoDB for an UARReport
 * @param {String} uarReportId  Id of the UARReport to retrieve.
 * @returns a response, either the UARReport object that was queried for, or an error with code 301
 */
const getUARReport = async (uarReportId) => {
    try {
        return await UARReport.findOne({ _id: uarReportId });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Gets a UAR Report with its related Approval Rows and Approvals.
 * @param {String} uarReportId Id of the UAR Report
 * @param {String} approvalRowFilterCriteria JSON stringified approval row filter criteria
 * @returns uar report with approval rows and approvals
 */
const getReportWithApprovalRowsAndApprovals = async (uarReportId, approvalRowFilterCriteria) => {
    const aggregateResult = await UARReport.aggregate([
        // Match the specific report by its ID
        {
            $match: { _id: mongoose.Types.ObjectId(uarReportId) }
        },
        // Lookup to fetch related approval rows
        {
            $lookup: {
                from: 'approval row',
                localField: '_id',
                foreignField: 'uarReportId',
                as: 'approvalRows'
            }
        },
        // Unwind the approval rows array to perform a nested lookup
        {
            $unwind: {
                path: '$approvalRows',
                preserveNullAndEmptyArrays: true
            }
        },
        // Add $match stage to filter the approval rows
        {
            $match: {
                ...JSON.parse(approvalRowFilterCriteria)
            }
        },
        // Lookup to fetch related approvals for each approval row
        {
            $lookup: {
                from: 'approvals',
                localField: 'approvalRows._id',
                foreignField: 'approvalRowId',
                as: 'approvalRows.approvals'
            }
        },
        // Group back the approval rows to form the original structure
        {
            $group: {
                _id: '$_id',
                approvalRows: { $push: '$approvalRows' },
                report: { $first: '$$ROOT' }
            }
        },
        // Merge the report fields into the final document
        {
            $replaceRoot: {
                newRoot: { $mergeObjects: ['$report', { approvalRows: '$approvalRows' }] }
            }
        },
        {
            $project: {
                accId: 0, // Exclude accId on report
                'approvalRows.accId': 0, // Exclude accId
                'approvalRows.approvals.accId': 0 // Exclude accId
            }
        }
    ]);

    return aggregateResult[0];
};

/**
 * Gets a UAR Report with its related UAR Rows and Approvals
 * @param {String} uarReportId Id of the UAR Report
 * @returns uar report with uar rows and approvals
 */
const getReportWithUARRowsAndApprovals = async (uarReportId) => {
    const aggregateResult = await UARReport.aggregate([
        // Match the specific report by its ID
        {
            $match: { _id: mongoose.Types.ObjectId(uarReportId) }
        },
        // Lookup to fetch related uar rows
        {
            $lookup: {
                from: 'uar row',
                localField: '_id',
                foreignField: 'uarReportId',
                as: 'uarRows'
            }
        },
        // Lookup to fetch related approval rows
        {
            $lookup: {
                from: 'approval row',
                localField: '_id',
                foreignField: 'uarReportId',
                as: 'approvalRows'
            }
        },
        // Unwind the approval rows array to perform a nested lookup
        {
            $unwind: {
                path: '$approvalRows',
                preserveNullAndEmptyArrays: true
            }
        },
        // Lookup to fetch related approvals for each approval row
        {
            $lookup: {
                from: 'approvals',
                localField: 'approvalRows._id',
                foreignField: 'approvalRowId',
                as: 'approvalRows.approvals'
            }
        },
        // Group back the approval rows to form the original structure
        {
            $group: {
                _id: '$_id',
                approvalRows: { $push: '$approvalRows' },
                report: { $first: '$$ROOT' }
            }
        },
        // Merge the report fields into the final document
        {
            $replaceRoot: {
                newRoot: { $mergeObjects: ['$report', { approvalRows: '$approvalRows', uarRows: '$uarRows' }] }
            }
        },
        {
            $project: {
                accId: 0, // Exclude accId on report
                'approvalRows.accId': 0, // Exclude accId
                'approvalRows.approvals.accId': 0, // Exclude accId
                'uarRows.accId': 0 // Exclude accId
            }
        }
    ]);

    return aggregateResult[0];
};

/**
 * Queries MongoDB for all UARReports associated to a Project.
 * @param {String} projId Id of the Project to grab all of the UARReports for.
 * @param {String} filterCriteria Stringified JSON containing filter parameters for the report query.
 * @returns either a list of UARReport objects, or an error with code 301
 */
const getUARReports = async (projId, filterCriteria) => {
    try {
        return await UARReport.find({ projId: projId, ...JSON.parse(filterCriteria) });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Queries MongoDB for all UARReports associated to a Account.
 * @param {String} accId Id of the Account to grab all of the UARReports for.
 * @param {String} filterCriteria  Stringified JSON containing filter parameters for the report query.
 * @returns either a list of UARReport objects, or an error with code 301
 */
const getUARReportsByAcc = async (accId, filterCriteria) => {
    try {
        return await UARReport.find({ accId: accId, ...JSON.parse(filterCriteria) }).sort({ lastViewed: 'desc' });
    } catch (err) {
        //logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Sends an email notification to Managers for uar report approvals.
 * @param {Array} toAddresses array of addresses to send notification to
 * @param {String} reportId id of the uar report to review.
 * @returns Promise
 */
const sendEmailNotification = (toAddresses, reportId, dueDate, adminEmail) => {
    const subjectDate = dayjs(dueDate).format('L').toString();
    const bodyDate = dayjs(dueDate).format('LLLL').toString();
    try {
        const subject = `[ACTION REQUIRED] Complete SOX access review by ${subjectDate}`;
        const mjBody = `<mj-section mj-class="body">
                            <mj-column>
                                <mj-text color="#212b35" font-weight="bold" font-size="20px">Review Access</mj-text>
                                <mj-text>You've been invited to review and approve Salesforce access for your direct reports.<br><br> This is time-sensitive and must be completed by ${bodyDate}. <br><br>The review process will take 5-10 minutes.To begin, you can access the report here:<br><br></mj-text>
                                <mj-button color="#000000" background-color="#ffad0d" href="${config.frontend.domain}/uar-report-approval/${reportId}">Begin Review Process</mj-button>
                                <mj-text><br>If you think this email was sent to you in error, please reach out to your SOX administrator: ${adminEmail}.</mj-text>
                            </mj-column>
                        </mj-section>`;
        const textVersion = `You've been invited to review and approve Salesforce access for your direct reports. This is time-sensitive and must be completed by ${bodyDate}. To begin the review process, you can access the report at the folloinwg link: ${config.frontend.domain}/uar-report-approval/${reportId}`;
        const emailOptions = emailService.createEmailOptions(config.email.sesFromAddress, toAddresses, [], [], subject, textVersion, 'Review Acess', mjBody, []);
        return emailService.sendEmail(emailOptions);
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/**
 * Function to split System Settings by profile or permission set
 * @param {Array} allSystemSettings Array of all the System Settings
 * @param {Boolean} commit flag dicatating whether the report is going to be committed or not.
 * @param {Array} selectedSystemSettings Array of the System Settings that were selected
 * @returns
 */
const splitSystemSettings = (allSystemSettings, commit, selectedSystemSettings) => {
    return selectedSystemSettings.reduce(
        (keySettingsByType, systemSetting) => {
            if (commit) {
                if (allSystemSettings[systemSetting]?.profile) keySettingsByType.profile.push(systemSetting);
                if (allSystemSettings[systemSetting]?.permSet) keySettingsByType.permSet.push(systemSetting);
            } else {
                if (systemSetting?.profile) keySettingsByType.profile.push(systemSetting.name);
                if (systemSetting?.permSet) keySettingsByType.permSet.push(systemSetting.name);
            }

            return keySettingsByType;
        },
        { profile: [], permSet: [] }
    );
};

/**
 * Updates a UAR Report in mongoDB
 * @param {object} updatedUARReport details for the updated UARReport
 * @returns the UARReport that was updated or throws an error.
 */
const updateUARReport = async (updatedUARReport) => {
    try {
        return await UARReport.findOneAndUpdate({ _id: updatedUARReport._id }, { $set: updatedUARReport }, { new: true });
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

/*
 * Updates multiple UAR Reports in mongoDB
 * @param {object} fieldUpdates the fields to update in MongoDB
 * @param {object} filterCriteria the filter criteria to determine what docs to update
 * @returns the UARReports that were updated or throws an error.
 */
const updateUARReports = async (fieldUpdates, filterCriteria) => {
    try {
        return await UARReport.updateMany(filterCriteria, fieldUpdates);
    } catch (err) {
        logging.error(NAMESPACE, err.name + ' ' + err.message);
        throw new Error(err);
    }
};

module.exports = {
    archiveUARReports,
    buildDiffXLSX,
    buildXLSXCell,
    buildXLSXHeaders,
    buildXLSXBody,
    buildXLSXRow,
    createUARReport,
    createReportObject,
    deleteUARReport,
    deleteUARReports,
    generateKeyObjectsPermissionMap,
    generateKeySettingsPermissionMap,
    getUARReport,
    getReportWithApprovalRowsAndApprovals,
    getReportWithUARRowsAndApprovals,
    getUARReports,
    getUARReportsByAcc,
    sendEmailNotification,
    splitSystemSettings,
    updateUARReport,
    updateUARReports
};
