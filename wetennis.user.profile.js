var authUser = {};
var loader = $("#customLoader");
var successBar = $("#success-bar");
var errorBar = $("#error-bar");

let file = {};
var hasFile;
var defaultProfilePic =
    "https://uploads-ssl.webflow.com/5f1abf099448a85d4dad24b1/5f30aa01afd43077d5cf9c10_default.svg";

async function logout() {
    await firebase
        .auth()
        .signOut()
        .then(function () { })
        .catch(function (error) { });
}

async function saveProfile() {
    if (!validateForm()) return;

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
        aboutMe: $("#p_aboutMe").val()
    };

    profile.shareLink = (profile.name + "-" + profile.surname)
        .replace(/\s+/g, "-")
        .toLowerCase()
        .latinize();

    try {
        await firebase
            .database()
            .ref("users/" + authUser.uid)
            .update(profile)
            .then(async (x) => {
                if (hasFile)
                    await firebase
                        .storage()
                        .ref("users")
                        .child(authUser.uid + "/profile.jpg")
                        .put(file)
                        .then(async (y) => {
                            await firebase
                                .storage()
                                .ref("users")
                                .child(authUser.uid + "/profile.jpg")
                                .getDownloadURL()
                                .then(async (imgUrl) => {
                                    profile.profilePicURL = imgUrl;
                                    await firebase
                                        .database()
                                        .ref("users/" + authUser.uid)
                                        .update(profile)
                                        .then((c) => {
                                            console.log(y);

                                            successBar.slideDown("slow").delay(3500).slideUp("slow");
                                            initPage();
                                        });
                                });
                        });
                else {
                    successBar.slideDown("slow").delay(3500).slideUp("slow");
                    initPage();
                }
            })
            .catch((error) => {
                console.log(error.message);
                loader.hide();
                //errorBar.slideDown();
            });
    } catch (e) {
        console.log(e.message);
        loader.hide();
        //errorBar.slideDown();
    }
}

function initPage() {
    $("#p_name").val(authUser.name);
    $("#p_surname").val(authUser.surname);
    $("#p_birthday").val(authUser.birthday);
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

    //var letter = (($.trim(authUser.email)).substring(0, 1)).toUpperCase();

    if (authUser.name && authUser.surname) {
        var f = $.trim(authUser.name).substring(0, 1);
        var l = $.trim(authUser.surname).substring(0, 1);
        $("#p_avatar_letter").html(f + l);
    }

    //console.log(":: Letter ~> " + letter);

    firebase
        .storage()
        .ref("users")
        .child(authUser.uid + "/profile.jpg")
        .getDownloadURL()
        .then((imgUrl) => {
            $("#p_profilePic").attr("src", imgUrl);

            loader.hide();
        })
        .catch((e) => {
            console.log("No profile pic.");
            //$("#p_profilePic").attr("src", defaultProfilePic);
            //$("#p_avatar_letter").html($("#p_email").val().substring(1, 1));

            loader.hide();
        });
}

$(document).ready(function () {
    loader.show();

    hasFile = false;

    $("#nav_button").hide();
    $("#p_email").prop("disabled", true);

    $("#p_saveButton").click(function () {
        saveProfile();
        return false;
    });

    console.log($.cookie("verified"));

    if ($.cookie("verified") == "true") {
        $.cookie("verified", false);
        $("#successTextMessage").html("Account verified successfully.");
        $("#success-bar").slideDown("slow").delay(3500).slideUp("slow");
    }

    fileUploader = document.getElementById("p_profilePicUpload");
    file = {};
    fileUploader.addEventListener("change", function (e) {
        file = e.target.files[0];

        if (file) {
            hasFile = true;
            var sizeKB = file.size / 1024;
            console.log("File Size:" + sizeKB);
            $("#p_upload_file_text").html(file.name);

            if (sizeKB > 4000) {
                $("#p_profilePicUpload").val(null);
                file = {};
                showError("Please select an image with a size less than 4 MB.");
            }
        }
    });

    var player = new URLSearchParams(window.location.search).get("player");

    if (player) {
        const dbRef = firebase.database().ref();
        dbRef
            .child("users")
            .orderByChild("shareLink")
            .equalTo(player)
            .on("child_added", (snap) => {
                if (snap.val().verified) {
                    authUser = snap.val();
                    initPage();

                    firebase.auth().onAuthStateChanged((user) => {
                        if (user) {
                            const dbRef = firebase.database().ref();
                            const userRef = dbRef.child("users/" + user.uid);
                            userRef.on("value", (snap) => {
                                console.log(snap.val());
                                if (snap.val().isAdmin) {
                                    $("#p_disableButton_wrapper").show();

                                    $("#p_disableButton").click(async function () {
                                        console.log("disable account");

                                        authUser.isDisabled = true;

                                        await firebase
                                            .database()
                                            .ref("users/" + authUser.uid)
                                            .update(authUser)
                                            .then((x) => {
                                                window.open("/", "_self").focus();
                                            });

                                        return false;
                                    });
                                }
                            });
                        } else {
                            // nothing
                        }
                    });
                } else {
                    logout();
                    alert("Please verify your account first.");
                    window.open("/", "_self").focus();
                }
            });
    } else {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                const dbRef = firebase.database().ref();
                const userRef = dbRef.child("users/" + user.uid);
                userRef.on("value", (snap) => {
                    if (snap.val().isDisabled) {
                        alert("Account disabled by admin.");
                        window.open("/", "_self").focus();
                        return;
                    }

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
                //alert("Please log in first.");
                window.open("/", "_self").focus();
            }
        });
    }
});

