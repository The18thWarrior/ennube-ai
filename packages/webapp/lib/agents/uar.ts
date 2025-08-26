// === uar.ts ===
// Created: 2025-08-25 12:00
// Purpose: Client-side agent to generate a UAR (User Access Review) report by
// orchestrating Salesforce queries via the Salesforce client in
// `packages/webapp/lib/salesforce.ts`.
// Exports:
//   - generateUARReport(authResult, body): Promise<GenerateUARReportResult>
// Notes:
//   - This module intentionally implements a lightweight, testable subset of
//     the server-side `generateUARReport` logic. It focuses on querying
//     Salesforce, building a minimal report object, and returning rows and
//     query metadata. It does not persist to any backend — the caller is
//     expected to persist the result if desired.

/**
 * OVERVIEW
 *
 * - Purpose
 *   Provide a reusable function to generate the data payload for a UAR report
 *   by querying Salesforce using the existing `createSalesforceClient` helper.
 *
 * - Assumptions
 *   1. The caller will provide a Salesforce authentication result (access
 *      token + instance url) compatible with `createSalesforceClient`.
 *   2. The caller must provide simple SOQL templates in `soqlTemplates` when
 *      necessary. Templates should include the placeholder `{items}` where a
 *      comma-separated, quoted list of items should be injected (for example
 *      when querying by a list of names).
 *   3. The shape of `allSystemSettings`, `selectedObjects` and
 *      `selectedSystemSettings` follows the conventions returned by the
 *      backend: items include `name` and (optionally) `type` which can be
 *      'Profile' or 'PermissionSet'. If types are missing we try a best-effort
 *      split.
 *
 * - Edge cases handled
 *   - Large lists are batched (default batch size = 50) to avoid URL/SOQL limits.
 *   - If SOQL templates are missing, the function will either run a default
 *     permissive query for user permission assignments or throw with a clear
 *     message for missing templates needed to query settings/objects.
 *
 * - Future improvements
 *   - Add richer mapping logic for permission -> setting resolution to match
 *     the server-side behaviour exactly.
 */

import { createSalesforceClient, SalesforceClient } from '../salesforce';
import { RefreshTokenResponse, SalesforceAuthResult, SalesforceQueryResult, SalesforceUserInfo } from "../types";
import ALL_SALESFORCE_SYSTEM_SETTINGS from '../../resources/all-salesforce-system-settings.json'

// Types for the function inputs/outputs
export type SoqlTemplates = Partial<{
  profileSettings: string; // template containing {items}
  permSetSettings: string; // template containing {items}
  profileObjects: string; // template containing {items}
  permSetObjects: string; // template containing {items}
  userPerms: string; // full SOQL for user permission assignments (no placeholder required)
}>;

export type GenerateUARReportBody = {
  allSystemSettings: Array<{ name: string; type?: 'Profile' | 'PermissionSet' | string }>; // all available settings
  selectedObjects: string[]; // SObject API names
  selectedSystemSettings: Array<{ name: string; label?: string }>; // filtered selection
  managerInfo?: { managerData?: any };
  reportMeta?: Record<string, any>; // optional metadata for the report object
  soqlTemplates?: SoqlTemplates;
  batchSize?: number; // optional override for batching
};

export type UARow = Record<string, any>;

export type GenerateUARReportResult = {
  report: Record<string, any>;
  queries: Record<string, string[]>;
  systemRows: UARow[];
  objectRows: UARow[];
  statusCode: number;
};

// Utilities
const chunkArray = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const quoteAndJoin = (items: string[]) => items.map((v) => `'${v.replace(/'/g, "\\'")}'`).join(', ');

const filterForRelevantSystemSettings = (
    permissionSetSystemSettings: Array<{ name: keyof typeof ALL_SALESFORCE_SYSTEM_SETTINGS }>,
    profileSystemSettings: Array<{ name: keyof typeof ALL_SALESFORCE_SYSTEM_SETTINGS }>
) => {
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
    }, {} as Record<keyof typeof ALL_SALESFORCE_SYSTEM_SETTINGS, any>);

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

