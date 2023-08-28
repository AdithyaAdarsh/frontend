# config.py
import boto3

TENANT_ID = 'www.giftcard.com'

SQS_QUEUE_URL1= 'https://sqs.ap-south-1.amazonaws.com/282380694863/sendmessage'   # Replace with your SQS queue URL

# S3 Configuration
S3_BUCKET_NAME = 'gc-cms-test-bucket'  # Replace with your S3 bucket name

# SQS Configuration
SQS_QUEUE_URL = 'https://sqs.ap-south-1.amazonaws.com/282380694863/ImageModerationQueue'  # Replace with your SQS queue URL

# Table Name
dynamodb = boto3.resource('dynamodb', region_name='ap-south-1')
tables = dynamodb.Table('ImageDatabase')  # Replace with your DynamoDB table name for storing image mdoerateion results and manual update results
table2 = dynamodb.Table('userlogin') # Replace with your DynamoDB Table name for storing user information
table3= dynamodb.Table('UserFetchedImages')

# Function to get the S3 client
def get_s3_client():
    return boto3.client('s3')

# Function to get the SQS client
def get_sqs_client():
    return boto3.client('sqs')
