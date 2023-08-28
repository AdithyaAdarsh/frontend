from boto3.dynamodb.conditions import Key
from flask import Flask, request, jsonify, session
from utility import upload_image_to_s3, receive_message_from_sqs, send_uuids_to_sqs
from config import TENANT_ID, tables, table2, table3
from flask_cors import CORS
import random
import uuid
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
CORS(app, supports_credentials=True)
app.secret_key = 'super secret key'
user_fetched_images_table = table3
user_table = table2

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
    username = data.get('username')
    password = data.get('password')
    session['username'] = username  # Store the username in session
    moderate_count = data.get('moderate_count')

    if not username or not password:
        return jsonify({'error': 'Username and password are required'}), 400

    user_data = user_table.get_item(Key={'username': username}).get('Item')
    session_id = str(uuid.uuid4())

    if user_data and check_password_hash(user_data['password'], password):
        session.clear()  # Clear any existing session data
        session['session_id'] = session_id  # Set the session_id here
        session['assigned_uuids'] = []  # Initialize the assigned_uuids array
        session['moderate_count'] = moderate_count  # Store the moderate_count in session
        session['username'] = username  # Store the username in session
        print(f"Username set in session: {session['username']}")
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'error': 'Invalid username or password'}), 401

    

    
@app.route('/fetch_new_images', methods=['GET'])
def fetch_new_images():
    try:
        # Determine the count parameter
        if 'count' in request.args:
            count = int(request.args.get('count'))
        elif 'moderate_count' in request.args:
            count = int(request.args.get('moderate_count'))
        else:
            return jsonify({'error': 'Invalid parameter'})

        print(f"The count is {count}")

        username = request.args.get('username')
        print(f"The usernmae is: {username}")

        # Initialize DynamoDB table
        table = tables

        # Fetch images with status 'PENDING'
        response = table.query(
            IndexName='Manual_Status-index',
            KeyConditionExpression=Key('Manual_Status').eq('PENDING')
        )
        pending_images = response['Items']

        # Fetch only count number of images
        new_images = random.sample(pending_images, min(count, len(pending_images)))

        # Store the UUIDs of fetched images in the session
        session_username = "Adithya"
        user_fetched_image_uuids = session.get('user_fetched_image_uuids', [])
        print(f"The user fetched image uuids are: {user_fetched_image_uuids}")
        new_fetched_uuids = [item['UUID'] for item in new_images]
        print(f"The new fetched uuids are: {new_fetched_uuids}")
        
        # Only consider images that have not been fetched before
        unique_new_images = []
        for item in new_images:
            if item['UUID'] not in user_fetched_image_uuids:
                unique_new_images.append(item)
                user_fetched_image_uuids.append(item['UUID'])
        
        session['user_fetched_image_uuids'] = user_fetched_image_uuids
        print(f"The new fetched uuids are: {session['user_fetched_image_uuids']}")

        if not unique_new_images:
            return jsonify({'message': 'No more images left as Pending'})

        # Update the fetched image UUIDs in the user_table
        update_expression = 'SET fetched_image_uuids = list_append(if_not_exists(fetched_image_uuids, :empty_list), :uuids)'
        user_table.update_item(
            Key={'username': session_username},
            UpdateExpression=update_expression,
            ExpressionAttributeValues={
                ':uuids': [uuid for uuid in new_fetched_uuids if uuid in [item['UUID'] for item in unique_new_images]],
                ':empty_list': []
            }
        )

        # Remove fetched UUIDs from the main pool of images
        fetched_image_uuids = [item['UUID'] for item in unique_new_images]
        pending_images = [item for item in pending_images if item['UUID'] not in fetched_image_uuids]

        return jsonify(unique_new_images)

    except Exception as e:
        return jsonify({'error': str(e)})






    

@app.route('/reset_fetched_uuids', methods=['POST'])
def reset_fetched_uuids():
    try:
        session_username = session.get('username')

        # Update the fetched_image_uuids in the DynamoDB table with an empty list
        update_expression = 'SET fetched_image_uuids = :empty_list'
        user_table.update_item(
            Key={'username': "Adithya"},
            UpdateExpression=update_expression,
            ExpressionAttributeValues={
                ':empty_list': []
            }
        )

        # Clear the fetched UUIDs from the session
        session.pop('user_fetched_image_uuids', None)

        return jsonify({'message': 'Fetched UUIDs reset successfully'})

    except Exception as e:
        return jsonify({'error': str(e)})




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
            IndexName='Manual_Status-index',
            KeyConditionExpression=Key('Manual_Status').eq('PENDING')
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
