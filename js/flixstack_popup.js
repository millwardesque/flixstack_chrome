var user, // Currently logged in user information.
  spinners = {},  // A hash of all active spinners.
  StateEnum = {
    FlixToWatch: "flix-to-watch",
    Login: "login",
    Registration: "registration",
    Loading: "loading",
  },
  current_state = '';

$(document).ready(function() {
  // Initial page setup.
  change_state(StateEnum.Loading);

  flixstack_api.connect(function(data, textStatus) {
    user = data;

    if (is_signed_in()) {
      change_state(StateEnum.FlixToWatch);
      notify_create_links();

      flixstack_api.load_stack(function(data, textStatus) {
        create_stack('.logged-in ol', data);
      });
    }
    else {
      change_state(StateEnum.Login);
    }
  });

  // Click on the logout button.
  $('.logout').click(function() {
    change_state(StateEnum.Loading);

    flixstack_api.logout(function(data, textStatus) {
      user = undefined;
      notify_remove_links();
      change_state(StateEnum.Login);
      add_message("You have successfully logged out.<br />Come back soon!", "info");
    });
  });

  // Click on the login button.
  $('.login #login-submit').click(function(e) {
    var username = $('.login #username').val();
    var password = $('.login #password').val();
    $('.login #password').val('');

    change_state(StateEnum.Loading);
    flixstack_api.login(username, password, function(data, textStatus) {
      user = data;
      change_state(StateEnum.FlixToWatch);
      notify_create_links();
      flixstack_api.load_stack(function(data, textStatus) {
        $('.logged-in .flixstack-list').html('<ol></ol>');
        create_stack('.logged-in ol', data);
      });
    },
    function() {
      change_state(StateEnum.Login);
      add_message('Login failed, please try again.', "error");
    });

    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  // Click on the register button.
  $('.registration #registration-submit').click(function(e) {
    var email = $('.registration #registration-username').val();
    var password = $('.registration #registration-password').val();
    $('.registration #registration-password').val('');

    change_state(StateEnum.Loading);
    flixstack_api.register(email, email, password, function(data, textStatus) {
      flixstack_api.login(email, password, function(data, textStatus) {
        user = data;
        change_state(StateEnum.FlixToWatch);
        add_message("Registration complete. Welcome to FlixStack!");
        notify_create_links();
        flixstack_api.load_stack(function(data, textStatus) {
          $('.logged-in .flixstack-list').html('<ol></ol>');
          create_stack('.logged-in ol', data);
        });
      },
      function() {
        change_state(StateEnum.Login);
        add_message('Login failed, please try again.', "error");
      });
    },
    function() {
      change_state(StateEnum.Register);
      add_message('Registration failed, please try again.', "error");
    });

    e.preventDefault();
    e.stopPropagation();
    return false;
  });

  // Click on the "New User" / "Registration" link.
  $('.login .register-link').click(function(e) {
    change_state(StateEnum.Registration);
  });

  // Click on the "New User" / "Registration" link.
  $('.registration .existing-user').click(function(e) {
    change_state(StateEnum.Login);
  });
}); // End document.ready()

/**
 * Create the stack of movies in the popup window.
 *
 * @target
 *  The container for the list items
 * @data
 *  An array of objects describing the movie.
 */
function create_stack(target, data) {
  for (var i in data) {
    var is_odd = i % 2;
    var is_first = (i == 0);
    var is_last = (i == (data.length - 1));

    var stack_item = create_stack_item_html(data[i]["Video ID"], data[i].node_title, data[i]["Video Image"], is_odd, is_first, is_last);

    $('.mark-as-watched', stack_item).click(function(e) {
      var movie_id = $(this).parents('.movie').attr('data-movieid');
      ga_track_click("Video", "Mark as watched", "Plugin", movie_id);
      flixstack_api.mark_as_watched(movie_id, function() {
        $('[data-movieid="' + movie_id + '"]').remove();
        notify_video_watched(movie_id);
      });
    });

    $('.remove', stack_item).click(function(e) {
      var movie_id = $(this).parents('.movie').attr('data-movieid');
      ga_track_click("Video", "Remove", "Plugin", movie_id);
      flixstack_api.remove_from_stack(movie_id, function() {
        $('[data-movieid="' + movie_id + '"]').remove();
        notify_video_removed(movie_id);
      });
    });

    $('.movie-entry', stack_item).attr('href', "http://movies.netflix.com/WiPlayer?movieid=" + data[i]["Video ID"]).attr('target', '_blank');
    $('.movie-entry').click(function(e) {
      var movie_id = $(this).parents('.movie').attr('data-movieid');
      ga_track_click("Video", "Play", "Plugin", movie_id);
    });

    $('.shelf-toggle', stack_item).click(function(e) {
      var shelf = $(this).siblings('.shelf');
      var will_be_opened = ($(shelf).css('display') == "none");
      var movie_id = $(this).parents('.movie').attr('data-movieid');

      if (will_be_opened) {
        $('img', this).attr('src', "images/arrow-open.png");
        ga_track_click("Video", "Toggle Shelf", "Open", movie_id);
      }
      else {
        $('img', this).attr('src', "images/arrow-closed.png");
        ga_track_click("Video", "Toggle Shelf", "Close", movie_id);
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

/**
 * Creates just the HTML element for a stick item.
 * Does not attach events.
 *
 */
function create_stack_item_html(video_id, title, image_html, is_odd, is_first, is_last) {
  var li_classes = 'movie clearfix';
  li_classes += (is_odd ? ' odd' : ' even');
  li_classes += (is_last ? ' last' : '')
  var element = $('<li class="' + li_classes + '" data-movieid="' + video_id + '">' +
        '<a class="movie-entry mobile-grid-85 grid-parent" title="Watch ' + title + '">' + 
          '<div class="boxart mobile-grid-25">' + image_html + '</div>' +
          '<div class="movie-title mobile-grid-65">' + title + '</div>' + 
        '</a>' + 
        '<div class="shelf-toggle mobile-grid-15">' + 
          '<a title="Toggle the video details" href="#"><img alt="Toggle for opening the details" src="images/arrow-closed.png" /></a>' +
        '</div>' + 
        '<div class="shelf mobile-grid-100 grid-parent" style="display:none">' + 
          '<div class="content mobile-grid-100">' +
            '<a class="mark-as-watched mobile-grid-50 grid-parent" title="Mark this video as watched" href="#">Mark as watched</a>' + 
            '<a class="remove mobile-grid-50" title="Remove this video from the stack" href="#">Remove</a>' +
          '</div>' + 
        '</div>' +
      '</li>');

  return element;
}

/**
 * Adds the "Find more movies" link to the bottom of the FlixStack list.
 *
 * @target
 *  The element after which we'll add the target.
 */
function add_find_more_movies_link(target) {
  var stack_item = $("<div class=\"find-more-movies mobile-grid-100\"><a title=\"Find more movies to watch\" href=\"http://www.netflix.com\" target=\"_blank\">Find more movies</a></div>");
  $(target).after(stack_item);
  $('a', stack_item).click(function(e) {
    ga_track_click("Video", "Find more movies", "Plugin");
  });
}

/**
 * Notify the on-page script that it should add all of the FlixStack links.
 */
function notify_create_links() {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "create links" }, function(response) {
        console.log("Links created");
      });
    });
  }
}

/**
 * Notify the on-page script that it should remove any FlixStack links.
 */
function notify_remove_links() {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "remove links" }, function(response) {
        console.log("Links removed");
      });
    });
  }
}

