var template = "";
var loader = $("#customLoader");
var defaultProfilePic =
    "https://uploads-ssl.webflow.com/5f1abf099448a85d4dad24b1/5f30aa01afd43077d5cf9c10_default.svg";

var successBar = $("#success-bar");

var filter_Location = "";
var filter_Court = "";
var filter_Ability = "";
var filter_Age_Min = 0;
var filter_Age_Max = 99;
var filter_Gender = "";

var filteredCollection;
var paginationIndex = 1;

var authUserUID = null;

$(async function () {
    template = $("#player_tile_wrapper").html();
    $("#player_tile_wrapper").empty();

    $("#gender_all").addClass("highlight");
    $("#ability_all").addClass("highlight");

    loader.show();
    var playerList = [];

    const dbRef = firebase.database().ref("users");

    await firebase.auth().onAuthStateChanged((user) => {
        if (user) authUserUID = user.uid;
    });

    dbRef
        .once("value")
        .then((snap) => {
            snap.forEach(function (child) {
                let t = child.val();

                if (!t.isDisabled && t.verified && t.name && t.uid != authUserUID) {
                    t.age = calcAge(t);
                    playerList.push(t);
                }
            });
            return playerList;
        })
        .then((x) => {
            filteredCollection = playerList;
            renderTiles(
                paginate(filterByName(playerList), 9, paginationIndex),
                false
            );
        })
        .then((z) => {
            console.log(playerList);
            loader.hide();
        })
        .catch((error) => {
            console.log(error);
        });

    $("#loadMorePlayers").click(function () {
        paginationIndex++;
        renderTiles(
            paginate(filterByName(filteredCollection), 9, paginationIndex),
            true
        );
    });

    //Filter: Location
    $("#filter_location").keyup(function (e) {
        //if (e.keyCode == 13) {
        filter_Location = $("#filter_location").val();
        syncFilters();
        filterCollection(playerList);
        //}
    });

    //Filter: Court
    $("#filter_court").keyup(function (e) {
        //if (e.keyCode == 13) {
        filter_Court = $("#filter_court").val();
        syncFilters();
        filterCollection(playerList);
        //}
    });

    //Filter: Ability
    $(".filter-ability").click(function () {
        filter_Ability = $($(this).html()).html();

        $(".filter-ability").removeClass("highlight");
        $(this).addClass("highlight");

        if (filter_Ability.toLowerCase() === "all") filter_Ability = "";

        syncFilters();
        filterCollection(playerList);
    });

    //Filter: Age Min
    $("#filter_age_min").keyup(function (e) {
        //if (e.keyCode == 13) {
        filter_Age_Min = $("#filter_age_min").val();
        syncFilters();
        filterCollection(playerList);
        //}
    });

    //Filter: Age Max
    $("#filter_age_max").keyup(function (e) {
        //if (e.keyCode == 13) {
        filter_Age_Max = $("#filter_age_max").val();
        syncFilters();
        filterCollection(playerList);
        //}
    });

    //Filter: Gender
    $(".filter-gender").click(function () {
        filter_Gender = $($(this).html()).html();

        $(".filter-gender").removeClass("highlight");
        $(this).addClass("highlight");

        if (filter_Gender.toLowerCase() === "all") filter_Gender = "";

        syncFilters();
        filterCollection(playerList);
    });
});

function syncFilters() {
    //filter_Location = $('#filter_location').val();
    //filter_Court = $('#filter_court').val();
    //filter_Ability = $($(this).html()).html();
    //filter_Age_Min = $('#filter_age_min').val();
    //filter_Age_Max = $('#filter_age_max').val();
    //filter_Gender = $($(this).html()).html();
}

