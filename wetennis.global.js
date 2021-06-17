

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
            $("#join_section").hide();
            $("#footer_join_now").hide();
            $("#about_us_link_button").hide();
        } else {
            console.log("User Session: Logged Out");
            $("#header_button").html("Join Us");
            $("#header_button").unbind('click');
            $("#header_button_logout_wrapper").hide();
            $("#hero_section").show();
            $("#join_section").show();
            $("#footer_join_now").show();
            $("#about_us_link_button").show();

            $("#header_button").attr("href", "/#join");
        }
    });
});

function changeHeaderButton() {

    $("#header_button").html("My Profile");
    $("#header_button").attr("href", "my-profile");
    $("#header_button").click(function () {
        window.open("/my-profile", "_self").focus();
    });
}
