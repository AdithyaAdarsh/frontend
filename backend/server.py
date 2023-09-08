from boto3.dynamodb.conditions import Key
from flask import Flask, request, jsonify, session
from utility import upload_image_to_s3, receive_message_from_sqs, send_uuids_to_sqs
from config import TENANT_ID, tables, table2, table3
from flask_cors import CORS
import random
import uuid
from flask_session import Session
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, JWTManager, jwt_required, get_jwt_identity
from okta_jwt_verifier import AccessTokenVerifier  
from okta_config import OKTA_CONFIG  # Import the Okta configuration



app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SESSION_PERMANENT'] = False
app.config['SESSION_TYPE'] = 'filesystem'
app.secret_key = 'super secret key'
user_table = table2
jwt = JWTManager(app)

@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400
    
    # Check if the username is already taken
    existing_user = user_table.get_item(Key={'username': username}).get('Item')
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 400

    # Hash the password before storing it
    hashed_password = generate_password_hash(password, method='scrypt')

    # Check if the username is already taken
    existing_user = user_table.get_item(Key={'username': username}).get('Item')
    if existing_user:
        return jsonify({'error': 'Username already exists'}), 400

    # Store the user details in DynamoDB
    user_table.put_item(Item={'username': username, 'password': hashed_password})

    return jsonify({'message': 'User registered successfully'}), 201


@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    okta_token = data.get('okta_token')

    print(f"Okta token is:{okta_token}")
    
    if not okta_token:
        return jsonify({'error': 'Okta token is required'}), 400

    print(f"Received Okta token: {okta_token}")

    # Validate the Okta token using the Okta configuration
    verifier = AccessTokenVerifier(OKTA_CONFIG['issuer'], OKTA_CONFIG['client_id'])

    try:
        claims = verifier.verify_token(okta_token)
    except Exception as e:
        return jsonify({'error': 'Invalid Okta token'}), 401

    # If the Okta token is valid, you can proceed with generating an access token
    # and performing any required authentication logic.

    # Create a regular JWT access token with the identity (customize as needed)
    access_token = create_access_token(identity=claims['sub'])

    return jsonify({'access_token': access_token}), 200




    

    
@app.route('/fetch_new_images', methods=['GET'])
@jwt_required()
def fetch_new_images():
    try:
        # Extract the username and session_id from the JWT token
        current_user = get_jwt_identity()
        current_session_token = request.headers.get('Authorization')  # Retrieve session token from header
        current_session_token = current_session_token.split(' ')[1]  # Remove "Bearer " from the token

        print(f"The sesion token is {current_session_token}")

        # Initialize DynamoDB tables
        image_table = tables  # Assuming 'tables' represents the table for the images
        session_table = table3  # Assuming 'table3' represents the session info table

        # Fetch images with status 'PENDING' and lock_status 'Unlocked'
        response = image_table.query(
            IndexName='Manual_Status-Lock-Status-index',
            KeyConditionExpression=Key('Manual_Status').eq('PENDING') & Key('Lock-Status').eq('Unlocked')
        )
        pending_images = response['Items']

        if not pending_images:
            return jsonify({'message': 'No more images left as pending / Images currently in use by other users.'})

        # Determine the count parameter
        if 'count' in request.args:
            count = int(request.args.get('count'))
        elif 'moderate_count' in request.args:
            count = int(request.args.get('moderate_count'))
        else:
            return jsonify({'error': 'Invalid parameter'}), 400

        # Fetch only count number of images
        new_images = random.sample(pending_images, min(count, len(pending_images)))

        # Store the session token, username, and UUIDs in session_table
        image_uuids = [image['UUID'] for image in new_images]
        session_item = session_table.get_item(
            Key={'session_id': current_session_token}
        ).get('Item', {})
        fetched_uuids = session_item.get('fetched_image_uuids', [])
        fetched_uuids.extend(image_uuids)
        session_table.update_item(
            Key={'session_id': current_session_token},
            UpdateExpression='SET fetched_image_uuids = :fetched_uuids',
            ExpressionAttributeValues={':fetched_uuids': fetched_uuids}
        )

        # Update the 'Lock-Status' of images based on fetched UUIDs
        for image in new_images:
            if image['UUID'] in fetched_uuids:
                image_table.update_item(
                    Key={'UUID': image['UUID']},
                    UpdateExpression='SET #ls = :locked',
                    ExpressionAttributeNames={'#ls': 'Lock-Status'},
                    ExpressionAttributeValues={':locked': 'Locked'}
                )

        return jsonify(new_images)

    except Exception as e:
        return jsonify({'error': str(e)}), 500





