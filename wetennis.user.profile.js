var authUser = {};
var loader = $("#customLoader");
var successBar = $("#success-bar");
var errorBar = $("#error-bar");

let file = {};
var hasFile;
var defaultProfilePic = "https://uploads-ssl.webflow.com/5f1abf099448a85d4dad24b1/5f30aa01afd43077d5cf9c10_default.svg";

async function logout() {
    await firebase
        .auth()
        .signOut()
        .then(function () { })
        .catch(function (error) { });
}

async function saveProfile() {
    loader.show();

    var profile = {
        uid: authUser.uid,
        name: $("#p_name").val(),
        surname: $("#p_surname").val(),
        birthday: $("#p_birthday").val(),
        location: $("#p_location").val(),
        country: $("#p_country").val(),
        ability: $("#p_ability option:selected").val(),
        gender: $("#p_gender option:selected").val(),
        localCourts: $("#p_localCourts").val(),
        email: $("#p_email").val(),
        facebook: $("#p_facebook").val(),
        twitter: $("#p_twitter").val(),
        instagram: $("#p_instagram").val(),
        aboutMe: $("#p_aboutMe").val(),
    };

    profile.shareLink = (profile.name + '-' + profile.surname).replace(/\s+/g, "-").toLowerCase().latinize();

    try {
        await firebase
            .database()
            .ref("users/" + authUser.uid)
            .update(profile)
            .then(async x => {

                if (hasFile)
                    await firebase
                        .storage()
                        .ref("users")
                        .child(authUser.uid + "/profile.jpg")
                        .put(file).then(async y => {
                            await firebase
                                .storage()
                                .ref("users")
                                .child(authUser.uid + "/profile.jpg")
                                .getDownloadURL()
                                .then(async imgUrl => {
                                    profile.profilePicURL = imgUrl;
                                    await firebase
                                        .database()
                                        .ref("users/" + authUser.uid)
                                        .update(profile)
                                        .then(c => {
                                            console.log(y);

                                            successBar.slideDown('slow').delay(3500).slideUp('slow');
                                            initPage();
                                        });
                                })
                        });
                else {
                    successBar.slideDown('slow').delay(3500).slideUp('slow');
                    initPage();
                }
            })
            .catch(error => {
                console.log(error.message);
                loader.hide();
                errorBar.slideDown();
            });
    } catch (e) {
        console.log(e.message);
        loader.hide();
        errorBar.slideDown();
    }
}

function initPage() {
    $("#p_name").val(authUser.name);
    $("#p_surname").val(authUser.surname);
    $("#p_birthday").val(authUser.birthday);
    $("#p_age").val(authUser.age);
    $("#p_location").val(authUser.location);
    $("#p_country").val(authUser.country);
    $("#p_ability").val(authUser.ability).change();
    $("#p_gender").val(authUser.gender).change();
    $("#p_localCourts").val(authUser.localCourts);
    $("#p_email").val(authUser.email);
    $("#p_facebook").val(authUser.facebook);
    $("#p_twitter").val(authUser.twitter);
    $("#p_instagram").val(authUser.instagram);
    $("#p_aboutMe").val(authUser.aboutMe);

    firebase
        .storage()
        .ref("users")
        .child(authUser.uid + "/profile.jpg")
        .getDownloadURL()
        .then(imgUrl => {
            $("#p_profilePic").attr("src", imgUrl);

            loader.hide();
        }).catch(e => {
            console.log("No profile pic.");
            $("#p_profilePic").attr("src", defaultProfilePic);

            loader.hide();
        });
}

$(document).ready(function () {
    loader.show();
    hasFile = false;

    $("#p_saveButton").click(function () {
        saveProfile();
        return false;
    });

    fileUploader = document.getElementById("p_profilePicUpload");
    file = {};
    fileUploader.addEventListener("change", function (e) {
        file = e.target.files[0];

        if (file) {
            hasFile = true;
            var sizeKB = file.size / 1024;
            console.log("File Size:" + sizeKB);

            if (sizeKB > 350) {
                $("#p_profilePicUpload").val(null);
                file = {};
                showError("Please select an image with a size less than 350kb.");
            }
        }
    });

    var player = new URLSearchParams(window.location.search).get("player");

    if (player) {
        const dbRef = firebase.database().ref();
        dbRef.child('users').orderByChild('shareLink').equalTo(player).on('child_added', snap => {
            if (snap.val().verified) {
                authUser = snap.val();
                initPage();
            } else {
                logout();
                alert("Please verify your account first.");
                window.open("/", "_self").focus();
            }
        });
    }
    else {
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                const dbRef = firebase.database().ref();
                const userRef = dbRef.child("users/" + user.uid);
                userRef.on("value", snap => {
                    if (snap.val().verified) {
                        authUser = snap.val();
                        initPage();
                    } else {
                        logout();
                        alert("Please verify your account first.");
                        window.open("/", "_self").focus();
                    }
                });
            } else {
                alert("Please log in first.");
                window.open("/", "_self").focus();
            }
        });
    }
});


function showError(msg) {
    alert(msg);
}
