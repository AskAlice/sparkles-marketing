var Twitter = require('twitter');
var config = require('./config.js');
const fs = require('fs');
const path = require('path');
var client = new Twitter(config);

// var metadata = require('./content/metadata');
let videos = JSON.parse(fs.readFileSync(`data.json`));
for (let [title, { href, video, slug, thumb, description }] of Object.entries(videos)) {
  var data = require('fs').readFileSync(path.join(__dirname, slug, 'trailer-tweet.mp4'));
  const pathToMovie = path.join(__dirname, slug, 'trailer-tweet.mp4');
  const mediaType = 'video/mp4'; // `'video/mp4'` is also supported
  const mediaData = fs.readFileSync(pathToMovie);
  const mediaSize = fs.statSync(pathToMovie).size;

  initUpload() // Declare that you wish to upload some media
    .then(appendUpload) // Send the data for the media
    .then(finalizeUpload) // Declare that you are done uploading chunks
    .then((mediaId) => {
      var status = {
        status: `${title} 💖 ${href}`,
        media_ids: mediaId, // Pass the media id string
      };
      client.post('statuses/update', status, function (error, tweet, response) {
        if (!error) {
          console.log(tweet);
        }
      });
    });
  /**
   * Step 1 of 3: Initialize a media upload
   * @return Promise resolving to String mediaId
   */
  function initUpload() {
    return makePost('media/upload', {
      command: 'INIT',
      total_bytes: mediaSize,
      media_type: mediaType,
    }).then((data) => data.media_id_string);
  }

  /**
   * Step 2 of 3: Append file chunk
   * @param String mediaId    Reference to media object being uploaded
   * @return Promise resolving to String mediaId (for chaining)
   */
  function appendUpload(mediaId) {
    return makePost('media/upload', {
      command: 'APPEND',
      media_id: mediaId,
      media: mediaData,
      media_category: 'tweet_video',
      segment_index: 0,
    }).then((data) => mediaId);
  }

  /**
   * Step 3 of 3: Finalize upload
   * @param String mediaId   Reference to media
   * @return Promise resolving to mediaId (for chaining)
   */
  function finalizeUpload(mediaId) {
    return makePost('media/upload', {
      command: 'FINALIZE',
      media_id: mediaId,
    }).then((data) => mediaId);
  }
  function makePost(endpoint, params) {
    return new Promise((resolve, reject) => {
      client.post(endpoint, params, (error, data, response) => {
        if (error) {
          reject(JSON.parse(response.body).error);
        } else {
          console.log(data);
          resolve(data);
        }
      });
    });
  }
}
// tags = [
//   '#ts',
//   '#traps',
//   '#transsexual',
//   '#transisbeautiful',
//   '#transgirls',
//   '#transgirl',
//   '#tranny',
//   '#shemales',
//   '#ass',
//   '#booty',
//   '#nsfw',
//   '#boob',
//   '#MVTrans',
//   '#ManyVids',
//   '#cuckold',
//   '#porn',
//   '#sex',
//   '#dick',
//   '#mtf',
//   '#tgirl',
//   '#tgirls',
//   '#transgender',
//   '#lgbt',
//   '#shemale',
//   '#sissy',
//   '#sexy',
//   '#crossdressing',
//   '#crossdresser',
// ];

// tags.forEach(function(tag){
// 	var params = {
// 	  q: tag,
// 	  count: 30,
// 	  result_type: 'recent',
// 	  lang: 'en'
// 	}
// 	console.log('Searching for ' + params.q)
// 	T.get('search/tweets', params, function(err, data, response) {
// 	  // If there is no error, proceed
// 	  if(!err){
// 	    // Loop through the returned tweets
// 	    console.log("there are " + data.statuses.length + " statuses")
// 	    for(let i = 0; i < data.statuses.length; i++){
// 	      // Get the tweet Id from the returned data
// 	      let id = { id: data.statuses[i].id_str }
// 	      // Try to Favorite the selected Tweet
// 	      T.post('favorites/create', id, function(err, response){
// 	        // If the favorite fails, log the error message
// 	        if(err){
// 	          console.log(err);
// 	        }
// 	        // If the favorite is successful, log the url of the tweet
// 	        else{
// 	          let username = response.user.screen_name;
// 	          let tweetId = response.id_str;
// 	          //console.log(response);
// 	          console.log('Favorited: ', `https://twitter.com/${username}/status/${tweetId}`)
// 	        }
// 	      });
// 	    }
// 	  } else {
// 	    console.log(err);
// 	  }
// 	});
// 	sleep.msleep(100);
// })
