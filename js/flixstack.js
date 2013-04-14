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
  var urls_to_queue = [];
  $('.agMovie a').each(function(index, element) {
    urls_to_queue.push($(element).attr('href'));
  });

  check_queued(urls_to_queue, function(data, textStatus) {
    queued_map = data['urls'];

    $('.agMovie').each(function(index, element) {
      var image_element = $('.boxShotImg', element);
      var title = $(image_element).attr('alt');
      var img = $(image_element).attr('src');
      var href = $('a', element).attr('href');

      $(element).append(make_link(!queued_map[href], title, href, img));
    });
  });
}

function remove_links() {
  $('.flixstack-wrapper').remove();
}

/**
 * Creates a FlixStack link
 */
function make_link(is_add_link, title, href, img) {
  var wrapper = $('<div class="flixstack-wrapper"></div>');
  var anchor_text = is_add_link ? "Add to FlixStack" : "Remove from FlixStack";
  var anchor_class = is_add_link ? "add" : "remove";
  var anchor = $('<a class="' + anchor_class + '" href="#">' + anchor_text + '</a>');

  // Click-handling
  $(anchor).click(function(e) {
    $(e).html("Loading...");
    if (is_add_link) {
      onclick_add(e, title, href);
    }
    else {
      onclick_remove(e, href);
    }
  });

  wrapper.append(anchor);
  return wrapper;
}

function onclick_remove(e, video_url) {
  var url = 'http://flixqueue.local/service/netflix/flixstack/targeted_actions/remove_from_queue.json';
  var post_data = {
    'url': video_url
  };
  var jq_e = $(e.target).parents('.agMovie');

  $.post(url, post_data, function(data, textStatus) {
    var image_element = $('.boxShotImg', jq_e);
    var title = $(image_element).attr('alt');
    var img = $(image_element).attr('src');
    var href = $('a', jq_e).attr('href')

    var new_element = make_link(true, title, href, img);
    $(e.target).replaceWith(new_element);
  }, 'json');

  e.preventDefault();
  e.stopPropagation();
  return false;
}

function onclick_add(e, title, href) {
  var url = 'http://flixqueue.local/service/netflix/node.json';
  var post_data = {
    'title': title,
    'field_video_link[und][0][url]': href,
    'type': 'netflix_video'
    // @TODO Add img link.
  };
  var jq_e = $(e.target).parents('.agMovie');

  $.post(url, post_data, function(data, textStatus) {
    var image_element = $('.boxShotImg', jq_e);
    var title = $(image_element).attr('alt');
    var img = $(image_element).attr('src');
    var href = $('a', jq_e).attr('href')

    var new_element = make_link(false, title, href, img);
    $(e.target).replaceWith(new_element);
  }, 'json');

  e.preventDefault();
  e.stopPropagation();
  return false;
}

function check_queued(video_urls, callback) {
  var url = 'http://flixqueue.local/service/netflix/flixstack/targeted_actions/are_urls_queued.json';
  var post_data = {
    'urls': video_urls.join('||'),
  };

  $.post(url, post_data, callback, 'json');
}