/**
 * Notify the on-page script that a video has been removed from the stack.
 *
 * @param video_id
 *  The video ID that was removed.
 */
function notify_video_removed(video_id) {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "video removed", video_id: video_id }, function(response) {
        console.log("Video " + video_id + " removed.");
      });
    });
  }
}

/**
 * Notify the on-page script that a video has been watched.
 *
 * @param video_id
 *  The video ID that was watched.
 */
function notify_video_watched(video_id) {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "video watched", video_id: video_id }, function(response) {
        console.log("Video " + video_id + " watched.");
      });
    });
  }
}

/**
 * Returns whether or not a user has signed in.
 */
function is_signed_in() {
  if (typeof user == "object" && user.user.uid > 0) {
    return true;
  }
  else {
    return false;
  }
}

/**
 * Adds a message to the system
 */
function add_message(message, type) {
  var $messages = $('.messages');

  if (!type) {
    type = 'info';
  }

  $messages.append('<li>' + message + '</li>');
  $messages.show();

  if (($messages.hasClass('info') && type != 'info') ||
      ($messages.hasClass('error') && type != 'error')) {
    $messages.addClass('mixed');
  }
  else {
    $messages.addClass(type);
  }
}

/**
 * Clears messages from display.
 */
function clear_messages() {
  $('.messages').hide().html('').removeClass('info').removeClass('error').removeClass('mixed');
}

/**
 * Updates the state of the window panes.
 */
function change_state(new_state) {
  if (current_state == new_state) {
    console.log("Unable to change state: Already in state " + new_state);
    return;
  }

  // Set the new state.
  switch(new_state) {
    case StateEnum.Loading:
      $('.panel-container').hide();
      $('.loading').show();
      
      $('.loading').each(function(index, element) {
        add_spinner(element, {left: "210px"});
      });
      break;

    case StateEnum.FlixToWatch:
      $('.panel-container').hide();
      $('.loading').hide();
      $('.logged-in').show();
      $('header h1').html("Flix to watch");
      break;

    case StateEnum.Login:
      $('.panel-container').hide();
      $('.loading').hide();
      $('.login').show();
      $('header h1').html("Login");
      break;

    case StateEnum.Registration:
      $('.panel-container').hide();
      $('.loading').hide();
      $('.registration').show();
      $('header h1').html("Registration");
      break;

    default:
      break;
  }

  clear_messages();
  console.log("Changed state from: " + current_state + " to " + new_state);
  current_state = new_state;
}

/**
 * Adds a jQuery spinner to an element.
 */
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

/**
 * Removes a spinner attached to a certain element.
 *
 * @param element
 */
function remove_spinner(element) {
  if (spinners[element]) {
    spinners[element].stop();
  }
}

/**
 * Tracks a click on a link.
 */
function ga_track_click(category, action, label, value) {
  if (typeof _gaq != "undefined") {
    _gaq.push(['_trackEvent', category, action, label, value]);
  }
}

/**
 * Sets up the default GA tracking on non-AJAX'd elements.
 */
function setup_default_ga_tracking() {
  $('.login-links .register').click(function(e) {
    ga_track_click("Account", "Register", "External");
  });

  $('.login-links .forgot-password').click(function(e) {
    ga_track_click("Account", "Forgot password", "External");
  });

  $('#login-form').click(function(e) {
    ga_track_click("Account", "Login Submit", "Onpage form");
  });

  $('.flixstack-settings .visit-flixstack').click(function(e) {
    ga_track_click("Account", "Visit Flixstack", "External");
  });

  $('.flixstack-settings .leave-feedback').click(function(e) {
    ga_track_click("Account", "Leave Feedback", "External");
  });

  $('.flixstack-settings .logout').click(function(e) {
    ga_track_click("Account", "Logout", "Footer settings logout");
  });
}
