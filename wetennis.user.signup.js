var authUser = {};
var provider = new firebase.auth.GoogleAuthProvider();
var loader = $("#customLoader");
var endpoint;
var xFrame;

async function logout() {
    await firebase
        .auth()
        .signOut()
        .then(function () { })
        .catch(function (error) { });
}

async function login() {
    await firebase
        .auth()
        .signInWithEmailAndPassword(
            $("#login_email").val(),
            $("#login_password").val()
        )
        .then(function (usr) {
            if (usr) {
                const dbRef = firebase.database().ref();
                const userRef = dbRef.child("users/" + firebase.auth().currentUser.uid);
                userRef.on("value", snap => {
                    if (snap.val().verified) {
                        window.open("/my-profile", "_self").focus();
                    } else {
                        logout();
                        $(".error-bar").slideDown('slow').delay(3500).slideUp('slow');
                        $("#errorTextMessage").html("Please verify your account first.");
                        //alert("Please verify your account first.");

                    }
                });
            }
        })
        .catch(function (error) {
            alert(error.message);
        });
}

async function createProfile() {
    console.log("::01 ~> Enter createProfile method");
    loader.show();
    try {
        const userAuth = await firebase
            .auth()
            .createUserWithEmailAndPassword(
                $("#join_email").val(),
                $("#join_password").val()
            );

        var user = {
            uid: userAuth.user.uid,
            email: userAuth.user.email,
            isAdmin: false,
            verified: false
        };

        await firebase
            .database()
            .ref("users/" + user.uid)
            .set(user)
            .then(async x => {
                console.log("::02 ~> Create profile");
                clearJoinUI();
                logout();

                $("html, body").animate({ scrollTop: 0 }, "fast");
                sendEmail(user.uid, user.email);
            })
            .catch(error => {
                console.log("::03 ~> Error in promis catch.");
                alert(error.message);
            });
    } catch (e) {
        //console.log("::04 ~> Error in try catch.");
        //alert(e.message);
    }
}

async function Google() {
    try {

        console.log("Google Method::");

        firebase
            .auth()
            .signInWithPopup(provider)
            .then(async function (result) {

                console.log(":: ~> 01");

                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = result.credential.accessToken;
                // The signed-in user info.
                var user = result.user;

                console.log(user);

                var usr = {
                    uid: user.uid,
                    email: user.email,
                    isAdmin: false,
                    verified: true
                };

                await firebase
                    .database()
                    .ref("users/" + usr.uid)
                    .update(usr)
                    .then(async x => {
                        window.open("/my-profile", "_self").focus();
                        //clearJoinUI();
                        //logout();
                        //alert("Profile Created - Please verify your account.");
                    })
                    .catch(error => {
                        alert(error.message);
                    });
            })
            .catch(function (error) {

                console.log(":: ~> 02");
                console.log(error);

                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                // ...
            });
    } catch (e) {

        console.log(":: ~> 03");

        console.log(e);
    }
}

function facebook() {
    try {

        console.log("Facebook Method::");

        firebase
            .auth()
            .signInWithPopup(new firebase.auth.FacebookAuthProvider())
            .then(async function (result) {

                console.log(":: ~> 01");

                // This gives you a Google Access Token. You can use it to access the Google API.
                var token = result.credential.accessToken;
                // The signed-in user info.
                var user = result.user;

                console.log(user);

                var usr = {
                    uid: user.uid,
                    email: user.email,
                    isAdmin: false,
                    verified: true
                };

                await firebase
                    .database()
                    .ref("users/" + usr.uid)
                    .update(usr)
                    .then(async x => {
                        window.open("/my-profile", "_self").focus();
                        //clearJoinUI();
                        //logout();
                        //alert("Profile Created - Please verify your account.");
                    })
                    .catch(error => {
                        alert(error.message);
                    });

            })
            .catch(function (error) {

                console.log(":: ~> 02");
                console.log(error);

                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                // ...
            });
    } catch (e) {

        console.log(":: ~> 03");

        console.log(e);
    }
}

function clearJoinUI() {
    $("#join_email").val("");
    $("#join_password").val("");
}

function clearLoginUI() {
    $("#login_email").val("");
    $("#login_password").val("");
}

$(function () {
    //firebase.auth().signOut();


    $("#join_createButton").click(function () {
        createProfile();
        return false;
    });



    $("#join_createButton").click(function () {
        createProfile();
        return false;
    });

    $("#login_loginButton").click(function () {
        login();
        return false;
    });

    $("#join_createButton_G").click(function () {
        Google();
        return false;
    });

    $("#login_loginButton_G").click(function () {
        Google();
        return false;
    });

    $("#join_createButton_FB").click(function () {
        facebook();
        return false;
    });

    $("#login_loginButton_FB").click(function () {
        facebook();
        return false;
    });

    const dbRef = firebase.database().ref();
    const clientRef = dbRef.child("Config");
    clientRef.on("value", async snap => {
        endpoint = snap.val().base + snap.val().endpoint_genericMail;
        xFrame = snap.val().xFrameTag;
    });
});



function sendEmail(userid, email) {
    loader.show();

    var body = {};
    body.title = "Please verify your account";
    body.Content = window.location.origin + "/verify-account?v=" + userid;
    body.ToEmailAddress = email;

    console.log(endpoint);
    console.log(xFrame);

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

            alert("Profile Created - Please verify your account.");
            loader.hide();

            return false;
        },
        error: function (x) {
            $(".error-message").show();
        }
    });
    return false;
}