const templates = {
    queries: {
        profilesSystemSettings: (fields: string) => `SELECT Id,Name,UserType,${fields} FROM Profile LIMIT 50000`,
        permissionSetsSystemSettings: (fields: string) =>
            `SELECT HasActivationRequired,Id,IsCustom,IsOwnedByProfile,Label,LicenseId,Name,NamespacePrefix,ProfileId,${fields} FROM PermissionSet WHERE IsOwnedByProfile=false LIMIT 50000`,
        profilesObjects: (sobjects: string[]) =>
            `SELECT Id, Parent.ProfileId, Parent.Profile.Name, PermissionsCreate, PermissionsRead, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords, SobjectType FROM ObjectPermissions WHERE Parent.IsOwnedByProfile=true AND SobjectType IN (${sobjects.map(s => `'${s}'`).join(',')}) ORDER BY Parent.Profile.Name, SobjectType LIMIT 50000`,
        permissionSetsObjects: (sobjects: string[]) =>
            `SELECT Id, ParentId, Parent.label, PermissionsCreate, PermissionsRead, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords, SobjectType FROM ObjectPermissions WHERE Parent.IsOwnedByProfile=false AND SobjectType IN (${sobjects.map(s => `'${s}'`).join(',')}) ORDER BY Parent.Label, SobjectType LIMIT 50000`,
        userPermissionAssignments:
            'SELECT PermissionSet.ProfileId, PermissionSet.Id, PermissionSet.Name, PermissionSet.Label, PermissionSet.Profile.Name, Assignee.Id, Assignee.Name, Assignee.Email, Assignee.isActive FROM PermissionSetAssignment',
        userInfo: 'SELECT ID, FullPhotoUrl, FirstName, LastName, Email FROM User WHERE ID = ',
        managerInfo: 'SELECT Id, IsActive, Name, Email, LastLoginDate, UserRole.Name{0} FROM User LIMIT 50000',
        objectInfo: 'SELECT SObjectType FROM ObjectPermissions GROUP BY SObjectType ORDER BY SObjectType ASC',
        sObjectFields:
            "SELECT DataType, Label, EntityDefinition.Label, EntityDefinition.QualifiedApiName, NamespacePrefix, QualifiedApiName FROM FieldDefinition WHERE QualifiedApiName NOT IN ('Jigsaw') AND EntityDefinitionId IN ({0}) AND ({1})",
        auditHistory: `SELECT ID, CreatedDate, Action, CreatedByContext, DelegateUser, Display, Section, CreatedBy.Name FROM SetupAuditTrail ORDER BY CreatedDate DESC LIMIT 50000`
    },
    recommendedPermissions: ['PermissionsEmailSingle', 'PermissionsEmailMass', 'PermissionsEditTask', 'PermissionsEditEvent', 'PermissionsExportReport'],
    recommendedObjects: ['Account', 'Campaign', 'Case', 'Contact', 'Opportunity']
}

/**
 * Best-effort split of system settings into profile and permSet buckets.
 * If each item has a `type` we honor it. Otherwise we heuristically route
 * by looking for the word 'profile' in the name (case-insensitive).
 */
export const splitSystemSettings = (
  allSystemSettings: GenerateUARReportBody['allSystemSettings'] = [],
  includeLabels = true,
  selectedSystemSettings: GenerateUARReportBody['selectedSystemSettings'] = []
) => {
  const profile: typeof allSystemSettings = [];
  const permSet: typeof allSystemSettings = [];

  const selectedNames = new Set((selectedSystemSettings || []).map((s) => s.name));

  (allSystemSettings || []).forEach((s) => {
    // const isSelected = selectedNames.size === 0 || selectedNames.has(s.name);
    // if (!isSelected) return;
    if (s.type === 'Profile' || /profile/i.test(s.type || '') || /profile/i.test(s.name)) profile.push(s);
    else permSet.push(s);
  });

  return { profile, permSet };
};

