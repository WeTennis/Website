var loader = $("#customLoader");
var encr_salt = null;
var encr_salt2 = null;

$(function () {
    loader.show();
    var verify = new URLSearchParams(window.location.search).get("token");

    var t = decodeURIComponent(verify);

    if (t) {

        const dbRef = firebase.database().ref();
        const clientRef = dbRef.child("Config");
        clientRef.on("value", async snap => {
            endpoint = snap.val().base + snap.val().endpoint_genericMail;
            xFrame = snap.val().xFrameTag;
            encr_salt = snap.val().salt;
            encr_salt2 = snap.val().salt2;


            var iv = CryptoJS.enc.Hex.parse(encr_salt2);
            var decrypted = CryptoJS.AES.decrypt(
                t.toString(),
                encr_salt,
                {
                    iv: iv,
                    mode: CryptoJS.mode.CBC,
                    padding: CryptoJS.pad.Pkcs7
                }
            );
            //console.log('   decrypted, by hand: ' + decrypted.toString(CryptoJS.enc.Utf8));

            var t_val = decrypted.toString(CryptoJS.enc.Utf8).split("|");

            
            const userRef = dbRef.child("users/" + t_val[0]);
            userRef.on("value", snap => {
                var vUser = snap.val();
                if (vUser) {
                    vUser.verified = true;

                    firebase
                        .database()
                        .ref("users/" + t_val[0])
                        .update(vUser)
                        .then(async x => {
                            await firebase
                                .auth()
                                .signInWithEmailAndPassword(t_val[1], t_val[2])
                                .then(function (usr) {
                                    if (usr) {
                                        authUser = snap.val();

                                        $.cookie('verified', true);
                                        console.log()

                                        window.open("/my-profile", "_self").focus();
                                    }
                                })
                        });
                }
                else {
                    alert("Account verification failed.");
                    window.open("/", "_self").focus();
                }
            });
            return;




        });




    }

});
