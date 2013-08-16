var queued_map = {};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.operation == "create links") {
      create_links();
    }
    else if (request.operation == "remove links") {
      remove_links();
    }
    else if (request.operation == "video removed") {
      update_link(request.video_id, true);
    }
    else if (request.operation == "video watched") {
      update_link(request.video_id, true);
    }
  }
);
console.log("FlixStack Loaded");

function create_links() {
  // Add the new links
  var ids_to_queue = [];
  $('.agMovie .playLink').each(function(index, element) {
    var video_id = get_video_id_from_url($(element).attr('href'));
    if (video_id) {
      ids_to_queue.push(video_id);
    }
  });

  flixstack_api.check_queued(ids_to_queue, function(data, textStatus) {
    for (var key in data['ids']) {
      queued_map[key] = data['ids'][key];
    }

    $('.agMovie').each(function(index, element) {
      if (!$('.flixstack-wrapper', element).length) {
        var image_element = $('.boxShotImg', element);
        var title = $(image_element).attr('alt');
        var img = $(image_element).attr('src');
        var video_id = get_video_id_from_url($('a', element).attr('href'));

        if (video_id) {
          $(element).append(make_link(!queued_map[video_id], title, video_id, img));
        }
      }
    });
  });
}

function update_link(video_id, is_add_link) {
  $('.vbox_' + video_id).parent().each(function(index, element) {
      $('.flixstack-wrapper', element).remove();

      var image_element = $('.boxShotImg', element);
      var title = $(image_element).attr('alt');
      var img = $(image_element).attr('src');
      $(element).append(make_link(is_add_link, title, video_id, img));
  });
}

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

function remove_links() {
  $('.flixstack-wrapper').hide();
  $('.flixstack-wrapper').remove();
}

/**
 * Creates a FlixStack link
 */
function make_link(is_add_link, title, video_id, img) {
  var wrapper = $('<div class="flixstack-wrapper"></div>');
  var anchor_text = is_add_link ? "Add to FlixStack" : "Watched";
  var anchor_class = is_add_link ? "add" : "watched";
  var anchor = $('<a class="' + anchor_class + '" href="#">' + anchor_text + '</a>');

  // Click-handling
  $(anchor).click(function(e) {
    $(e).html("Loading...");
    if (is_add_link) {
      onclick_add(e, title, video_id, img);
    }
    else {
      onclick_watched(e, video_id);
    }
  });
  wrapper.append(anchor);

  // Add a remove link as well as the watched link
  if (!is_add_link) { 
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
  var jq_e = $(e.target).parents('.agMovie');

  flixstack_api.mark_as_watched(video_id, function(data, textStatus) {
    var image_element = $('.boxShotImg', jq_e);
    var title = $(image_element).attr('alt');
    var video_img = $(image_element).attr('src');

    var new_element = make_link(true, title, video_id, video_img);
    $(e.target).parents('.flixstack-wrapper').replaceWith(new_element);
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
  var jq_e = $(e.target).parents('.agMovie');

  flixstack_api.remove_from_stack(video_id, function(data, textStatus) {
    var image_element = $('.boxShotImg', jq_e);
    var title = $(image_element).attr('alt');
    var video_img = $(image_element).attr('src');

    var new_element = make_link(true, title, video_id, video_img);
    $(e.target).parents('.flixstack-wrapper').replaceWith(new_element);
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
 * @param title
 *  The title of the video.
 * @param video_id
 *  The ID of the video.
 * @prarm image_url
 *  The image URL of the video boxart.
 */
function onclick_add(e, title, video_id, img) {
  var jq_e = $(e.target).parents('.agMovie');

  flixstack_api.add_to_stack(title, video_id, img, function(data, textStatus) {
    var image_element = $('.boxShotImg', jq_e);
    var title = $(image_element).attr('alt');
    var video_img = $(image_element).attr('src');

    var new_element = make_link(false, title, video_id, video_img);
    $(e.target).parents('.flixstack-wrapper').replaceWith(new_element);
  });

  e.preventDefault();
  e.stopPropagation();
  return false;
}
