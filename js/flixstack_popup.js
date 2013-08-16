var user,
  spinners = {};

$(document).ready(function() {
  // Initial page setup.
  show_loading();

  flixstack_api.connect(function(data, textStatus) {
    user = data;
    update_status();

    if (is_signed_in()) {
      notify_create_links();

      flixstack_api.load_stack(function(data, textStatus) {
        create_stack('.logged-in ol', data);
      });
    }
  });

  // Click on the logout button.
  $('.logout').click(function() {
    show_loading();
    console.log("Showing loading...");

    flixstack_api.logout(function(data, textStatus) {
      user = undefined;
      notify_remove_links();
      update_status();
      add_message("You have successfully logged out.<br />Come back soon!");
    });
    update_status();
  });

  // Click on the login button.
  $('.login #login-submit').click(function(e) {
    var username = $('.login #username').val();
    var password = $('.login #password').val();
    $('.login #password').val('');

    show_loading();
    flixstack_api.login(username, password, function(data, textStatus) {
      user = data;
      update_status();
      notify_create_links();
      flixstack_api.load_stack(function(data, textStatus) {
        $('.logged-in .flixstack-list').html('<ol></ol>');
        create_stack('.logged-in ol', data);
      });
    },
    function() {
      update_status();
      add_message('Login failed, please try again.');
    });

    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  // Toggle the settings shelf
  $('.settings-toggle').click(function(e) {
      $(this).siblings('.shelf').slideToggle();
      e.stopPropagation();
      e.preventDefault();
    });
}); // End document.ready()

function create_stack(target, data) {
  for (var i in data) {
    var is_odd = i % 2;
    var is_first = (i == 0);
    var is_last = (i == (data.length - 1));

    var stack_item = $('<li class="movie ' + (is_odd ? "odd" : "even") + (is_first ? ' first' : '') + (is_last ? ' last' : '') + ' clearfix" data-movieid="' + data[i]["Video ID"] + '"><a class="movie-entry mobile-grid-85 grid-parent" title="Watch ' + data[i].node_title + '">' + 
        '<div class="boxart mobile-grid-25">' + data[i]["Video Image"] + '</div>' +
        '<div class="movie-title mobile-grid-65">' + data[i].node_title + '</div></a>' + 
        '<div class="shelf-toggle mobile-grid-15"><a href="#"><img alt="Toggle for opening the shelf" src="images/arrow-closed.png" /></a></div>' +
        '<div class="shelf mobile-grid-100 grid-parent" style="display:none"><div class="content mobile-grid-100"><a class="mark-as-watched mobile-grid-50 grid-parent" href="#">Mark as watched</a><a class="remove mobile-grid-50" href="#">Remove</a></div></div>' +
        '</li>');

    $('.mark-as-watched', stack_item).click(function(e) {
      var movie_id = $(this).parents('.movie').attr('data-movieid');
      flixstack_api.mark_as_watched(movie_id, function() {
        $('[data-movieid="' + movie_id + '"]').remove();
        notify_video_watched(movie_id);
      });
    });
    $('.remove', stack_item).click(function(e) {
      var movie_id = $(this).parents('.movie').attr('data-movieid');
      flixstack_api.remove_from_stack(movie_id, function() {
        $('[data-movieid="' + movie_id + '"]').remove();
        notify_video_removed(movie_id);
      });
    });

    $('.movie-entry', stack_item).attr('href', "http://movies.netflix.com/WiPlayer?movieid=" + data[i]["Video ID"]).attr('target', '_blank');
    $('.shelf-toggle', stack_item).click(function(e) {
      var shelf = $(this).siblings('.shelf');
      var will_be_opened = ($(shelf).css('display') == "none");
      if (will_be_opened) {
        $('img', this).attr('src', "images/arrow-open.png");
      }
      else {
        $('img', this).attr('src', "images/arrow-closed.png");
      }
      $(shelf).slideToggle('fast');
      e.stopPropagation();
      e.preventDefault();
    });
    $(target).append(stack_item);

    $('.movie-title', stack_item).truncate();
  }
  
  add_find_more_movies_link(target);
}

function add_find_more_movies_link(target) {
  var stack_item = $("<div class=\"find-more-movies mobile-grid-100\"><a href=\"http://www.netflix.com\" target=\"_blank\">Find more movies</a></div>");
  $(target).after(stack_item);
}

function notify_create_links() {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "create links" }, function(response) {
        console.log("Links created");
      });
    });
  }
}

function notify_remove_links() {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "remove links" }, function(response) {
        console.log("Links removed");
      });
    });
  }
}

function notify_video_removed(video_id) {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "video removed", video_id: video_id }, function(response) {
        console.log("Video " + video_id + " removed.");
      });
    });
  }
}

function notify_video_watched(video_id) {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "video watched", video_id: video_id }, function(response) {
        console.log("Video " + video_id + " watched.");
      });
    });
  }
}

function is_signed_in() {
  if (typeof user == "object" && user.user.uid > 0) {
    return true;
  }
  else {
    return false;
  }
}

function add_message(message) {
  $('.messages').append('<li>' + message + '</li>');
  $('.messages').show();
}

function show_loading() {
  $('.loading').show();
  $('.logged-in').hide();
  $('.login').hide();
  $('.logout').hide();

  $('.loading').each(function(index, element) {
    add_spinner(element, {left: "210px"});
  });
   
  $('.messages').hide().html('');
}

function update_status() {
  $('.messages').hide().html('');

  if (is_signed_in()) {
    $('.loading').hide();
    $('.login').hide();
    $('.logged-in').show();
    $('.logout').show();

    $('header h1').html("Flix to watch");
  }
  else {
    $('.loading').hide();
    $('.login').show();
    $('.logged-in').hide();
    $('.logout').hide();

    $('header h1').html("Login");
  }
}

function add_spinner(element, options) {
  var opts = $.extend({
    lines: 9, // The number of lines to draw
    length: 5, // The length of each line
    width: 3, // The line thickness
    radius: 4, // The radius of the inner circle
    corners: 1, // Corner roundness (0..1)
    rotate: 0, // The rotation offset
    direction: 1, // 1: clockwise, -1: counterclockwise
    color: '#000', // #rgb or #rrggbb
    speed: 1, // Rounds per second
    trail: 60, // Afterglow percentage
    shadow: false, // Whether to render a shadow
    hwaccel: false, // Whether to use hardware acceleration
    className: 'spinner', // The CSS class to assign to the spinner
    zIndex: 2e9, // The z-index (defaults to 2000000000)
    top: 'auto', // Top position relative to parent in px
    left: 'auto' // Left position relative to parent in px
  }, options);

  if (!spinners[element]) {
    spinners[element] = new Spinner(opts).spin(element);
  }
  else {
    spinners[element].spin(element);
  }
}

function remove_spinner(element) {
  if (spinners[element]) {
    spinners[element].stop();
  }
}
