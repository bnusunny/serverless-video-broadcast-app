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
            const videoID = snsMsg.input.key.split('/')[1];
            const videoItem = await docClient.get({
                TableName: 'Videos',
                Key: { ID: videoID} 
            }).promise(); 
            videoItem.Item.transcoding = false;
            videoItem.Item.transcode_outputs =  snsMsg.outputs;
            videoItem.Item.video_urls = [];
            for (let output of videoItem.Item.transcode_outputs) {
                output.video_url = process.env.S3_TRANSCODED_BUCKET_URL + '/' + output.key;
                videoItem.Item.video_urls.push(output.video_url);
            }
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

    } catch(err) {
        console.log(err); 
        callback(err);       
    }


    // const key = event.Records[0].s3.object.key;
    // const bucket = event.Records[0].s3.bucket.name;

    // const videoUrl = process.env.S3_TRANSCODED_BUCKET_URL + '/' + key;

    // // construct S3 URL based on bucket and key
    // // the input file may have spaces so replace them with '+'
    // const sourceKey = decodeURIComponent(key.replace(/\+/g, ' '));

    // // get the unique video key (the folder name)
    // const uniqueVideoKey = sourceKey.split('/')[0];

    // const docClient = new AWS.DynamoDB.DocumentClient();
    
    // try {
    //     let theVideoRecord = {
    //         TableName: 'Videos',
    //         Item: {
    //             ID: key,
    //             transcoding: false, 
    //             video_urls: [
                    
    //             ]
    //         }
    //     };
        
    //     await docClient.put(theVideoRecord).promise(); 
    //     console.log('video url ${videoUrl} added to dynamodb.');

    //     callback(null, `Added URL ${videoUrl}`);
    // } catch (err) {
    //     console.log(err); 
    //     callback(err);
    // }

};

module.exports = {
    handler
};