var body = {};
var loader = $("#customLoader");
var defaultProfilePic = "https://uploads-ssl.webflow.com/5f1abf099448a85d4dad24b1/5f30aa01afd43077d5cf9c10_default.svg";
var authUser = {};


$(function () {

    $("#icon_facebook").hide();
    $("#icon_instagram").hide();
    $("#icon_twitter").hide();

    $("#email_player_wrapper").hide();
    $("#login_to_send_email").show();

    loader.show();
    var player = new URLSearchParams(window.location.search).get("player");

    const dbRef = firebase.database().ref();
    dbRef.child('users').orderByChild('shareLink').equalTo(player).on('child_added', async snap => {

        let usr = snap.val();

        $("#p_name").html(usr.name);
        $("#p_message_name").html(usr.name);
        $("#p_surname").html(usr.surname);
        $("#p_age").html(calcAge(new Date(usr.birthday)));
        $("#p_location").html(usr.location);
        $("#p_ability").html(usr.ability);
        $("#p_localCourts").html(usr.localCourts);
        $("#p_aboutMe").html(usr.aboutMe);

        var f = $.trim(usr.name).substring(0, 1);
        var l = $.trim(usr.surname).substring(0, 1);

        $("#p_avatar_letter").html(f + l);

        if (usr.profilePicURL)
            $("#p_profilePic").attr("src", usr.profilePicURL)
        else
            $("#p_profilePic").hide();

        if (usr.facebook) {
            $("#icon_facebook").attr("href", usr.facebook);
            $("#icon_facebook").attr("target", "_blank");
            $("#icon_facebook").show();
        }

        if (usr.instagram) {
            $("#icon_instagram").attr("href", usr.instagram);
            $("#icon_instagram").attr("target", "_blank");
            $("#icon_instagram").show();
        }

        if (usr.twitter) {
            $("#icon_twitter").attr("href", usr.twitter);
            $("#icon_twitter").attr("target", "_blank");
            $("#icon_twitter").show();
        }

        $("#email_sendButton").click(function () {
            sendEmail(usr.name + ' ' + usr.surname);
            return false;
        });

        body.ToEmailAddress = usr.email;
        console.log(usr);

        loader.hide();

    });

    const clientRef = dbRef.child("Config");
    clientRef.on("value", async snap => {
        endpoint = snap.val().base + snap.val().endpoint_playerMail;
        xFrame = snap.val().xFrameTag;
    });

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            $("#email_player_wrapper").show();
            $("#login_to_send_email").hide();

            const dbRef = firebase.database().ref();
            const userRef = dbRef.child("users/" + user.uid);
            userRef.on("value", snap => {
                console.log(snap.val());
                authUser = snap.val();
                if (snap.val().isAdmin) {

                    
                    $("#link_adminEditPage").show();

                    $("#link_adminEditPage").click(function () {
                        window.open("/my-profile?player=" + player, "_self").focus();
                    });
                }
            });
        } else {
            // nothing
        }
    });
});

function sendEmail(playerName) {

    if (!ifValidForm())
        return;

    loader.show();
    body.SenderEmail = authUser.email; //$("#sender_email").val();
    body.SenderName = authUser.name + ' ' + authUser.surname;
    body.title = $("#email_title").val();
    body.Content = $("#email_text").val();

    $.ajax({
        url: endpoint,
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(body),
        headers: {
            "x-frame-tag": xFrame
        },
        success: function (data) {
            console.info(data);

            showSuccessMessage("Email sent to " + playerName);

            $("#sender_email").val('');
            $("#email_title").val('');
            $("#email_text").val('');

            loader.hide();

            return false;
        },
        error: function (x) {
            $(".error-message").show();
        }
    });
    return false;
}

function calcAge(date) {
    return (new Date()).getFullYear() - date.getFullYear();
}


function ifValidForm() {

    //var email = $("#sender_email").val();
    //if (!email) {
    //    showErrorMessage("Email cannot be empty");
    //    return false;
    //}
    //if (!isEmail(email)) {
    //    showErrorMessage("Please enter a valid email address.");
    //    return false;
    //}

    var title = $("#email_title").val();
    if (!title) {
        showErrorMessage("Title cannot be empty");
        return false;
    }

    var text = $("#email_text").val();
    if (!text) {
        showErrorMessage("Text cannot be empty");
        return false;
    }

    return true;
}

function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}

function showErrorMessage(msg) {
    $("#errorTextMessage").html(msg);
    $("#error-bar").slideDown('slow').delay(3500).slideUp('slow');
}

function showSuccessMessage(msg) {
    $("#successTextMessage").html(msg);
    $("#success-bar").slideDown('slow').delay(3500).slideUp('slow');
}
