'use strict';

/**
 * this function is triggered by SNS notification from elastic transcoder when a pipeline job is successfully completed. 
 * 
 * Required Env Vars:
 * SERVICE_ACCOUNT
 * DATABASE_URL
 * S3_TRANSCODED_BUCKET_URL : https://s3.amazonaws.com/YOUR_TRANSCODED_BUCKET_NAME_HERE
 */

const AWS = require('aws-sdk');

const handler = async (event, context, callback) => {

    context.callbackWaitsForEmptyEventLoop = false;

    console.log("the event is " + JSON.stringify(event));

    const docClient = new AWS.DynamoDB.DocumentClient();

    try {
        for (let record of event.Records) {
            const snsMsg = JSON.parse(record.Sns.Message);
            console.log(`snsMsg is ${JSON.stringify(snsMsg)}`);
            const videoID = snsMsg.input.key.split('/')[2];
            const outputKey = snsMsg.input.key.split('.')[0];
            const videoItem = await docClient.get({
                TableName: 'Videos',
                Key: {
                    ID: videoID
                }
            }).promise();
            videoItem.Item.transcoding = false;
            videoItem.Item.transcode_outputs = snsMsg.outputs;
            videoItem.Item.video_urls = [];
            for (let output of videoItem.Item.transcode_outputs) {
                output.video_url = process.env.S3_TRANSCODED_BUCKET_URL + '/' + output.key;
                videoItem.Item.video_urls.push(output.video_url);
            }
            videoItem.Item.playlist = process.env.S3_TRANSCODED_BUCKET_URL + '/' + outputKey +'.m3u8';
            videoItem.Item.thumbnail = process.env.S3_TRANSCODED_BUCKET_URL + '/' + outputKey +'-2048k-00001.png';
            videoItem.Item.updated_at = new Date().toISOString();
            console.log(`updated videoItem is ${JSON.stringify(videoItem)}`);
            const params = {
                TableName: 'Videos',
                Item: videoItem.Item
            };
            console.log(`params is ${JSON.stringify(params)}`);

            await docClient.put(params).promise();
        }

        callback(null, `transcode output saved to Dynamodb.`);

    } catch (err) {
        console.log(err);
        callback(err);
    }

};

module.exports = {
    handler
};