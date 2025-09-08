import { auth } from '@/auth';
import { createSalesforceClient } from '@/lib/salesforce';
import { UpdateProposal, ProposalResponse, ValidationError } from '@/types/sfdc-update';
import { parseUpdateRequest } from './parse-update-request';
import { getSalesforceCredentialsById } from '@/lib/db/salesforce-storage';

/**
 * Validate field names against sobject describe metadata
 */
async function validateProposalAgainstSfdc(proposal: UpdateProposal): Promise<ValidationError[]> {
  const session = await auth();
  const errors: ValidationError[] = [];
  try {
    const creds = await getSalesforceCredentialsById();
    if (!creds) {
      errors.push({ message: 'No Salesforce credentials found for user', code: 'no_credentials' });
      return errors;
    }

    const client = createSalesforceClient({ success: true, userId: session?.user?.id || '', accessToken: creds.accessToken, instanceUrl: creds.instanceUrl, refreshToken: creds.refreshToken });

    for (const change of proposal.changes) {
      try {
        const desc = await client.describe(change.sobject);
        const availableFields = (desc.fields || []).map((f: any) => f.name);
        for (const f of change.fields || []) {
          if (!availableFields.includes(f.fieldName)) {
            errors.push({ message: `Field '${f.fieldName}' not found on ${change.sobject}`, path: `${change.sobject}.${f.fieldName}`, code: 'field_not_found' });
          }
        }
      } catch (err) {
        errors.push({ message: `Failed to describe ${change.sobject}: ${err instanceof Error ? err.message : String(err)}`, code: 'describe_failed' });
      }
    }
  } catch (err) {
    errors.push({ message: `Validation failed: ${err instanceof Error ? err.message : String(err)}`, code: 'validation_error' });
  }

  return errors;
}

export async function proposeUpdate(nlRequest: string, context?: any): Promise<ProposalResponse> {
  const proposal = await parseUpdateRequest(nlRequest, context);
  const issues = await validateProposalAgainstSfdc(proposal);

  return {
    proposal,
    validation: {
      ok: issues.length === 0,
      issues
    }
  };
}
