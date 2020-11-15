const databasePromise = (idb) => {
    var dbPromise = idb.open("football-PWA", 1, function (upgradeDb) {
        if (!upgradeDb.objectStoreNames.contains("fav_team")) {
            var indexTimFav = upgradeDb.createObjectStore("fav_team", {
                keyPath: "id"
            });
            indexTimFav.createIndex("teamName", "name", {
                unique: false
            });
        }

        if (!upgradeDb.objectStoreNames.contains("fav_match")) {
            var indexMatchFav = upgradeDb.createObjectStore("fav_match", {
                keyPath: "id"
            });
            indexMatchFav.createIndex("homeTeam", "match.homeTeam.name", {
                unique: false
            });
            indexMatchFav.createIndex("awayTeam", "match.awayTeam.name", {
                unique: false
            });
        }
    });

    return dbPromise;
}