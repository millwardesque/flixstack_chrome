/**
 * @file
 *
 * Routines for accessing the FlixStack webservice
 */

var flixstack_api = {
  flixstack_domain: 'http://flixqueue.local', // Domain name of the FlixStack webservice.


  /**
   * Establishes a connection to the webservice.
   *
   * @param callback
   *  The callback to run when the call has finished.
   */
  connect: function (callback) {
    var url = flixstack_api.flixstack_domain + '/service/netflix/system/connect.json';
    var post_data = {};

    $.post(url, post_data, callback, 'json');
  },

  /**
   * Logs the user in.
   *
   * @param username
   *  The username.
   * @param password
   *  The password.
   * @callback_success
   *  The callback to run if the call succeeds.
   * @param callback_404
   *  The callback to run if the call returns a 401.
   */
  login: function (username, password, callback_success, callback_401) {
    var url = flixstack_api.flixstack_domain + '/service/netflix/user/login.json';
    var post_data = {
      'username': username,
      'password': password
    };

    $.post(url, post_data, callback_success, 'json').fail(callback_401);
  },

  /**
   * Logs the user out.
   *
   * @param callback
   *  The callback to run when the call has finished.
   */
  logout: function (callback) {
    var url = flixstack_api.flixstack_domain + '/service/netflix/user/logout.json';
    var post_data = {};

    $.post(url, post_data, callback, 'json');
  },

  /**
   * Loads the user's stack.
   *
   * @param callback
   *  The callback to run when the call has finished.
   */
  load_stack: function (callback) {
    var url = flixstack_api.flixstack_domain + '/service/netflix/video_queue_view.json';
    var get_data = {};

    $.get(url, get_data, callback, 'json');
  },

  /**
   * Removes a video from the user's stack.
   *
   * @param video_id
   *  The ID of the video.
   * @param callback
   *  The callback to run when the call has finished.
   */
  remove_from_stack: function (video_id, callback) {
    var url = flixstack_api.flixstack_domain + '/service/netflix/flixstack/targeted_actions/remove_from_stack.json';
    var post_data = {
      'video_id': video_id
    };

    $.post(url, post_data, callback, 'json');
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
   *  The callback to run when the call has finished.
   */
  add_to_stack: function (title, video_id, image_url, callback) {
    var url = flixstack_api.flixstack_domain + '/service/netflix/flixstack/targeted_actions/add_to_stack.json';
    var post_data = {
      'title': title,
      'video_id': video_id,
      'image_url': image_url,
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
   *  The callback to run when the call has finished.
   */
  check_queued: function (video_ids, callback) {
    var url = flixstack_api.flixstack_domain + '/service/netflix/flixstack/targeted_actions/are_in_stack.json';
    var post_data = {
      'ids': video_ids.join('||'),
    };

    $.post(url, post_data, callback, 'json');
  },
};