function showError(msg) {
    alert(msg);
}

function validateForm() {
    var name = $("#p_name").val();
    if (/\d/.test(name)) {
        showErrorMessage("Name cannot contain numbers");
        return false;
    }
    if (!name) {
        showErrorMessage("Name cannot be empty");
        return false;
    }

    var surname = $("#p_surname").val();
    if (/\d/.test(surname)) {
        showErrorMessage("Surname cannot contain numbers");
        return false;
    }
    if (!surname) {
        showErrorMessage("Surname cannot be empty");
        return false;
    }

    var birthday = $("#p_birthday").val();
    if (!birthday) {
        showErrorMessage("Birthday cannot be empty");
        return false;
    }
    var dateRegex = /^(?=\d)(?:(?:31(?!.(?:0?[2469]|11))|(?:30|29)(?!.0?2)|29(?=.0?2.(?:(?:(?:1[6-9]|[2-9]\d)?(?:0[48]|[2468][048]|[13579][26])|(?:(?:16|[2468][048]|[3579][26])00)))(?:\x20|$))|(?:2[0-8]|1\d|0?[1-9]))([-.\/])(?:1[012]|0?[1-9])\1(?:1[6-9]|[2-9]\d)?\d\d(?:(?=\x20\d)\x20|$))?(((0?[1-9]|1[012])(:[0-5]\d){0,2}(\x20[AP]M))|([01]\d|2[0-3])(:[0-5]\d){1,2})?$/;
    var res = dateRegex.test(birthday);
    console.log(res);
    if (!res) {
        showErrorMessage("Please enter a valid birthday date: Example: 28/06/1991");
        return false;
    }

    var location = $("#p_location").val();
    if (!location) {
        showErrorMessage("Location cannot be empty");
        return false;
    }

    var country = $("#p_country").val();
    if (!country) {
        showErrorMessage("Country cannot be empty");
        return false;
    }

    var courts = $("#p_localCourts").val();
    if (!courts) {
        showErrorMessage("Local Courts cannot be empty");
        return false;
    }

    var fb = $("#p_facebook").val();
    if (fb && !isUrlValid(fb)) {
        showErrorMessage(
            "Please enter a valid Facebook link (eg. https://facebook.com/your-page-link) or leave the field empty"
        );
        return false;
    }

    var tw = $("#p_twitter").val();
    if (tw && !isUrlValid(tw)) {
        showErrorMessage(
            "Please enter a valid Twitter link (eg. https://twitter.com/your-page-link) or leave the field empty"
        );
        return false;
    }

    var inst = $("#p_instagram").val();
    if (inst && !isUrlValid(inst)) {
        showErrorMessage(
            "Please enter a valid Instagram link (eg. https://instagram.com/your-page-link) or leave the field empty"
        );
        return false;
    }

    return true;
}

function isUrlValid(url) {
    return /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(
        url
    );
}

function showErrorMessage(msg) {
    $("#errorTextMessage").html(msg);
    $("#error-bar").slideDown("slow").delay(3500).slideUp("slow");
}

function showSuccessMessage(msg) {
    $("#successTextMessage").html(msg);
    $("#success-bar").slideDown("slow").delay(3500).slideUp("slow");
}
