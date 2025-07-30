// === contract-result-2.ts ===
// Created: 2025-07-29
// Purpose: TypeScript type for contract extraction results (version 2, snake_case)
// Exports:
//   - ContractResult2SnakeCase
//   - ContractResult2KeyMap
// Interactions:
//   - Used by: contract extraction, contract UI, contract API (v2)
// Notes:
//   - Mirrors the structure of the contract extraction JSON output (v2) with snake_case keys

/**
 * OVERVIEW
 *
 * - Purpose: Strongly-typed representation of contract extraction results (v2, snake_case).
 * - Assumptions: All fields are optional to allow for partial extraction.
 * - Edge Cases: Nested objects may be missing or partially filled.
 * - How it fits: Used for contract parsing, display, and validation (v2).
 * - Future: Add enums for Yes/No fields, stricter types for dates/amounts.
 */

export type ContractResult = {
  contract_summary?: string;
  contract_type?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  customer?: string;
  customer_address?: string;
  contract_terms?: string;
  products_sold?: string;
  contract_amount?: string;
  subscription?: string;
  subscription_product?: string;
  customer_signor?: string;
  customer_signed_date?: string;
  company_signor?: string;
  company_signed_date?: string;
  renewal_clause_details?: {
    auto_renew?: string;
    renewal_term_length?: string;
    renewal_price_increase_cap?: string;
    notice_period_for_non_renewal?: string;
  };
  early_termination_clause?: {
    early_termination_fees?: string;
    early_termination_conditions?: string;
  };
  payment_terms?: {
    billing_frequency?: string;
    payment_due_terms?: string;
    late_payment_penalties?: string;
  };
  discount_promotional_terms?: {
    discount_percentage_amount?: string;
    discount_end_date?: string;
    promotion_name?: string;
  };
  governing_law?: string;
  jurisdiction?: string;
  confidentiality_clause?: {
    confidentiality_term_length?: string;
  };
  indemnification_clause_present?: string;
  limitation_of_liability_present?: string;
  force_majeure_clause_present?: string;
  dispute_resolution_mechanism?: string;
  arbitration_location?: string;
  assignment_clause_present?: string;
  intellectual_property_ownership?: string;
  third_party_vendors_partners_involved?: string;
  referral_clause_present?: string;
  service_level_agreements_slas?: {
    sla_details?: string;
    sla_penalties_credits?: string;
    sla_reporting_frequency?: string;
  };
  scope_of_work_sow_reference?: {
    sow_id_name?: string;
    sow_effective_date?: string;
    sow_end_date?: string;
    sow_summary_key_activities?: string;
  };
  deliverables?: {
    deliverable_list?: string;
    deliverable_due_dates?: string;
  };
  key_performance_indicators_kpis?: {
    kpi_name?: string;
    kpi_target?: string;
    kpi_measurement_frequency?: string;
  };
  support_included?: string;
  support_level?: string;
  support_contact_method?: string;
  support_response_time?: string;
  training_included?: string;
  training_details?: string;
  implementation_details?: {
    implementation_timeline?: string;
    implementation_manager_company?: string;
    implementation_manager_customer?: string;
    site_access_requirements?: string;
  };
  saas_details?: {
    number_of_users_licenses?: string;
    license_type?: string;
    feature_set_tier?: string;
    data_storage_limits?: string;
    integration_capabilities?: string;
    customer_data_ownership?: string;
    data_export_rights?: string;
  };
  asset_device_details?: {
    device_models_skus?: string;
    quantity_of_devices_assets?: string;
    asset_locations?: string;
    installation_services_included?: string;
    maintenance_services_included?: string;
    maintenance_schedule?: string;
    warranty_period?: string;
    connectivity_provider_iot?: string;
    data_transmission_frequency_iot?: string;
    data_usage_limits_iot?: string;
    firmware_update_policy_iot?: string;
  };
  data_protection_privacy_clause?: {
    clause_present?: string;
    compliance_standards_mentioned?: string;
    data_processing_addendum_dpa_reference?: string;
  };
  security_clause_present?: string;
  audit_rights?: string;
  insurance_requirements?: string;
  contract_version?: string;
  last_modified_date_document?: string;
  contract_id_reference_number?: string;
  associated_opportunities_crm_id?: string;
  associated_quotes_crm_id?: string;
  date_extracted_processed?: string;
  extractor_model_version?: string;
  confidence_score?: number;
};

