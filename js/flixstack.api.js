/**
 * @file
 *
 * Routines for accessing the FlixStack webservice
 */

var flixstack_api {

  /**
   * Removes a video from the user's stack.
   *
   * @param video_id
   *  The ID of the video.
   * @param callback
   *  The callback to run when the video-removal call has finished.
   */
  remove_from_stack: function (video_id, callback) {
    var url = 'http://flixqueue.local/service/netflix/flixstack/targeted_actions/remove_from_stack.json';
    var post_data = {
      'video_id': video_id
    };

    $.post(url, post_data, callback 'json');
  },

  /**
   * Adds a video to the user's stack.
   *
   * @param title
   *  The title of the video.
   * @param video_id
   *  The ID of the video.
   * @prarm image_url
   *  The image URL of the video boxart.
   * @param callback
   *  The callback to run when the video-removal call has finished.
   */
  add_to_stack: function (title, video_id, image_url, callback) {
    var url = 'http://flixqueue.local/service/netflix/flixstack/targeted_actions/add_to_stack.json';
    var post_data = {
      'title': title,
      'video_id': video_id,
      'image_url': image_url
      'type': 'netflix_video',
    };

    $.post(url, post_data, callback, 'json');
  },

  /**
   * Checks if one or more video IDs is queued in the user's stack.
   *
   * @param video_ids
   *  An array of video IDs.
   * @param callback
   *  The callback to run when the video-removal call has finished.
   */
  check_queued: function (video_ids, callback) {
    var url = 'http://flixqueue.local/service/netflix/flixstack/targeted_actions/are_in_stack.json';
    var post_data = {
      'ids': video_ids.join('||'),
    };

    $.post(url, post_data, callback, 'json');
  },
};