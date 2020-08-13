var body = {};
var loader = $("#customLoader");
var defaultProfilePic = "https://uploads-ssl.webflow.com/5f1abf099448a85d4dad24b1/5f30aa01afd43077d5cf9c10_default.svg";



$(function () {
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

        if (usr.profilePicURL)
            $("#p_profilePic").attr("src", usr.profilePicURL)

        $("#email_sendButton").click(function () {
            sendEmail();
            return false;
        });

        body.ToEmailAddress = usr.email;
        console.log(usr);

        loader.hide();

    });

    const clientRef = dbRef.child("Config");
    clientRef.on("value", async snap => {
        endpoint = snap.val().base + snap.val().endpoint_genericMail;
        xFrame = snap.val().xFrameTag;
    });

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            const dbRef = firebase.database().ref();
            const userRef = dbRef.child("users/" + user.uid);
            userRef.on("value", snap => {
                console.log(snap.val());
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

function sendEmail() {
    loader.show();
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

            //alert("Email sent");
            $("#email_title").val('');
            $("#email_text").val('');

            $("#email-wrapper").hide();
            $(".success-message").show();

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