'use client'

import { Connection, OAuth2, Schema } from "jsforce";
import { IngestJobV2Results } from "jsforce/lib/api/bulk2";

export const bulk = async (
        connection: Connection,
        type: 'ingest' | 'query',
        options: {
            sobjectType?: string,
            soql?: string,
            operation?: 'insert' | 'update' | 'upsert' | 'delete',
            externalIdFieldName?: string,
            records?: Array<{ [key: string]: any }>,
            timeout?: number
        }
): Promise<IngestJobV2Results<Schema> | any[]> => {
    const { sobjectType, operation, records, externalIdFieldName, soql, timeout } = options;
    if (type === 'ingest' && records && records.length > 0 && sobjectType && operation) {
        //const readStream = Readable.from(records);
        // Use jsforce's loadAndWaitForResults for ingest jobs
        // const job = externalIdFieldName ? connection.bulk2.createJob({
        //     operation,
        //     object: sobjectType,
        //     externalIdFieldName
        // }) : connection.bulk2.createJob({
        //     operation,
        //     object: sobjectType
        // });
        // let id = '';
        // // the `open` event will be emitted when the job is created.
        // job.on('open', (job) => {
        //     console.log(`Job ${job.id} succesfully created.`)
        //     id = job.id;
        // })

        // await job.open()

        // // it accepts CSV as a string, an array of records or a Node.js readable stream.
        // await job.uploadData(records)

        // await job.close()
        const jobInfo = await connection.bulk2.loadAndWaitForResults({
          object: sobjectType,
          operation,
          externalIdFieldName,
          input: records,
          pollInterval: 1000,
          pollTimeout: timeout || 600000 // default to 10 minutes
        });
        return jobInfo;
    } else if (type === 'query' && soql) {
        // Use jsforce's bulk2.query for bulk queries
        const jobInfo = (await connection.bulk2.query(soql)).toArray();
        return jobInfo;
    } else {
        throw new Error('Invalid bulk operation type');
    }
};

export const describeGlobal = async (connection: Connection) => {
    const result = await connection.describeGlobal();
    return result;
}

export const describe = async (connection: Connection, sobjectType: string) => {
    const result = await connection.describe(sobjectType);
    return result;
}

export const createConnection = async (accessToken: string, instanceUrl: string, refreshToken?: string) => {
    const connection = new Connection({
        instanceUrl,
        accessToken,
        refreshToken,
        oauth2: new OAuth2({
            clientId: "3MVG9g9rbsTkKnAXJGzjmLnIomKe_X_55gDPDT4LXLixdDpPh0IfB351FeEB6q8xudyJyTEqZNSHCocXiqAxc",
            redirectUri: "http://localhost:3000/api/salesforce/callback"
        }),
        version: '63.0'
    });
    return connection;
};