/**
 * Mapping from original keys to snake_case keys for ContractResult
 */
export interface ContractResultKeyMap {
  [originalKey: string]: keyof ContractResult | string | { [nestedKey: string]: string | object };
}

export const contractResultKeyMap: ContractResultKeyMap = {
  "Contract Summary": "contract_summary",
  "Contract Type": "contract_type",
  "Contract Start Date": "contract_start_date",
  "Contract End Date": "contract_end_date",
  "Customer": "customer",
  "Customer Address": "customer_address",
  "Contract Terms": "contract_terms",
  "Products Sold": "products_sold",
  "Contract Amount": "contract_amount",
  "Subscription?": "subscription",
  "Subscription Product": "subscription_product",
  "Customer Signor": "customer_signor",
  "Customer Signed Date": "customer_signed_date",
  "Company Signor": "company_signor",
  "Company Signed Date": "company_signed_date",
  "Renewal Clause Details": {
    "Auto-Renew?": "auto_renew",
    "Renewal Term Length": "renewal_term_length",
    "Renewal Price Increase Cap": "renewal_price_increase_cap",
    "Notice Period for Non-Renewal": "notice_period_for_non_renewal"
  },
  "Early Termination Clause": {
    "Early Termination Fees": "early_termination_fees",
    "Early Termination Conditions": "early_termination_conditions"
  },
  "Payment Terms": {
    "Billing Frequency": "billing_frequency",
    "Payment Due Terms": "payment_due_terms",
    "Late Payment Penalties": "late_payment_penalties"
  },
  "Discount/Promotional Terms": {
    "Discount Percentage/Amount": "discount_percentage_amount",
    "Discount End Date": "discount_end_date",
    "Promotion Name": "promotion_name"
  },
  "Governing Law": "governing_law",
  "Jurisdiction": "jurisdiction",
  "Confidentiality Clause": {
    "Confidentiality Term Length": "confidentiality_term_length"
  },
  "Indemnification Clause Present": "indemnification_clause_present",
  "Limitation of Liability Present": "limitation_of_liability_present",
  "Force Majeure Clause Present": "force_majeure_clause_present",
  "Dispute Resolution Mechanism": "dispute_resolution_mechanism",
  "Arbitration Location": "arbitration_location",
  "Assignment Clause Present": "assignment_clause_present",
  "Intellectual Property Ownership": "intellectual_property_ownership",
  "Third-Party Vendors/Partners Involved": "third_party_vendors_partners_involved",
  "Referral Clause Present": "referral_clause_present",
  "Service Level Agreements (SLAs)": {
    "SLA Details": "sla_details",
    "SLA Penalties/Credits": "sla_penalties_credits",
    "SLA Reporting Frequency": "sla_reporting_frequency"
  },
  "Scope of Work (SOW) Reference": {
    "SOW ID/Name": "sow_id_name",
    "SOW Effective Date": "sow_effective_date",
    "SOW End Date": "sow_end_date",
    "SOW Summary/Key Activities": "sow_summary_key_activities"
  },
  "Deliverables": {
    "Deliverable List": "deliverable_list",
    "Deliverable Due Dates": "deliverable_due_dates"
  },
  "Key Performance Indicators (KPIs)": {
    "KPI Name": "kpi_name",
    "KPI Target": "kpi_target",
    "KPI Measurement Frequency": "kpi_measurement_frequency"
  },
  "Support Included": "support_included",
  "Support Level": "support_level",
  "Support Contact Method": "support_contact_method",
  "Support Response Time": "support_response_time",
  "Training Included": "training_included",
  "Training Details": "training_details",
  "Implementation Details": {
    "Implementation Timeline": "implementation_timeline",
    "Implementation Manager (Company)": "implementation_manager_company",
    "Implementation Manager (Customer)": "implementation_manager_customer",
    "Site Access Requirements": "site_access_requirements"
  },
  "SaaS Details": {
    "Number of Users/Licenses": "number_of_users_licenses",
    "License Type": "license_type",
    "Feature Set/Tier": "feature_set_tier",
    "Data Storage Limits": "data_storage_limits",
    "Integration Capabilities": "integration_capabilities",
    "Customer Data Ownership": "customer_data_ownership",
    "Data Export Rights": "data_export_rights"
  },
  "Asset/Device Details": {
    "Device Models/SKUs": "device_models_skus",
    "Quantity of Devices/Assets": "quantity_of_devices_assets",
    "Asset Locations": "asset_locations",
    "Installation Services Included": "installation_services_included",
    "Maintenance Services Included": "maintenance_services_included",
    "Maintenance Schedule": "maintenance_schedule",
    "Warranty Period": "warranty_period",
    "Connectivity Provider (IoT)": "connectivity_provider_iot",
    "Data Transmission Frequency (IoT)": "data_transmission_frequency_iot",
    "Data Usage Limits (IoT)": "data_usage_limits_iot",
    "Firmware Update Policy (IoT)": "firmware_update_policy_iot"
  },
  "Data Protection/Privacy Clause": {
    "Clause Present": "clause_present",
    "Compliance Standards Mentioned": "compliance_standards_mentioned",
    "Data Processing Addendum (DPA) Reference": "data_processing_addendum_dpa_reference"
  },
  "Security Clause Present": "security_clause_present",
  "Audit Rights": "audit_rights",
  "Insurance Requirements": "insurance_requirements",
  "Contract Version": "contract_version",
  "Last Modified Date (Document)": "last_modified_date_document",
  "Contract ID/Reference Number": "contract_id_reference_number",
  "Associated Opportunities (CRM ID)": "associated_opportunities_crm_id",
  "Associated Quotes (CRM ID)": "associated_quotes_crm_id",
  "Date Extracted/Processed": "date_extracted_processed",
  "Extractor Model Version": "extractor_model_version",
  "Confidence Score": "confidence_score"
};
// === contract-result-2.ts ===
// Created: 2025-07-29
// Purpose: TypeScript type for contract extraction results (version 2)
// Exports:
//   - ContractResult
// Interactions:
//   - Used by: contract extraction, contract UI, contract API (v2)
// Notes:
//   - Mirrors the structure of the contract extraction JSON output (v2)