function filterCollection(collection) {
    console.log("Filter ~> Location:: " + filter_Location);
    console.log("Filter ~> Court:: " + filter_Court);
    console.log("Filter ~> Ability:: " + filter_Ability);
    console.log("Filter ~> Age Min:: " + filter_Age_Min);
    console.log("Filter ~> Age Max:: " + filter_Age_Max);
    console.log("Filter ~> Gender:: " + filter_Gender);

    filteredCollection = collection;

    if (filter_Location)
        filteredCollection = filteredCollection.filter(filterLocation);

    if (filter_Court) filteredCollection = filteredCollection.filter(filterCourt);

    if (filter_Ability)
        filteredCollection = filteredCollection.filter(filterAbility);

    if (filter_Age_Min)
        filteredCollection = filteredCollection.filter(filterMinAge);

    if (filter_Age_Max)
        filteredCollection = filteredCollection.filter(filterMaxAge);

    if (filter_Gender)
        filteredCollection = filteredCollection.filter(filterGender);

    paginationIndex = 1;
    //renderTiles(filterByName(filteredCollection), false);
    renderTiles(
        paginate(filterByName(filteredCollection), 9, paginationIndex),
        false
    );
}

function filterLocation(obj) {
    var val1 = obj.location.toLowerCase();
    var val2 = filter_Location.toLowerCase();

    return val1.indexOf(val2) >= 0;
}

function filterCourt(obj) {
    var val1 = obj.localCourts.toLowerCase();
    var val2 = filter_Court.toLowerCase();

    return val1.indexOf(val2) >= 0;
}

function filterAbility(obj) {
    var val1 = obj.ability.toLowerCase();
    var val2 = filter_Ability.toLowerCase();

    return val1 === val2;
}

function filterGender(obj) {
    var val1 = obj.gender.toLowerCase();
    var val2 = filter_Gender.toLowerCase();

    return val1 === val2;
}

function filterMinAge(obj) {
    return obj.age >= filter_Age_Min;
}

function filterMaxAge(obj) {
    return obj.age <= filter_Age_Max;
}

function renderTiles(collection, append) {
    if (!append) $("#player_tile_wrapper").empty();

    console.log("Render tiles:");

    $.each(collection, function (i, e) {
        //if (e.verified && !e.isDisabled) {
        var playerTile = template;

        playerTile = playerTile.replace("[PROFILE_PIC_ID]", e.uid);
        playerTile = playerTile.replace("[AVATAR_LETTER]", e.uid + "_letter");

        playerTile = playerTile.replace(
            'href="#"',
            'href="/player-page?player=' + e.shareLink + '"'
        );
        playerTile = playerTile.replace("[SURNAME]", e.surname);
        playerTile = playerTile.replace("[NAME]", e.name);
        playerTile = playerTile.replace("[AGE]", e.age);
        playerTile = playerTile.replace("[LOCATION]", e.location);
        playerTile = playerTile.replace("[ABILITY]", e.ability);
        playerTile = playerTile.replace("[COURTS]", e.localCourts);
        playerTile = playerTile.replace("[NAME]", e.name);

        $("#player_tile_wrapper").append(playerTile);

        if (e.profilePicURL) $("#" + e.uid).attr("src", e.profilePicURL);
        else {
            $("#" + e.uid).hide();
            var f = $.trim(e.name).substring(0, 1);
            var l = $.trim(e.surname).substring(0, 1);

            $("#" + e.uid + "_letter").html(f + l);
            //$("#" + e.uid + "_letter").html((($.trim(e.email)).substring(0, 1)).toUpperCase());
        }

        playerTile = "";
        //}
    });
}

function calcAge(t) {
    return new Date().getFullYear() - ((moment(t.birthday, "DD/MM/YYYY")).toDate()).getFullYear();
}

function filterByName(collection) {
    collection.sort(SortByName);
    return collection;
}

function SortByName(a, b) {
    var aName = a.name.toLowerCase();
    var bName = b.name.toLowerCase();
    return aName < bName ? -1 : aName > bName ? 1 : 0;
}

function paginate(array, page_size, page_number) {

    $("#loadMorePlayers").parent().show();

    var showing = page_size * page_number;
    var total = array.length;

    if (total < showing) showing = total;

    $("#paginate-x").html(showing);
    $("#paginate-y").html(total);

    if (total == showing) $("#loadMorePlayers").parent().hide();

    // human-readable page numbers usually start with 1, so we reduce 1 in the first argument
    return array.slice((page_number - 1) * page_size, page_number * page_size);
}
