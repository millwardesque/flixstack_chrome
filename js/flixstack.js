var video_map = {}; // Stores information about each video on the current page.

// Event handlers for messages sent by the Chrome extension.
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.operation == "create links") {
      create_links();
    }
    else if (request.operation == "remove links") {
      remove_links();
    }
    else if (request.operation == "video removed") {
      update_link(request.video_id, false);
    }
    else if (request.operation == "video watched") {
      update_link(request.video_id, false);
    }
  }
);
console.log("FlixStack Loaded");

/**
 * Gathers all the video info on the page.
 *
 * @return An array of video IDs found on the page.
 */
function collect_video_info() {
  var video_ids = [];

  $('.agMovie .playLink').each(function(index, element) {
    var video_id = get_video_id_from_url($(element).attr('href'));
    if (video_id) {
      if (typeof video_map[video_id] == 'undefined') {
        var $image_element = $(element).siblings('.boxShotImg');
        video_map[video_id] = {
          title: $image_element.attr('alt'),
          image: $image_element.attr('src'),
          containers: [],
          is_in_stack: undefined
        };
      }
      video_map[video_id].containers.push($(element).parents('.agMovie'));
      video_ids.push(video_id);
    }
  });

  return video_ids;
}

/**
 * Creates the FlixStack links.
 */
function create_links() {
  var ids_to_queue = collect_video_info();

  // Get the queued status of the videos for the current user.
  flixstack_api.check_queued(ids_to_queue, function(data, textStatus) {
    for (var video_id in data['ids']) {
      var video = video_map[video_id];
      if (typeof video == "undefined") {
        console.log("Skipping " + video_id);
        continue;
      }

      // If we have the video, add the links to each of the relevent containers.
      video.is_in_stack = data['ids'][video_id];
      if (typeof video.is_in_stack != 'undefined') {
        for (var i in video.containers) {
          if (!$('.flixstack-wrapper', video.containers[i]).length) {
            $(video.containers[i]).append(make_link(video_id));
          }
        }
      }
    }
  });
}

/**
 * Updates the FlixStack links for a video based on whether the video is currently queued.
 *
 * @param video_id
 * @param is_in_stack
 *  True if the video is now in the stack, else false.
 */
function update_link(video_id, is_in_stack) {
  var video = video_map[video_id];

  if (typeof video != 'undefined') {
    video.is_in_stack = is_in_stack;

    for (var i in video.containers) {
      $('.flixstack-wrapper', video.containers[i]).remove();
      $(video.containers[i]).append(make_link(video_id));
    }
  }
}

/**
 * Extracts the video ID from a URL
 *
 * @param url
 *  The URL to extract the ID from.
 *
 * @return The video ID, or null if not found.
 */
function get_video_id_from_url(url) {
  var video_id_pattern = /movieid=([0-9]+?)&/;
  var video_id = video_id_pattern.exec(url);

  if (video_id == null) {
    console.log("Failed getting ID from " + url);
    return null;
  }
  else {
    return video_id[1];
  }
}

/**
 * Removes the FlixStack links from the current page.
 */
function remove_links() {
  $('.flixstack-wrapper').hide();
  $('.flixstack-wrapper').remove();
}

/**
 * Creates a FlixStack link on the page.
 *
 * @video_id
 *  ID of the video.
 *
 * @return The HTML element containing the link, or null if there was a problem.
 */
function make_link(video_id) {
  var video = video_map[video_id];
  if (typeof video == "undefined") {
    console.log("Unable to make link: Couldn't find video with ID " + video_id);
    return null;
  }

  // Build the HTML element.
  var wrapper = $('<div class="flixstack-wrapper"></div>');
  var anchor_text = video.is_in_stack ? "Watched" : "Add to FlixStack";
  var anchor_class = video.is_in_stack ? "watched" : "add";
  var anchor = $('<a class="' + anchor_class + '" href="#">' + anchor_text + '</a>');

  // Click-handling on the element.
  $(anchor).click(function(e) {
    $(e).html("Loading...");
    if (video.is_in_stack) {
      onclick_watched(e, video_id);
    }
    else {
      onclick_add(e, video_id);
    }
  });
  wrapper.append(anchor);

  // Add a remove link as well as the watched link
  if (video.is_in_stack) { 
    var remove_anchor = $('<a class="remove" href="#">Remove</a>');
    $(remove_anchor).click(function(e) {
      $(e).html("Loading...");
      onclick_remove(e, video_id);
    });
    
    wrapper.append(remove_anchor);
  }

  return wrapper;
}

/**
 * Click handler that marks a video as watched.
 *
 * @param e
 *  The event that was fired.
 * @param video_id.
 *  The ID of the video to mark as watched.
 */
function onclick_watched(e, video_id) {
  flixstack_api.mark_as_watched(video_id, function(data, textStatus) {
    update_link(video_id, false);
  }); 

  e.preventDefault();
  e.stopPropagation();
  return false;
}

/**
 * Click handler that removes a video from the stack.
 *
 * @param e
 *  The event that was fired.
 * @param video_id.
 *  The ID of the video to remove.
 */
function onclick_remove(e, video_id) {
  flixstack_api.remove_from_stack(video_id, function(data, textStatus) {
    update_link(video_id, false);
  }); 

  e.preventDefault();
  e.stopPropagation();
  return false;
}

/**
 * Click handler that adds a video to the queue.
 *
 * @param e
 *  The event that was fired.
 * @param video_id
 *  The ID of the video.
 */
function onclick_add(e, video_id) {
  var video = video_map[video_id];
  if (typeof video == "undefined") {
    console.log("Failed to add video with ID " + video_id);
  }
  else {
    flixstack_api.add_to_stack(video.title, video_id, video.image, function(data, textStatus) {
      update_link(video_id, true);
    });
  }

  e.preventDefault();
  e.stopPropagation();
  return false;
}
