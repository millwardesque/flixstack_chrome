var user;

$(document).ready(function() {
  // Initial page setup.
  show_loading();

  flixstack_api.connect(function(data, textStatus) {
    user = data;
    update_status();

    if (is_signed_in()) {
      create_links();

      flixstack_api.load_stack(function(data, textStatus) {
        create_stack('.logged-in ol', data);
      });
    }
  });

  // Click on the logout button.
  $('.logout').click(function() {
    show_loading();

    flixstack_api.logout(function(data, textStatus) {
      user = undefined;
      update_status();
      add_message("You have successfully logged out.<br />Come back soon!");
      remove_links();
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
      create_links();
      flixstack_api.load_stack(function(data, textStatus) {
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

  $('.settings-toggle').click(function(e) {
      $(this).siblings('.shelf').slideToggle();
      e.stopPropagation();
      e.preventDefault();
    });
});

function create_stack(target, data) {
  for (var i in data) {
    var is_odd = i % 2;
    var is_first = (i == 0);
    var is_last = (i == (data.length - 1));

    var stack_item = $('<li class="movie ' + (is_odd ? "odd" : "even") + (is_first ? ' first' : '') + (is_last ? ' last' : '') + ' clearfix" data-movieid="' + data[i]["Video ID"] + '"><a class="movie-entry mobile-grid-85 grid-parent">' + 
        '<div class="boxart mobile-grid-25">' + data[i]["Video Image"] + '</div>' +
        '<div class="movie-title mobile-grid-65">' + data[i].node_title + '</div></a>' + 
        '<div class="shelf-toggle mobile-grid-15"><a href="#"><img alt="Toggle for opening the shelf" src="images/arrow-closed.png" /></a></div>' +
        '<div class="shelf mobile-grid-100 grid-parent" style="display:none"><div class="content mobile-grid-100"><a class="mark-as-watched mobile-grid-50 grid-parent" href="#">Mark as watched</a><a class="remove mobile-grid-50" href="#">Remove</a></div></div>' +
        '</li>');

    $('.mark-as-watched', stack_item).click(function(e) {
      var movie_id = $(this).parents('.movie').attr('data-movieid');
      flixstack_api.mark_as_watched(movie_id, function() {
        $('[data-movieid="' + movie_id + '"]').remove();
      });
    });
    $('.remove', stack_item).click(function(e) {
      var movie_id = $(this).parents('.movie').attr('data-movieid');
      flixstack_api.remove_from_stack(movie_id, function() {
        $('[data-movieid="' + movie_id + '"]').remove();
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

  if (data.length == 0) {
    var stack_item = $("<li><div class=\"no-movies mobile-grid-100\">You don't have any movies saved.<a href=\"http://www.netflix.com\" target=\"_blank\">Why not add some?</a></div></li>");
    $(target).append(stack_item);
  }
}

function create_links() {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "create links" }, function(response) {
        console.log("Links created");
      });
    });
  }
}

function remove_links() {
  if (chrome.tabs) {
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, { operation: "remove links" }, function(response) {
        console.log("Links removed");
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
  $('.logout').show();
   
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
