'use strict';

/**
 * this function is called by APIGateway when a user submit a vote. 
 * 
 * Required Env Vars:
 * none
 */

const AWS = require('aws-sdk');

const generateResponse = (status, message) => {
    return {
        statusCode: status,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            'message': message
        })
    }
};

const handler = async (event, context, callback) => {

    context.callbackWaitsForEmptyEventLoop = false;

    console.debug("the event is " + JSON.stringify(event));

    const docClient = new AWS.DynamoDB.DocumentClient();

    try {
        console.debug(`post data is ${event.body}`);
        const post_body = JSON.parse(event.body);
        const videoID = post_body.ID;
        const videoItem = await docClient.get({
            TableName: 'Videos',
            Key: {
                ID: videoID
            }
        }).promise();
        videoItem.Item.voteCount = videoItem.Item.voteCount ? videoItem.Item.voteCount + 1 : 1;
        videoItem.Item.updated_at = new Date().toISOString();
        console.log(`updated videoItem is ${JSON.stringify(videoItem)}`);
        const params = {
            TableName: 'Videos',
            Item: videoItem.Item
        };
        console.log(`params is ${JSON.stringify(params)}`);

        await docClient.put(params).promise();
        
        const response = generateResponse(200, {voteCount: videoItem.Item.voteCount}); 
        callback(null, response);

    } catch (err) {
        console.log(err);
        const response = generateResponse(400, err); 
        callback(null, response);
    }

};

module.exports = {
    handler
};