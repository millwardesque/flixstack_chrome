var queued_map = {};

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.operation == "create links") {
      create_links();
    }
    else if (request.operation == "remove links") {
      remove_links();
    }
  }
);
console.log("FlixStack Loaded");

function create_links() {
  var ids_to_queue = [];
  $('.agMovie a').each(function(index, element) {
    var video_id = get_video_id_from_url($(element).attr('href'));
    ids_to_queue.push(video_id);
  });

  check_queued(ids_to_queue, function(data, textStatus) {
    for (var key in data['ids']) {
      queued_map[key] = data['ids'][key];
    }

    $('.agMovie').each(function(index, element) {
      var image_element = $('.boxShotImg', element);
      var title = $(image_element).attr('alt');
      var img = $(image_element).attr('src');
      var video_id = get_video_id_from_url($('a', element).attr('href'));

      if (video_id) {
        $(element).append(make_link(!queued_map[video_id], title, video_id, img));
      }
    });
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
  $('.flixstack-wrapper').remove();
}

/**
 * Creates a FlixStack link
 */
function make_link(is_add_link, title, video_id, img) {
  var wrapper = $('<div class="flixstack-wrapper"></div>');
  var anchor_text = is_add_link ? "Add to FlixStack" : "Remove from FlixStack";
  var anchor_class = is_add_link ? "add" : "remove";
  var anchor = $('<a class="' + anchor_class + '" href="#">' + anchor_text + '</a>');

  // Click-handling
  $(anchor).click(function(e) {
    $(e).html("Loading...");
    if (is_add_link) {
      onclick_add(e, title, video_id);
    }
    else {
      onclick_remove(e, video_id);
    }
  });

  wrapper.append(anchor);
  return wrapper;
}

function onclick_remove(e, video_id) {
  var url = 'http://flixqueue.local/service/netflix/flixstack/targeted_actions/remove_from_queue.json';
  var post_data = {
    'id': video_id
  };
  var jq_e = $(e.target).parents('.agMovie');

  $.post(url, post_data, function(data, textStatus) {
    var image_element = $('.boxShotImg', jq_e);
    var title = $(image_element).attr('alt');
    var img = $(image_element).attr('src');

    var new_element = make_link(true, title, video_id, img);
    $(e.target).parents('.flixstack-wrapper').replaceWith(new_element);
  }, 'json');

  e.preventDefault();
  e.stopPropagation();
  return false;
}

function onclick_add(e, title, video_id) {
  var url = 'http://flixqueue.local/service/netflix/node.json';
  var post_data = {
    'title': title,
    'field_video_id[und][0][value]': video_id,
    'type': 'netflix_video'
    // @TODO Add img link.
  };
  var jq_e = $(e.target).parents('.agMovie');

  $.post(url, post_data, function(data, textStatus) {
    var image_element = $('.boxShotImg', jq_e);
    var title = $(image_element).attr('alt');
    var img = $(image_element).attr('src');

    var new_element = make_link(false, title, video_id, img);
    $(e.target).parents('.flixstack-wrapper').replaceWith(new_element);
  }, 'json');

  e.preventDefault();
  e.stopPropagation();
  return false;
}

function check_queued(video_ids, callback) {
  var url = 'http://flixqueue.local/service/netflix/flixstack/targeted_actions/are_ids_queued.json';
  var post_data = {
    'ids': video_ids.join('||'),
  };

  $.post(url, post_data, callback, 'json');
}