import json
import boto3
from config import S3_BUCKET_NAME, SQS_QUEUE_URL, SQS_QUEUE_URL1, TENANT_ID,  get_sqs_client

global_received_message = None

# Function to send multiple UUIDs through SQS messages
def send_uuids_to_sqs(uuid, file_names, TENANT_ID):
    sqs = boto3.client('sqs', region_name='ap-south-1')  # Make sure to specify the correct region.
    queue_url = SQS_QUEUE_URL1

    max_batch_size = 10
    messages = []
    for i in range(0, len(file_names), max_batch_size):
        batch = file_names[i:i + max_batch_size]
        batch_messages = []
        for idx, file_name in enumerate(batch):
            message_body = {
                'uuid': uuid,
                'file_name': file_name,
                'tenant_id': TENANT_ID
            }
            batch_messages.append({'Id': str(idx), 'MessageBody': json.dumps(message_body)})
        messages.append(batch_messages)

    responses = []
    for batch in messages:
        response = sqs.send_message_batch(QueueUrl=queue_url, Entries=batch)
        responses.append(response)

    return responses


# Function to upload the image to S3 and associate it with the UUID

def upload_image_to_s3(photo_bytes, uuid, file_name):
    try:
        s3 = boto3.resource('s3', region_name='ap-south-1')  # Replace 'ap-south-1' with your desired region
        file_key = file_name

        # Add UUID and file name to S3 object metadata
        metadata = {
            'uuid': uuid,
            'file_name': file_name,
            'Tenant_ID': TENANT_ID,
            'Lock-Status': "Unlocked"
        }

        # Upload the object with metadata directly using the S3 resource
        s3.Object(S3_BUCKET_NAME, file_key).put(Body=photo_bytes, Metadata=metadata)
        
    except Exception as e:
        # Handle exceptions here, e.g., log the error or return a user-friendly message
        print(f"Error uploading image to S3: {e}")



# Function to receive a message from the SQS queue
def receive_message_from_sqs():
    sqs = boto3.client('sqs', region_name='ap-south-1')
    global_received_message = None
    sqs = get_sqs_client()

    response = sqs.receive_message(
        QueueUrl=SQS_QUEUE_URL,
        MaxNumberOfMessages=1,
        VisibilityTimeout=30,
        WaitTimeSeconds=20
    )

    # Process the received message
    if 'Messages' in response:
        message = response['Messages'][0]
        receipt_handle = message['ReceiptHandle']

        # Extract the message body
        message_body = json.loads(message['Body'])

        global_received_message = message_body

        sqs.delete_message(QueueUrl=SQS_QUEUE_URL, ReceiptHandle=receipt_handle)

        return global_received_message

    return None


