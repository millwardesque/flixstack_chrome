var user;

$(document).ready(function() {
  // Initial page setup.
  show_loading();

  chrome.tabs.executeScript(null,{
    file: "js/flixstack.js"
  });

  connect(function(data, textStatus) {
    user = data;
    update_status();

    if (is_signed_in()) {
      create_links();

      load_stack(function(data, textStatus) {
        create_stack('.logged-in ol', data);
      });
    }
  });

  // Click on the logout button.
  $('.logged-in .logout').click(function() {
    show_loading();

    logout(function(data, textStatus) {
      user = undefined;
      update_status();
      remove_links();
      $('.logged-in ol').html('');
    });
    update_status();
  });

  // Click on the login button.
  $('.login #submit').click(function() {
    var username = $('.login #username').val();
    var password = $('.login #password').val();
    $('.login #password').val('');

    show_loading();
    login(username, password, function(data, textStatus) {
      user = data;
      update_status();
      create_links();
      load_stack(function(data, textStatus) {
        create_stack('.logged-in ol', data);
      });
    },
    function() {
      $('.messages').html('Login failed, please try again.');
    })
  });
})

function load_stack(callback) {
  var url = 'http://flixqueue.local/service/netflix/video_queue_view.json';
  var get_data = {};

  $.get(url, get_data, callback, 'json');
}

function create_stack(target, data) {
  for (var i in data) {
      var stack_item = $('<li><a>' + data[i]["Video Image"] + "<span>" + data[i].node_title + '</span></a></li>');
      $('a', stack_item).attr('href', "http://movies.netflix.com/WiPlayer?movieid=" + data[i]["Video ID"]).attr('target', '_blank');
      $(target).append(stack_item);
    }
}

function create_links() {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendMessage(tab.id, { operation: "create links" }, function(response) {
      console.log("Links created");
    });
  });
}

function remove_links() {
  chrome.tabs.getSelected(null, function(tab) {
    chrome.tabs.sendMessage(tab.id, { operation: "remove links" }, function(response) {
      console.log("Links removed");
    });
  });
}

function connect(callback) {
  var url = 'http://flixqueue.local/service/netflix/system/connect.json';
  var post_data = {};

  $.post(url, post_data, callback, 'json');
}

function login(username, password, callback_success, callback_401) {
  var url = 'http://flixqueue.local/service/netflix/user/login.json';
  var post_data = {
    'username': username,
    'password': password
  };

  $.post(url, post_data, callback_success, 'json').fail(callback_401);
}

function logout(callback) {
  var url = 'http://flixqueue.local/service/netflix/user/logout.json';
  var post_data = {};

  $.post(url, post_data, callback, 'json');
}

function is_signed_in() {
  if (typeof user == "object" && user.user.uid > 0) {
    return true;
  }
  else {
    return false;
  }
}

function show_loading() {
  $('.loading').show();
  $('.logged-in').hide();
  $('.login').hide();
  
  $('.messages').html('');
}

function update_status() {
  $('.messages').html('');

  if (is_signed_in()) {
    $('.loading').hide();
    $('.login').hide();
    $('.logged-in').show();
  }
  else {
    $('.loading').hide();
    $('.login').show();
    $('.logged-in').hide();
  }
}
