from flask import Flask, redirect, url_for, session
from flask_oauthlib.client import OAuth
from flask import Flask, request, jsonify, session

app = Flask(__name__)

# Configure session secret key (replace with your own secret key)
app.secret_key = 'your-secret-key'

# Configure Google OAuth settings
oauth = OAuth(app)
google = oauth.remote_app(
    'google',
    consumer_key='your-client-id',
    consumer_secret='your-client-secret',
    request_token_params={
        'scope': 'email',  # Specify the required scope
    },
    base_url='https://www.googleapis.com/oauth2/v1/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
)

# Define the callback route after successful authentication
@app.route('/google-login')
def google_login():
    return google.authorize(callback=url_for('google_authorized', _external=True))

@app.route('/google-logout')
def google_logout():
    session.pop('google_token', None)
    return redirect('/')

@app.route('/google-authorized')
def google_authorized():
    response = google.authorized_response()
    if response is None or response.get('access_token') is None:
        return 'Access denied: reason={} error={}'.format(
            request.args['error_reason'],
            request.args['error_description']
        )
    session['google_token'] = (response['access_token'], '')

    # Retrieve user data
    user_info = google.get('userinfo')
    return 'Logged in as: ' + user_info.data['email']

@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')

if __name__ == '__main__':
    app.run(debug=True)
