'use strict';

/**
 * get all videos
 * 
 * Required Env Vars:
 * 
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
    const docClient = new AWS.DynamoDB.DocumentClient();
    try {
        const allVideoItems = await docClient.scan({
            TableName: 'Videos',
            ProjectionExpression: "ID, transcoding, video_urls, thumbnail, playlist, userID, created_at"
        }).promise();

        const response = generateResponse(200, allVideoItems);
        callback(null, response);

    } catch (err) {

        const response = generateResponse(400, err);
        callback(null, response);

    }

}

module.exports = {
    handler
}