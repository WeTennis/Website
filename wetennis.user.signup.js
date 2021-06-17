var authUser = {};
var provider = new firebase.auth.GoogleAuthProvider();
var loader = $("#customLoader");
var endpoint;
var xFrame;

var encr_salt = null;
var encr_salt2 = null;

async function logout() {
    await firebase
        .auth()
        .signOut()
        .then(function () { })
        .catch(function (error) { });
}

async function login() {

    if (!loginFormIsValid()) {
        showErrorMessage("Please fill in all the fields.");
        return false;
    }

    if (!isEmail($("#login_email").val())) {
        showErrorMessage("Please fill in a valid email address.");
        return false;
    }

    loader.show();

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

                    if (snap.val().isDisabled) {
                        logout();
                        showErrorMessage("Account disabled by admin.");
                        loader.hide();
                    }
                    else if (snap.val().verified) {
                        window.open("/my-profile", "_self").focus();
                    } else {
                        logout();
                        showErrorMessage("Please verify your account first.");
                        loader.hide();
                    }
                });
            }
        })
        .catch(function (error) {
            showErrorMessage(error.message);
            loader.hide();
        });
}

async function createProfile() {

    if (!joinFormIsValid()) {

        showErrorMessage("Please fill in all the fields.");
        return false;
    }

    if (!isEmail($("#join_email").val())) {
        showErrorMessage("Please fill in a valid email address.");
        return false;
    }

    if (!isValidPassword()) {
        showErrorMessage("Password must have a minimum of 6 characters.");
        return false;
    }

    loader.show();
    try {

        var u = $("#join_email").val();
        var p = $("#join_password").val();

        const userAuth = await firebase
            .auth()
            .createUserWithEmailAndPassword(u, p);

        var user = {
            uid: userAuth.user.uid,
            email: userAuth.user.email,
            isAdmin: false,
            verified: false,
            isDisabled: false
        };

        await firebase
            .database()
            .ref("users/" + user.uid)
            .set(user)
            .then(async x => {
                
                logout();
                var iv = CryptoJS.enc.Hex.parse(encr_salt2);
                var encrypted = CryptoJS.AES.encrypt(
                    user.uid + '|' + u + '|' + p,
                    encr_salt,
                    {
                        iv: iv,
                        mode: CryptoJS.mode.CBC,
                        padding: CryptoJS.pad.Pkcs7
                    }
                );

                sendEmail(user.email, encrypted.toString());
                clearJoinUI();
            })
            .catch(error => {
                showErrorMessage(error.message);
                loader.hide();
            });
    } catch (e) {
        showErrorMessage(e.message);
        loader.hide();
    }
}

async function Google() {
    try {
        firebase
            .auth()
            .signInWithPopup(provider)
            .then(async function (result) {
                var token = result.credential.accessToken;
                var user = result.user;

                var usr = {
                    uid: user.uid,
                    email: user.email,
                    isAdmin: false,
                    verified: true,
                    isDisabled: false
                };

                await firebase
                    .database()
                    .ref("users/" + usr.uid)
                    .update(usr)
                    .then(async x => {
                        window.open("/my-profile", "_self").focus();
                    })
                    .catch(error => {
                        showErrorMessage(error.message);
                        loader.hide();
                    });
            })
            .catch(function (error) {
                showErrorMessage(error.message);
                loader.hide();
            });
    } catch (e) {
        showErrorMessage(e.message);
        loader.hide();
    }
}

function facebook() {
    try {
        firebase
            .auth()
            .signInWithPopup(new firebase.auth.FacebookAuthProvider())
            .then(async function (result) {
                var token = result.credential.accessToken;
                var user = result.user;

                var usr = {
                    uid: user.uid,
                    email: user.email,
                    isAdmin: false,
                    verified: true,
                    isDisabled: false
                };

                await firebase
                    .database()
                    .ref("users/" + usr.uid)
                    .update(usr)
                    .then(async x => {
                        window.open("/my-profile", "_self").focus();
                    })
                    .catch(error => {
                        showErrorMessage(error.message);
                        loader.hide();
                    });
            })
            .catch(function (error) {
                showErrorMessage(error.message);
                loader.hide();
            });
    } catch (e) {
        showErrorMessage(e.message);
        loader.hide();
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

    //var u = "roland@kreonovo.com";
    //var p = "testerLester!@#$%^&*1233445566778";
    //var salt = create_UUID();

    //console.log("u= " + u);
    //console.log("p= " + p);
    //console.log("salt: " + salt);


    //// Encrypt
    //var ciphertext = CryptoJS.AES.encrypt(u + '|' + p, salt);

    //console.log("Encrypted Value: " + ciphertext);

    //// Decrypt
    //var bytes = CryptoJS.AES.decrypt(ciphertext.toString(), salt);
    //var plaintext = bytes.toString(CryptoJS.enc.Utf8);

    //console.log("Decrypted Value: " + plaintext);

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
        encr_salt = snap.val().salt;
        encr_salt2 = snap.val().salt2;
    });
});

function sendEmail(email, token) {
    loader.show();

    var body = {};
    body.title = "Please verify your account";
    body.Content = window.location.origin + "/verify-account?token=" + encodeURIComponent(token);
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

            $("#successTextMessage").html("Your profile has been created. Please check your email. Please check your spam box if you did not receive an email.");
            $("#success-bar").slideDown('slow').delay(3500).slideUp('slow');

            loader.hide();

            return false;
        },
        error: function (x) {
            $(".error-message").show();
        }
    });
    return false;
}

function loginFormIsValid() {
    var u = $("#login_email").val();
    var p = $("#login_password").val();

    if (u && p)
        return true;
    return false;
}

function joinFormIsValid() {
    var u = $("#join_email").val();
    var p = $("#join_password").val();

    if (u && p)
        return true;
    return false;
}

function showErrorMessage(msg) {
    $("#errorTextMessage").html(msg);
    $("#error-bar").slideDown('slow').delay(3500).slideUp('slow');
}

function showSuccessMessage(msg) {
    $("#successTextMessage").html(msg);
    $("#success-bar").slideDown('slow').delay(3500).slideUp('slow');
}

function isEmail(email) {
    var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
    return regex.test(email);
}

function isValidPassword() {
    return $("#join_password").val().length > 5;
}

function create_UUID() {
    var dt = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid.split("-").join("");
}