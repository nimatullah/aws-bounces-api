const express = require("express");
const router = express.Router();
require("dotenv").config();

const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  region: "us-east-1"
});
const sns = new AWS.SNS();

const topicArnBounce = process.env.SNS_BOUNCES_ARN;
var paramsTopicBounces = {
  Protocol: "https",
  TopicArn: topicArnBounce,
  Endpoint: `https://${process.env.END_POINT}/aws/sns/handle-bounces`
};

const topicArnComplaint = process.env.SNS_COMPLAINTS_ARN;
var paramsTopicComplaints = {
  Protocol: "https",
  TopicArn: topicArnComplaint,
  Endpoint: `https://${process.env.END_POINT}/sns/handle-complaints`
};

sns.subscribe(paramsTopicBounces, function(error, data) {
  if (error) throw new Error(`Unable to set up SNS subscription: ${error}`);
  console.log(`SNS subscription set up successfully: ${JSON.stringify(data)}`);
});

sns.subscribe(paramsTopicComplaints, function(error, data) {
  if (error) throw new Error(`Unable to set up SNS subscription: ${error}`);
  console.log(`SNS subscription set up successfully: ${JSON.stringify(data)}`);
});

const handleSnsNotification = async (req, res) => {
  const message = JSON.parse(req.body.Message);
  console.log(message, "Messages")
  if (
    (message && message.notificationType == "Bounce") ||
    message.notificationType == "Complaint"
  ) {
    const mail = message.mail;
    if (mail && mail.destination) {
      for (let i = 0; i < mail.destination.length; i++) {
        const address = mail.destination[i];

        try {
           // user queryStringParameters
           
           
        } catch (error) {
          console.error(error.message);
        }
      }
    }
  }
};

const handleResponse = async (topicArn, req, res) => {
  if (
    req.headers["x-amz-sns-message-type"] === "Notification" &&
    req.body.Message
  ) {
    await handleSnsNotification(req, res);
  } else if (
    req.headers["x-amz-sns-message-type"] === "SubscriptionConfirmation"
  ) {
    var params = {
      Token: req.body.Token,
      TopicArn: topicArn
    };
    sns.confirmSubscription(params, function(err, data) {
      if (err) throw err; // an error occurred
      console.error(data);
    });
  }
};

router.post("/sns/handle-bounces", async function(req, res) {
  try {
    await handleResponse(topicArnBounce, req, res);

    res.status(200).json({
      success: true,
      message: "Successfully received message"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

router.post("/sns/handle-complaints", async function(req, res) {
  try {
    handleResponse(topicArnComplaint, req, res);

    res.status(200).json({
      success: true,
      message: "Successfully received message."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});



module.exports = router;