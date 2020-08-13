

$(function () {
    $("#header_button_logout").click(async function () {
        console.log("logout");

        await firebase
            .auth()
            .signOut()
            .then(function () {
                window.open("/", "_self").focus();
            })
            .catch(function (error) { });
    });

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            console.log("User Session: Logged In " + user.uid);
            console.log(user);
            changeHeaderButton();
            $("#header_button_logout_wrapper").show();
            $("#hero_section").hide();
        } else {
            console.log("User Session: Logged Out");
            $("#header_button").html("Join Us");
            $("#header_button").unbind('click');
            $("#header_button_logout_wrapper").hide();
            $("#hero_section").show();
        }
    });
});

function changeHeaderButton() {

    $("#header_button").html("My Profile");
    $("#header_button").click(function () {
        window.open("/my-profile", "_self").focus();
    });
}