/**
 * OVERVIEW
 *
 * - Purpose: Strongly-typed representation of contract extraction results (v2).
 * - Assumptions: All fields are optional to allow for partial extraction.
 * - Edge Cases: Nested objects may be missing or partially filled.
 * - How it fits: Used for contract parsing, display, and validation (v2).
 * - Future: Add enums for Yes/No fields, stricter types for dates/amounts.
 */

export type ContractResultOriginal = {
  "Contract Summary"?: string;
  "Contract Type"?: string;
  "Contract Start Date"?: string;
  "Contract End Date"?: string;
  "Customer"?: string;
  "Customer Address"?: string;
  "Contract Terms"?: string;
  "Products Sold"?: string;
  "Contract Amount"?: string;
  "Subscription?"?: string;
  "Subscription Product"?: string;
  "Customer Signor"?: string;
  "Customer Signed Date"?: string;
  "Company Signor"?: string;
  "Company Signed Date"?: string;
  "Renewal Clause Details"?: {
    "Auto-Renew?"?: string;
    "Renewal Term Length"?: string;
    "Renewal Price Increase Cap"?: string;
    "Notice Period for Non-Renewal"?: string;
  };
  "Early Termination Clause"?: {
    "Early Termination Fees"?: string;
    "Early Termination Conditions"?: string;
  };
  "Payment Terms"?: {
    "Billing Frequency"?: string;
    "Payment Due Terms"?: string;
    "Late Payment Penalties"?: string;
  };
  "Discount/Promotional Terms"?: {
    "Discount Percentage/Amount"?: string;
    "Discount End Date"?: string;
    "Promotion Name"?: string;
  };
  "Governing Law"?: string;
  "Jurisdiction"?: string;
  "Confidentiality Clause"?: {
    "Confidentiality Term Length"?: string;
  };
  "Indemnification Clause Present"?: string;
  "Limitation of Liability Present"?: string;
  "Force Majeure Clause Present"?: string;
  "Dispute Resolution Mechanism"?: string;
  "Arbitration Location"?: string;
  "Assignment Clause Present"?: string;
  "Intellectual Property Ownership"?: string;
  "Third-Party Vendors/Partners Involved"?: string;
  "Referral Clause Present"?: string;
  "Service Level Agreements (SLAs)"?: {
    "SLA Details"?: string;
    "SLA Penalties/Credits"?: string;
    "SLA Reporting Frequency"?: string;
  };
  "Scope of Work (SOW) Reference"?: {
    "SOW ID/Name"?: string;
    "SOW Effective Date"?: string;
    "SOW End Date"?: string;
    "SOW Summary/Key Activities"?: string;
  };
  "Deliverables"?: {
    "Deliverable List"?: string;
    "Deliverable Due Dates"?: string;
  };
  "Key Performance Indicators (KPIs)"?: {
    "KPI Name"?: string;
    "KPI Target"?: string;
    "KPI Measurement Frequency"?: string;
  };
  "Support Included"?: string;
  "Support Level"?: string;
  "Support Contact Method"?: string;
  "Support Response Time"?: string;
  "Training Included"?: string;
  "Training Details"?: string;
  "Implementation Details"?: {
    "Implementation Timeline"?: string;
    "Implementation Manager (Company)"?: string;
    "Implementation Manager (Customer)"?: string;
    "Site Access Requirements"?: string;
  };
  "SaaS Details"?: {
    "Number of Users/Licenses"?: string;
    "License Type"?: string;
    "Feature Set/Tier"?: string;
    "Data Storage Limits"?: string;
    "Integration Capabilities"?: string;
    "Customer Data Ownership"?: string;
    "Data Export Rights"?: string;
  };
  "Asset/Device Details"?: {
    "Device Models/SKUs"?: string;
    "Quantity of Devices/Assets"?: string;
    "Asset Locations"?: string;
    "Installation Services Included"?: string;
    "Maintenance Services Included"?: string;
    "Maintenance Schedule"?: string;
    "Warranty Period"?: string;
    "Connectivity Provider (IoT)"?: string;
    "Data Transmission Frequency (IoT)"?: string;
    "Data Usage Limits (IoT)"?: string;
    "Firmware Update Policy (IoT)"?: string;
  };
  "Data Protection/Privacy Clause"?: {
    "Clause Present"?: string;
    "Compliance Standards Mentioned"?: string;
    "Data Processing Addendum (DPA) Reference"?: string;
  };
  "Security Clause Present"?: string;
  "Audit Rights"?: string;
  "Insurance Requirements"?: string;
  "Contract Version"?: string;
  "Last Modified Date (Document)"?: string;
  "Contract ID/Reference Number"?: string;
  "Associated Opportunities (CRM ID)"?: string;
  "Associated Quotes (CRM ID)"?: string;
  "Date Extracted/Processed"?: string;
  "Extractor Model Version"?: string;
  "Confidence Score"?: number;
};

/**
 * === contract-result-2.ts ===
 * Updated: 2025-07-29
 * Summary: Type for contract extraction results (version 2).
 * Key Components:
 *   - ContractResult2: main type
 * Dependencies:
 *   - None
 * Version History:
 *   v1.0 – initial
 * Notes:
 *   - All fields optional for partial extraction compatibility
 */