/**
 * Executes a templated SOQL query in batches. Template must contain '{items}' to
 * be replaced with a quoted, comma-separated list of values. Returns combined
 * data and a list of executed query strings.
 */
const runBatchedTemplateQueries = async (
  client: SalesforceClient,
  template: string,
  items: string[],
  batchSize = 50,
  placeholder = '{items}'
) => {
  const queries: string[] = [];
  const data: any[] = [];

  if (!template) return { data, queries };

  const chunks = chunkArray(items, batchSize);
  for (const chunk of chunks) {
    const where = quoteAndJoin(chunk);
    const soql = template.replace(new RegExp(placeholder, 'g'), where);
    queries.push(soql);
    // client.query returns typed result with records and metadata
    // we normalize to an object with `records` and other properties when possible
    // If the query fails, bubble the error up to the caller
    // eslint-disable-next-line no-await-in-loop
    const result: any = await client.query(soql);
    if (result && Array.isArray(result.records)) data.push(...result.records);
    else if (Array.isArray(result)) data.push(...result);
    else if (result && result.data) data.push(...result.data);
  }
  return { data, queries };
};

/**
 * Minimal helper that groups permission metadata by permission identifier
 * (permission set name or profile name). This is a simplified version of the
 * server-side mapping used to determine which settings/objects apply to which
 * permission boundary.
 */
export const generateKeySettingsPermissionMap = (keySettings: Array<{ name: string }>, permissions: any[]) => {
  const map: Record<string, any[]> = {};
  // permissions is expected to be an array of permission-set/profile metadata
  // We attempt to use `PermissionSet.Name` or `Profile.Name` or `Name` as key
  permissions.forEach((p) => {
    const key = p?.PermissionSet?.Name || p?.Profile?.Name || p?.Name || p?.FullName || p?.Id || 'unknown';
    if (!map[key]) map[key] = [];
    map[key].push(p);
  });

  // Ensure each keySetting appears somewhere (best-effort)
  keySettings.forEach((ks) => {
    if (!(ks.name in map)) map[ks.name] = [];
  });

  return map;
};

export const generateKeyObjectsPermissionMap = (keyObjects: string[] = [], permissions: any[] = []) => {
  const map: Record<string, any[]> = {};
  permissions.forEach((p) => {
    const key = p?.PermissionSet?.Name || p?.Profile?.Name || p?.Name || p?.FullName || p?.Id || 'unknown';
    if (!map[key]) map[key] = [];
    map[key].push(p);
  });

  // Ensure each object appears as a key in the returned structure (for callers that
  // expect a mapping keyed by object name we attach them to a special key '_objects')
  map['_objects'] = keyObjects;
  return map;
};

/**
 * Minimal UAR generator that mirrors the server-side flow:
 * 1. Create Salesforce client
 * 2. Run profile/permset settings queries in batches
 * 3. Run profile/permset object queries in batches
 * 4. Run user permission assignments query
 * 5. Build mapping structures and UAR rows using simplified rules
 */
