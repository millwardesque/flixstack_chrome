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
})

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
  }
  else {
    $('.loading').hide();
    $('.login').show();
    $('.logged-in').hide();
    $('.logout').hide();
  }
}
