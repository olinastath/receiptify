# Receiptify

Web application inspired by https://www.instagram.com/albumreceipts/. Generates receipts that list out a user's top tracks in the past month, 6 months, and all time.

This application was originally developed by [Michelle Liu](https://michellexliu.github.io/) but I tweaked it to add a filtering option to hide artists or albums. 

The original idea behind these changes was that people often listen to soundtracks or classical music while studying or working but those most played tracks don't represent the user's music taste at large. The application can be viewed at https://receiptify-too.herokuapp.com/.

## Running the App Locally

This app runs on Node.js. On [its website](http://www.nodejs.org/download/) you can find instructions on how to install it. You can also follow [this gist](https://gist.github.com/isaacs/579814) for a quick and easy way to install Node.js and npm.

Once installed, clone the repository and install its dependencies running:

    $ npm install

### Using your own credentials

You will need to register your app and get your own credentials from the Spotify for Developers Dashboard.

To do so, go to [your Spotify for Developers Dashboard](https://beta.developer.spotify.com/dashboard) and create your application. You will also need to register redirect URIs for the Spotify OAuth to work. These vary based on your host. I have registered the following:

- http://localhost:3000/callback
- https://receiptify-too.herokuapp.com/callback

Once you have created your app, create a `config.js` file on the main directory and add the following structure: 
module.exports = {
	clientId: YOUR_CLIENT_ID,
	clientSecret: YOUR_CLIENT_SECRET
    redirectUri: YOUR_REDIRECT_URI,
};

This file is ignored by git as you shouldn't be sharing your client secret publicly. The application also can pick from environmental variables if you are hosting on a cloud platform such as Heroku.

In order to run the app, open the main directory, and run the start script:

    $ npm start

Then, open `http://localhost:3000` in a browser.