export async function generateUARReport(
  authResult: SalesforceAuthResult,
  body: GenerateUARReportBody
): Promise<GenerateUARReportResult> {
  if (!authResult) throw new Error('authResult is required to create a Salesforce client');

  const client = createSalesforceClient(authResult);
  const batchSize = body.batchSize || 50;
  //const templates = body.soqlTemplates || {};

  // Split system settings
  const systemSettingsByType = splitSystemSettings(Object.keys(ALL_SALESFORCE_SYSTEM_SETTINGS).map(key => {
    return {
        type: 'Profile',
        name: key
    }
  }), true, body.selectedSystemSettings);

  // Prepare promises for queries
  const permSetKeySettingsPromise = client.query(templates.queries.permissionSetsSystemSettings(
        systemSettingsByType.profile.map((s) => s.name).join(',')
    ))

  const profileKeySettingsPromise = client.query(templates.queries.profilesSystemSettings(
        systemSettingsByType.profile.map((s) => s.name).join(',')
    ))

  const permSetKeyObjectsPromise = (body.selectedObjects || []).length > 0 && templates.permSetObjects
    ? runBatchedTemplateQueries(client, templates.permSetObjects, body.selectedObjects, batchSize)
    : Promise.resolve({ data: [], queries: [] });

  const profileKeyObjectsPromise = (body.selectedObjects || []).length > 0 && templates.profileObjects
    ? runBatchedTemplateQueries(client, templates.profileObjects, body.selectedObjects, batchSize)
    : Promise.resolve({ data: [], queries: [] });

  const userPermsPromise = templates.userPerms ? (async () => {
    const r = await client.query(templates.userPerms as string);
    return { data: r.records || r || [], queries: [templates.userPerms] };
  })() : Promise.resolve({ data: [], queries: [] });

  const [profileKeySettings, permSetKeySettings, profileKeyObjects, permSetKeyObjects, userPerms] =
    await Promise.all([profileKeySettingsPromise, permSetKeySettingsPromise, profileKeyObjectsPromise, permSetKeyObjectsPromise, userPermsPromise]);

  const queries = {
    profileSettings: profileKeySettings.queries,
    permSetSettings: permSetKeySettings.queries,
    profileObjects: profileKeyObjects.queries,
    permSetObjects: permSetKeyObjects.queries,
    userPerms: userPerms.queries
  } as Record<string, string[]>;

  // Create flattened permission arrays
  const permissionsKS = [...(profileKeySettings.data || []), ...(permSetKeySettings.data || [])];
  const permissionsKO = [...(profileKeyObjects.data || []), ...(permSetKeyObjects.data || [])];
  const userPermRecords = userPerms.data || [];

  // Build maps for keys
  const keySettingByPermission = generateKeySettingsPermissionMap([...systemSettingsByType.profile, ...systemSettingsByType.permSet], permissionsKS);
  const keyObjectsByPermission = generateKeyObjectsPermissionMap(body.selectedObjects || [], permissionsKO);

  // Manager extraction is intentionally left to the caller; here we attempt a best-effort
  const managersWithAccess: string[] = [];

  // Create report object (minimal)
  const report = {
    ...body.reportMeta,
    createdAt: new Date().toISOString(),
    managersWithAccess
  };

  // Simplified row generation:
  // For each userPerm record, produce one system row per keySetting and one object row per object
  const systemRows: UARow[] = [];
  const objectRows: UARow[] = [];

  userPermRecords.forEach((upr: any) => {
    const base = {
      userId: upr.Id || upr.UserId || upr.Id,
      username: upr.Username || upr.Email || upr.Name,
      profile: upr.Profile?.Name || upr.Profile?.FullName || upr.Profile
    } as Record<string, any>;

    // System settings: attach any key settings found for the user's profile or permission sets
    Object.keys(keySettingByPermission).forEach((permKey) => {
      if (permKey === 'unknown') return;
      const entries = keySettingByPermission[permKey] || [];
      entries.forEach((entry) => {
        systemRows.push({ ...base, permissionKey: permKey, setting: entry });
      });
    });

    // Object access rows: create a row per selected object
    (body.selectedObjects || []).forEach((obj) => {
      objectRows.push({ ...base, object: obj, accessMetadata: keyObjectsByPermission[obj] || null });
    });
  });

  return {
    report,
    queries,
    systemRows,
    objectRows,
    statusCode: 200
  };
}

/*
 * === uar.ts ===
 * Updated: 2025-08-25 12:00
 * Summary: Provides generateUARReport which queries Salesforce and builds a
 * lightweight UAR report payload suitable for persistence by the caller.
 */