@app.route('/reset_fetched_uuids', methods=['POST'])
@jwt_required()
def reset_fetched_uuids():
    try:
        current_session_token = request.headers.get('Authorization').split(' ')[1]

        # Retrieve fetched UUIDs from session_table based on session ID
        session_item = table3.get_item(
            Key={'session_id': current_session_token}
        ).get('Item', {})
        fetched_uuids = session_item.get('fetched_image_uuids', [])

        # Update the 'Lock-Status' of images based on fetched UUIDs
        for uuid in fetched_uuids:
            tables.update_item(
                Key={'UUID': uuid},
                UpdateExpression='SET #ls = :unlocked',
                ExpressionAttributeNames={'#ls': 'Lock-Status'},
                ExpressionAttributeValues={':unlocked': 'Unlocked'}
            )

        # Delete the item from session_table based on the session ID
        table3.delete_item(
            Key={'session_id': current_session_token}
        )

        return jsonify({'message': 'Session data deleted and Lock-Status updated successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500








@app.route('/cms', methods=['POST'])
def upload_images_and_receive_from_sqs():
    print("---------- Processing the request ---------")

    # Get the UUID from the request
    uuid = request.form.get('uuid')

    # Get the list of files from the request
    files = request.files.getlist('file')

    responses = []

    for file in files:
        if not file:
            responses.append({'error': 'No file selected'})
            continue

        print("File name is: " + file.filename)     
        print("UUID is: " + uuid)

        # Read the image file as bytes
        photo_bytes = file.read()

        # Upload the image to S3 and associate it with the UUID
        upload_image_to_s3(photo_bytes, uuid, file.filename)

        # Send the UUID and file name through SQS message
        response = send_uuids_to_sqs(uuid, [file.filename], TENANT_ID)
        responses.append(response)


    print("Objects uploaded")

    return jsonify(responses)


@app.route('/image_count', methods=['GET'])
def get_image_count():
    try:
        # Initialize the DynamoDB resource
        table = tables

        # Query DynamoDB to get all items in the table
        response = table.query(
           IndexName='Manual_Status-Lock-Status-index',
            KeyConditionExpression=Key('Manual_Status').eq('PENDING') & Key('Lock-Status').eq('Unlocked')
        )
        dynamodb_data = response['Items']        

        # Get the count of images
        image_count = len(dynamodb_data)

        # Return the image count as JSON
        return jsonify({'imageCount': image_count})

    except Exception as e:
        return jsonify({'error': str(e)})



@app.route('/update_manual_status', methods=['POST'])
def update_manual_status():
    # Receive the data from the request
    data = request.get_json()
    uuid = data.get('uuid')
    manual_status = data.get('manual_status')
    reason_for_change = data.get('reason_for_change')
    username = data.get('username')  # New field for username

    # Get the item from the DynamoDB table using the UUID
    response = tables.get_item(Key={'UUID': uuid})
    item = response.get('Item')

    # Check if the item exists in the table
    if item:
        # Update the Manual_Status
        item['Manual_Status'] = manual_status
        
        # Append the new reason and username to the existing reason
        if 'Reason_For_Change' in item:
            item['Reason_For_Change'] = f"{item['Reason_For_Change']}\n{reason_for_change} (by {username})"
        else:
            item['Reason_For_Change'] = f"{reason_for_change} (by {username})"

        # Put the updated item back into the table
        tables.put_item(Item=item)

        return jsonify({'message': 'Update successful'})
    else:
        return jsonify({'error': 'Item not found'})


    
@app.route('/fetch_images_by_uuid', methods=['POST'])
def fetch_images_by_uuid():
    try:
        data = request.get_json()
        uuids = data.get('uuids')  # Read the 'uuids' from the JSON request
        print(f"The uuids are {uuids}")

        # Initialize the DynamoDB resource
        table = tables

        # Query DynamoDB to get items with the provided UUIDs
        response = table.scan()
        dynamodb_data = response['Items']

        images_by_uuid = [item for item in dynamodb_data if item['UUID'] in uuids]

        return jsonify(images_by_uuid)

    except Exception as e:
        return jsonify({'error': str(e)})




if __name__ == '__main__':
    app.secret_key = 'super secret key'
    app.run(debug=True)
