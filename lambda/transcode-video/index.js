'use strict';

/**
 * triggered by S3 events to start elastic transcoder job and write a record in Dynamodb.
 * 
 * Required Env Vars:
 * ELASTIC_TRANSCODER_REGION
 * ELASTIC_TRANSCODER_PIPELINE_ID
 * SERVICE_ACCOUNT
 * DATABASE_URL
 */


const AWS = require('aws-sdk');

const elasticTranscoder = new AWS.ElasticTranscoder({
    region: process.env.ELASTIC_TRANSCODER_REGION
});

const generateTranscoderParams = (sourceKey, outputKey, transcoderPipelineID) => {
    const params = {
        PipelineId: transcoderPipelineID,
        // OutputKeyPrefix: outputKey + '/',
        Input: {
            Key: sourceKey
        },
        Outputs: [
            {
                Key: outputKey + '-1080p' + '.mp4',
                PresetId: '1351620000001-000001' //Generic 1080p
            },
            {
                Key: outputKey + '-720p' + '.mp4',
                PresetId: '1351620000001-000010' //Generic 720p
            },
            {
                Key: outputKey + '-web-720p' + '.mp4',
                PresetId: '1351620000001-100070' //Web Friendly 720p
            },
            // {
            //     Key: outputKey + '-hls-2m',
            //     PresetId: '1351620000001-200015' //HLS Video - 2M 
            // },
            // {
            //     Key: outputKey + '-hls-1m',
            //     PresetId: '1351620000001-200035' //HLS Video - 1M
            // },
        ]
    };

    return params;
};

const pushVideoEntryToDynamodb = async (uniqueKey, sourceKey, pipelineID) => {
    console.log("Adding video entry to Dynamodb at key: ", uniqueKey); 

    const docClient = new AWS.DynamoDB.DocumentClient();
    
    let theVideoRecord = {
        TableName: 'Videos',
        Item: {
            ID: uniqueKey,
            transcoding: true,
            sourceKey: sourceKey,
            pipelineID: pipelineID,
            userID: sourceKey.split("/")[0],
            created_at: new Date().toISOString()
        }
    };

    return docClient.put(theVideoRecord).promise(); 
}

const handler = async (event, context, callback) => {

    context.callbackWaitsForEmptyEventLoop = false;
    const pipelineID = process.env.ELASTIC_TRANSCODER_PIPELINE_ID;

    const key = event.Records[0].s3.object.key;
    console.log("Object key:", key);

    //the input file may have spaces so replace them with '+'
    const sourceKey = decodeURIComponent(key.replace(/\+/g, ' '));
    console.log("Source key:", sourceKey);

    //remove the extension
    const outputKey = sourceKey.split('.')[0];
    console.log("Output key:", outputKey);

    // get the unique video key (the folder name)
    const uniqueVideoKey = outputKey.split('/')[1];

    const params = generateTranscoderParams(sourceKey, outputKey, pipelineID);

    try {
        await elasticTranscoder.createJob(params).promise(); 

        console.log("Elastic transcoder job created successfully");
        await pushVideoEntryToDynamodb(uniqueVideoKey, key, pipelineID);

        callback(null, 'video is added');
    } catch (err) {
        callback(err);
    }

};


module.exports = {
    handler
};