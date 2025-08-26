const approvalService = require('../services/approval.service');
const approvalRowService = require('../services/approval_row.service');
const cognitoService = require('../services/cognito.service');
const managerDataService = require('../services/manager_data.service');
const organizationService = require('../services/organization.service');
const salesforceService = require('../services/salesforce.service');
const uarReportService = require('../services/uar_report.service');
const uarRowService = require('../services/uar_row.service');

const { getToken } = require('../utilities');

const excel = require('excel4node');

const log = require('../utilities/logging');
const config = require('../config');

const NAMESPACE = 'UAR Report Controller';

/**
 * Calls the necessary services to check for report access.
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns report access state
 */
const checkReportAccess = async (req, res) => {
    try {
        const { email, id } = req.query;

        const uarReport = await uarReportService.getUARReport(id);

        const response = uarReport.managersWithAccess.includes(email) ? true : false;

        res.status(201).send(response);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
};

/**
 * Queries MongoDB for all due UARReports.
 * @returns either a list of UARReport objects, or an error with code 301
 */
const completeDueReportApprovals = async () => {
    try {
        // get current date and round it down to the nearest hour.
        const currentDateTime = new Date();
        currentDateTime.setHours(currentDateTime.getHours(), 0, 0, 0);

        const fieldUpdates = { status: 'Approval Review' };
        const filterCriteria = { dueDate: currentDateTime };

        const response = await uarReportService.updateUARReports(fieldUpdates, filterCriteria);

        log.info(NAMESPACE, 'Complete Due Reports Jobs successfully ran.', response);
    } catch (err) {
        log.error(NAMESPACE, 'Complete Due Reports Jobs failed.', err);
    }
};

/**
 * Completes a report
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns the completed report, or an error with code 301
 */
const completeReport = async (req, res) => {
    try {
        const { completeAllTasks, uarReportId } = req.body;
        let response = {};

        if (completeAllTasks) {
            // Complete all related remediation tasks.
            response.approvals = await approvalService.updateApproval({ uarReportId: uarReportId, status: 'Rejected' }, { 'remediationTask.status': 'Complete' });
        }

        response.report = await uarReportService.updateUARReport({ _id: uarReportId, status: 'Completed' });

        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};

/**
 * Calls the necessary services to create an UARReport.
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns the newly created UARReport or an error.
 */
const createUARReport = async (req, res) => {
    try {
        const response = await uarReportService.createUARReport(req.body);

        res.status(201).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};

/**
 * Deletes a report
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns the delete report, or an error with code 301
 */
const deleteReport = (req, res) => {
    const { id } = req.query;
    const allDeletes = [
        uarRowService.deleteUARRowByReportId(id),
        approvalService.deleteApprovalsByReportId(id),
        approvalRowService.deleteApprovalRowsByReportId(id),
        uarReportService.deleteUARReport(id)
    ];

    Promise.all(allDeletes)
        .then((response) => {
            res.status(200).send(response);
        })
        .catch((err) => {
            res.status(500).send(err);
        });
};

/**
 * Calls the necessary services to export a UAR Report
 * @param {Object} req request details
 * @param {Object} res response details
 */
const exportUARReport = async (req, res) => {
    try {
        //Extract report Id and get all of the rows for the report
        const { report } = JSON.parse(req.body.reportData);
        const UARRows = await uarRowService.getUARRows(report._id, null);

        // Create Excel Workbook
        let workbook = new excel.Workbook();

        // Create the worksheet tabs on the Workbook
        let settingsWorksheet = workbook.addWorksheet('System Settings');
        let objectsWorksheet = workbook.addWorksheet('Object Access');

        // Set Workbook styles
        const headerStyle = workbook.createStyle(config.excel.header);
        const notChangedStyle = workbook.createStyle(config.excel.notchanged);

        // Set trackers for building the report
        let systemWorksheetHeadersHaveBeenCreated = false;
        let objectWorksheetHeadersHaveBeenCreated = false;

        // Starts at two since the header row and first row are created together without the index variable
        let systemRowIndex = 2;
        let objectRowIndex = 2;

        UARRows.forEach((row) => {
            if (row.reportType === 'System Setting') {
                // Extracts fields from row that are relevant to the report.
                const formattedRow = uarRowService.formatSystemSettingsRow(row, report.keySystemSettings, config.reports.export.baseHeaders);

                if (systemWorksheetHeadersHaveBeenCreated) {
                    // Build a row of data
                    uarReportService.buildXLSXRow(settingsWorksheet, formattedRow, notChangedStyle, systemRowIndex, config.reports.export.excludedFields);
                } else {
                    // Build the row of headers
                    uarReportService.buildXLSXHeaders(formattedRow, settingsWorksheet, headerStyle, 'export');

                    // Build the first row of data
                    uarReportService.buildXLSXRow(settingsWorksheet, formattedRow, notChangedStyle, systemRowIndex, config.reports.export.excludedFields);

                    systemWorksheetHeadersHaveBeenCreated = true;
                }
                systemRowIndex++;
            } else if (row.reportType === 'Object Access') {
                const formattedRow = uarRowService.formatObjectRow(row, config.reports.export.excludedFields, config.reports.export.baseHeaders);

                if (objectWorksheetHeadersHaveBeenCreated) {
                    // Build a row of data
                    uarReportService.buildXLSXRow(objectsWorksheet, formattedRow, notChangedStyle, objectRowIndex, config.reports.export.excludedFields);
                } else {
                    // Build the row of headers
                    uarReportService.buildXLSXHeaders(formattedRow, objectsWorksheet, headerStyle, 'export');

                    // Build the first row of data
                    uarReportService.buildXLSXRow(objectsWorksheet, formattedRow, notChangedStyle, objectRowIndex, config.reports.export.excludedFields);

                    objectWorksheetHeadersHaveBeenCreated = true;
                }
                objectRowIndex++;
            } else {
                console.log('Invalid Report Type: ', row.reportType);
            }
        });
        const response = await workbook.writeToBuffer();

        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};

/**
 * Generates a UAR Report
 * @param {Object} req request details
 * @param {Object} res response details
 */
const generateUARReport = async (req, res) => {
    try {
        const { authorization } = req.headers;

        const org = await organizationService.getOrganizationAuthDetails(req.body.orgId);

        // Get User details for Account Id
        const jwtToken = getToken(authorization);
        const user = await cognitoService.getUser(jwtToken);
        const attributesToRetrieve = new Set(['custom:accId']);
        const { accId } = cognitoService.getUserAttributes(user, attributesToRetrieve);

        // Create connection to Salesforce
        const conn = salesforceService.createExistingSalesforceConnection(org.accessToken, org.refreshToken, org.instanceUrl);

        console.log(org.accessToken);
        console.log(org.instanceUrl);

        // Pull data out of body
        const { allSystemSettings, selectedObjects, selectedSystemSettings } = req.body;

        // Split the System Settings by Profile/PermSet
        const systemSettingsByType = uarReportService.splitSystemSettings(allSystemSettings, true, selectedSystemSettings);

        // Retrieve Salesforce Data
        const permSetKeySettings =
            systemSettingsByType.permSet.length > 0
                ? salesforceService.getPermSetKeySettings(conn, systemSettingsByType.permSet)
                : new Promise((resolve) => {
                      resolve([]);
                  });
        const profileKeySettings =
            systemSettingsByType.profile.length > 0
                ? salesforceService.getProfileKeySettings(conn, systemSettingsByType.profile)
                : new Promise((resolve) => {
                      resolve([]);
                  });
        const permSetKeyObjects =
            selectedObjects.length > 0
                ? salesforceService.getPermSetKeyObjects(conn, selectedObjects)
                : new Promise((resolve) => {
                      resolve([]);
                  });
        const profileKeyObjects =
            selectedObjects.length > 0
                ? salesforceService.getProfileKeyObjects(conn, selectedObjects)
                : new Promise((resolve) => {
                      resolve([]);
                  });
        const userPermissions = salesforceService.getUserPermAssignments(conn);
        const sfResults = await Promise.all([profileKeySettings, permSetKeySettings, profileKeyObjects, permSetKeyObjects, userPermissions]);

        // Compile Queries for Diff Report
        const queries = {
            profileSettings: sfResults[0].queries,
            permSetSettings: sfResults[1].queries,
            profileObjects: sfResults[2].queries,
            permSetObjects: sfResults[3].queries,
            userPerms: sfResults[4].queries
        };

        //Create Data Structures out of Results from SFDC
        const permissionsKS = [...sfResults[0].data, ...sfResults[1].data];
        const permissionsKO = [...sfResults[2].data.records, ...sfResults[3].data.records];
        const userPerms = sfResults[4].data.records;

        // Create mapping of permission assignments
        const keySettingByPermission = uarReportService.generateKeySettingsPermissionMap([...systemSettingsByType.profile, ...systemSettingsByType.permSet], permissionsKS);
        const keyObjectsByPermission = uarReportService.generateKeyObjectsPermissionMap(selectedObjects, permissionsKO);

        // Get Managers with Access to the UAR Report
        const managersWithAccess = managerDataService.getManagersWithAccess(userPerms, req.body.managerInfo.managerData);

        // Create the UAR Report
        const uarObject = uarReportService.createReportObject(accId, req.body, managersWithAccess);
        const newUARReport = await uarReportService.createUARReport(uarObject);

        //Generate the UARRows
        const uarSystemRows = uarRowService.generateUARRows(userPerms, keySettingByPermission, 'System Setting', newUARReport, accId, req.body);
        const uarObjectRows = uarRowService.generateUARRows(userPerms, keyObjectsByPermission, 'Object Access', newUARReport, accId, req.body);

        const response = { report: newUARReport, queries: queries, systemRows: uarSystemRows, objectRows: uarObjectRows, statusCode: 200 };

        await uarRowService.createUARRows([...uarSystemRows, ...uarObjectRows]);

        res.status(201).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};

/**
 * Calls the necessary services to get an UARReport.
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns the retrieved UARReport or an error.
 */
const getUARReport = async (req, res) => {
    const { id } = req.query;
    try {
        const response = await uarReportService.getUARReport(id);

        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};

/**
 * Gets a UAR Report with its related Approval Rows and Approvals.
 * @param {Object} req request details
 * @param {Object} res response details
 */
const getReportWithApprovalRowsAndApprovals = async (req, res) => {
    const { uarReportId } = req.params;

    const { approvalRowFilterCriteria } = req.query;
    try {
        const response = await uarReportService.getReportWithApprovalRowsAndApprovals(uarReportId, approvalRowFilterCriteria);

        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(500).send({ errorMessage: err.message });
    }
};

/**
 * Gets a UAR Report with its related UAR Rows and Approvals.
 * @param {Object} req request details
 * @param {Object} res response details
 */
const getReportWithUARRowsAndApprovals = async (req, res) => {
    const { uarReportId } = req.params;

    try {
        const response = await uarReportService.getReportWithUARRowsAndApprovals(uarReportId);

        res.status(200).send(response);
    } catch (err) {
        console.log(err);
        res.status(500).send({ errorMessage: err.message });
    }
};

/**
 * Calls the necessary services to get UARReports for a project.
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns the retrieved UARReports or an error.
 */
const getUARReports = async (req, res) => {
    const { filterCriteria, projId } = req.query;
    try {
        const response = await uarReportService.getUARReports(projId, filterCriteria);

        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};

/**
 * Calls the necessary services to get UARReports for an account.
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns the retrieved UARReports or an error.
 */
const getUARReportsByAcc = async (req, res) => {
    try {
        const jwtToken = getToken(req.headers.authorization);
        const user = await cognitoService.getUser(jwtToken);

        const attributesToRetrieve = new Set(['custom:accId']);
        const { accId } = cognitoService.getUserAttributes(user, attributesToRetrieve);

        const { filterCriteria } = req.query;

        const response = await uarReportService.getUARReportsByAcc(accId, filterCriteria);

        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};

/**
 * Calls the necessary services to send email notifications to managers for uar approvals.
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns email notification result
 */
const sendEmailNotification = async (req, res) => {
    const { adminEmail, dueDate, emails, reportId } = req.body;

    try {
        // Get current managers with access list from report
        const uarReport = await uarReportService.getUARReport(reportId);

        const newReportDetails = {};
        // Only add the emails that don't already have access
        newReportDetails.managersWithAccess = [...uarReport.managersWithAccess, ...emails.filter((email) => !uarReport.managersWithAccess.includes(email))];

        // If it's the first time sending a report, set due date and new status.
        const firstTimeSendingReport = uarReport.status == 'Ready to Send';
        if (firstTimeSendingReport) {
            newReportDetails.status = 'Pending Approvals';
            newReportDetails.dueDate = dueDate;
        }

        // Update list of managers with Access on the report.
        const updatedReport = await uarReportService.updateUARReport({ _id: reportId, ...newReportDetails });

        // Send out emails
        await uarReportService.sendEmailNotification(emails, reportId, dueDate, adminEmail);

        res.status(200).send(updatedReport);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
};

/**
 * Calls the necessary services to update an UARReport.
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns the updated UARReport or an error.
 */
const updateUARReport = async (req, res) => {
    try {
        const response = await uarReportService.updateUARReport(req.body);

        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};

/**
 * Calls the necessary services to update multiple UARReports.
 * @param {Object} req request details
 * @param {Object} res response details
 * @returns the updated UARReport or an error.
 */
const updateUARReports = async (req, res) => {
    const { filter, updateDoc } = req.body;
    try {
        const response = await uarReportService.updateUARReports(updateDoc, filter);

        res.status(200).send(response);
    } catch (err) {
        res.status(500).send(err);
    }
};
module.exports = {
    checkReportAccess,
    completeDueReportApprovals,
    completeReport,
    createUARReport,
    deleteReport,
    exportUARReport,
    generateUARReport,
    getUARReport,
    getReportWithApprovalRowsAndApprovals,
    getReportWithUARRowsAndApprovals,
    getUARReports,
    getUARReportsByAcc,
    sendEmailNotification,
    updateUARReport,
    updateUARReports
};
