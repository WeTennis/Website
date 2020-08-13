var loader = $("#customLoader");

$(function () {
    loader.show();
    var verify = new URLSearchParams(window.location.search).get("v");

    if (verify) {
        const dbRef = firebase.database().ref();
        const userRef = dbRef.child("users/" + verify);
        userRef.on("value", snap => {
            var vUser = snap.val();
            if (vUser) {
                vUser.verified = true;

                firebase
                    .database()
                    .ref("users/" + verify)
                    .update(vUser)
                    .then(async x => {
                        authUser = snap.val();

                        alert("Account verified. Please log in.");

                        window.open("/", "_self").focus();
                    });
            }
            else {
                alert("Account verification failed.");
                window.open("/", "_self").focus();
            }
        });
        return;
    }

});
