
# Image Moderation Web Application

Welcome to the Image Moderation Web Application! This application allows users to log in, fetch images for moderation, review and update their status, and log out. The image UUIDs are stored in both the user's session and a DynamoDB table for tracking purposes.
## Features
- **User Authentication:** Users can log in using their username and password.
- **Fetch Images:** Users can fetch a specified number of images for moderation.
- **Image Moderation:** Users can review and update the status of each fetched image.
- **Locking Mechanism:** Fetched images are locked for the current user session to prevent other users from accessing them.
- **Release on Logout:** Fetched and locked images are released when the user logs out.
## Prerequisites

 To run this application, you need to have the following:

1)Python installed on your machine        

2)AWS account with appropriate credentials.   

3)Boto3 Python library for AWS services.   

4)Flask Python library for the backend server.

5)Node.js and npm for the frontend.

6)Amazon DynamoDB for image and user data storage.

7)SQS Queue for sending image metadata and also to trigger the AWS Lamnda function that does the image moderation. 


## Getting Started

1)Clone the repository to your local machine.

2)Install the required libraries using pip:

```bash
  pip install boto3 flask
```

3)Set up your AWS credentials by configuring the AWS CLI or setting environment variables.

4)Create an SQS queue and update the queue_url variable in api_queue.py with your SQS   queue URL.

5)Run the Flask server by executing api_queue.py:
```bash
  python server.py
```

6)The Flask server will start running locally at http://127.0.0.1:5000/.

7)Then head over to the frontend folder and run the command npm start and this will take you to the webpage where you can upload multiple files and go ahead to the cutomer_service webpage after loggin into your account.


## How to Use

1)Open your web browser and navigate to http://localhost:3000/

2)You will see a web page that allows you to upload images.

3)Click on the "Choose File" button and select an image from your local machine.

4)Click the "Upload Image" button to initiate the image moderation process.

5)The server will upload the image to an S3 bucket, perform image moderation using AWS  Rekognition.

6)Navigate to the login page and login with your credentials or register if you are not a user and enter the number of images that you want to moderate.

7)After logging in you will see the number of images that you requested in the login page and you can change the status of the image to either 'APPROVED' or 'REJECTED' by clicking the change status button.

8)If you wish to see how many more images are left as pending, click on the refresh images count button to see how many iamges are pending and if you want to fetch more images, then click on the button below the table anme to fetch more images.

9)Logout once the process is done to free up the images that have been locked.
## File Structure
`server.py`: The Flask server file responsible for handling image upload and moderation.   

`frontend/ImageUploader.js`: The React file containing the frontend code for the image upload page.   

`frontend/DynamoDBData.js`: The JavaScript file that displays the images in the webpage

`frontend/Login.js`: The JavaScript file that handles the frontend part of logging a user by posting the user detials to the backend server.

`frontend/Register.js`: A React page that lets a new user to register themselves.

`config.py`: The configuration file containing AWS credentials and other parameters (create this file and place it in the same directory).

## Conclusion

Congratulations! You've successfully used the web application for image moderation. Enjoy moderating images, and remember that the locking mechanism ensures a seamless and secure experience for all users.
## Acknowledgments

Special thanks to AWS Rekognition service for image moderation capabilities, Flask for providing an easy-to-use Python web framework, and JavaScript for handling asynchronous requests on the frontend.

Feel free to contribute, report issues, and provide feedback to help improve this project!